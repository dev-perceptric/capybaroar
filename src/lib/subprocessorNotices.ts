import "server-only";
import { createHash } from "node:crypto";
import SUBS from "../../compliance/subprocessors.json";
import { adminClient } from "./supabase/server";
import { open } from "./crypto";
import { mailReady, sendEmail } from "./alerts";
import { appUrl } from "./channels";
import { toAnnounce, type SubsFile, type Vendor } from "./noticeRules";

const emailHash = (email: string) => createHash("sha256").update(email.trim().toLowerCase()).digest("hex").slice(0, 40);
const SITE = () => process.env.SITE_URL || "https://capybaroar.com";

/** Every workspace owner's email, and every confirmed subscriber with their unsubscribe link. */
async function recipients(): Promise<{ email: string; unsubscribe: string | null }[]> {
  const db = adminClient();
  const out = new Map<string, string | null>();
  const { data: owners } = await db.from("members").select("user_id").eq("role", "owner");
  for (const id of [...new Set((owners ?? []).map((o) => o.user_id as string))]) {
    const { data } = await db.auth.admin.getUserById(id);
    if (data.user?.email) out.set(data.user.email.toLowerCase(), null);
  }
  const { data: subs } = await db.from("subprocessor_subscribers").select("email, unsub_sealed").not("confirmed_at", "is", null).is("unsubscribed_at", null);
  for (const s of subs ?? []) {
    try {
      const token = open(s.unsub_sealed as string, `unsub:${s.email}`);
      out.set((s.email as string).toLowerCase(), `${appUrl()}/api/subprocessors/unsubscribe?t=${token}`);
    } catch {
      out.set((s.email as string).toLowerCase(), null);
    }
  }
  return [...out].map(([email, unsubscribe]) => ({ email, unsubscribe }));
}

async function announce(v: Vendor) {
  const db = adminClient();
  await db.from("subprocessor_notices").upsert({ vendor_id: v.id, starts: v.starts }, { onConflict: "vendor_id,starts", ignoreDuplicates: true });
  const { data: sent } = await db.from("subprocessor_notice_sends").select("email_hash").eq("vendor_id", v.id).eq("starts", v.starts!);
  const already = new Set((sent ?? []).map((r) => r.email_hash as string));
  const when = new Date(`${v.starts}T00:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
  for (const r of await recipients()) {
    const h = emailHash(r.email);
    if (already.has(h)) continue;
    // One email per address, so nobody sees anyone else's address.
    const ok = await sendEmail([r.email], `New Capybaroar subprocessor from ${when}: ${v.name}`, {
      title: `${v.name} starts on ${when}`,
      body: `From ${when}, ${v.name} (${v.location}) will help run Capybaroar: ${v.purpose.toLowerCase()}. It will handle: ${v.data.toLowerCase()}. If you object, reply to hello@capybaroar.com before then.${r.unsubscribe ? ` To stop these emails: ${r.unsubscribe}` : ""}`,
      button: "See all subprocessors",
      href: `${SITE()}/subprocessors`,
    });
    if (!ok) throw new Error(`notice to one address failed for ${v.id}; the next run continues`);
    await db.from("subprocessor_notice_sends").insert({ vendor_id: v.id, starts: v.starts, email_hash: h });
  }
  await db.from("subprocessor_notices").update({ done_at: new Date().toISOString() }).eq("vendor_id", v.id).eq("starts", v.starts!);
}

/** Hourly: sends any notice still due. Stops at the first failed email; the next run picks up from there. */
export async function sendSubprocessorNotices(today = new Date().toISOString().slice(0, 10)) {
  if (!mailReady()) return;
  const { data: done, error } = await adminClient().from("subprocessor_notices").select("vendor_id, starts").not("done_at", "is", null);
  if (error) throw new Error(error.message);
  for (const v of toAnnounce(SUBS as unknown as SubsFile, (done ?? []) as { vendor_id: string; starts: string }[], today)) await announce(v);
}
