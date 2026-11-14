import "server-only";
import { adminClient } from "./supabase/server";
import { hashToken, newToken, seal } from "./crypto";
import { sendEmail } from "./alerts";
import { appUrl } from "./channels";
import { LIMITS, hashed, takeAll } from "./limits";

/**
 * Sign an address up for subprocessor change notices and send the confirm email. Answers the same way whether the
 * address is new, waiting or already confirmed, so the form can't be used to learn who signed up.
 */
export async function subscribe(email: string, ip: string): Promise<"sent" | "limited"> {
  const wait = await takeAll([
    { bucket: hashed("subs-ip", ip || "none"), l: LIMITS.subscribeIp },
    { bucket: hashed("subs-email", email), l: LIMITS.subscribeEmail },
  ]);
  if (wait) return "limited";
  const db = adminClient();
  const { data: had } = await db.from("subprocessor_subscribers").select("id, confirmed_at, unsubscribed_at").eq("email", email).maybeSingle();
  if (had?.confirmed_at && !had.unsubscribed_at) return "sent";
  const confirm = newToken();
  if (had) {
    const { error } = await db.from("subprocessor_subscribers").update({ confirm_hash: hashToken(confirm), unsubscribed_at: null, confirmed_at: null }).eq("id", had.id);
    if (error) throw new Error(error.message);
  } else {
    const unsub = newToken();
    const { error } = await db.from("subprocessor_subscribers").insert({ email, confirm_hash: hashToken(confirm), unsub_hash: hashToken(unsub), unsub_sealed: seal(unsub, `unsub:${email}`) });
    if (error) throw new Error(error.message);
  }
  await sendEmail([email], "Confirm Capybaroar subprocessor notices", {
    title: "Confirm your email",
    body: "You asked to hear from Capybaroar before a new subprocessor starts handling customer data. Confirm to start getting these emails. If you didn't ask, ignore this email.",
    button: "Confirm",
    href: `${appUrl()}/api/subprocessors/confirm?t=${confirm}`,
  });
  return "sent";
}

/** Confirm from the email link. False when the link is unknown or already used. */
export async function confirmSubscriber(token: string): Promise<boolean> {
  const { data, error } = await adminClient().from("subprocessor_subscribers").update({ confirmed_at: new Date().toISOString(), confirm_hash: null }).eq("confirm_hash", hashToken(token)).select("id").maybeSingle();
  if (error) throw new Error(error.message);
  return !!data;
}

/** Stop the emails from the unsubscribe link in each notice. */
export async function unsubscribe(token: string): Promise<boolean> {
  const { data, error } = await adminClient().from("subprocessor_subscribers").update({ unsubscribed_at: new Date().toISOString() }).eq("unsub_hash", hashToken(token)).select("id").maybeSingle();
  if (error) throw new Error(error.message);
  return !!data;
}
