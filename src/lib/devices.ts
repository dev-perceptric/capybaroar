import "server-only";
import { randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { after } from "next/server";
import { adminClient } from "@/lib/supabase/server";
import { appUrl } from "@/lib/channels";
import { sendEmail } from "@/lib/alerts";
import { audit } from "@/lib/audit";
import { firstWorkspaceId } from "@/lib/mfa";
import { alertFor, cleanDevice, deviceLabel, newDeviceMail, passwordChangedMail } from "@/lib/deviceRules";

// New-device sign-in alerts (044_login_devices.sql). Each browser gets a random id in an httpOnly cookie on its first
// sign-in. A sign-in on a device this person hasn't used before emails them, unless it's their first device. Called
// wherever a sign-in finishes: the password, Google or a link, and the two-factor step. Never throws: a failure here
// never stops someone signing in.

const COOKIE = "cb_device";

export async function noteSignIn(u: { userId: string; email: string | null; ip: string }) {
  try {
    const jar = await cookies();
    let device = cleanDevice(jar.get(COOKIE)?.value);
    if (!device) {
      device = randomBytes(24).toString("base64url");
      jar.set(COOKIE, device, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 400 });
    }
    const label = deviceLabel((await headers()).get("user-agent") ?? "");
    const db = adminClient();
    const { data, error } = await db.from("login_devices").select("device").eq("user_id", u.userId);
    if (error) throw new Error(error.message);
    const known = (data ?? []).map((d) => d.device as string);
    const now = new Date().toISOString();
    if (known.includes(device)) {
      await db.from("login_devices").update({ last_seen: now, label }).eq("user_id", u.userId).eq("device", device);
      return;
    }
    await db.from("login_devices").upsert({ user_id: u.userId, device, label, last_seen: now }, { onConflict: "user_id,device" });
    if (!alertFor(known, device)) return;
    // The log entry and the email go out after the page answers, so signing in never waits on the mail server.
    const when = new Date();
    after(async () => {
      await audit({ workspaceId: await firstWorkspaceId(u.userId), actorId: u.userId, actorLabel: u.email, action: "auth.new_device", meta: { device: label }, ip: u.ip });
      if (!u.email) return;
      const m = newDeviceMail({ device: label, ip: u.ip, when, appUrl: appUrl() });
      await sendEmail([u.email], m.subject, m);
    });
  } catch (e) {
    console.error("devices:", e instanceof Error ? e.message : e);
  }
}

/** After a new password: the email that says so. Never throws. */
export async function notePasswordChanged(email: string | null) {
  if (!email) return;
  const m = passwordChangedMail({ when: new Date(), appUrl: appUrl() });
  after(() => sendEmail([email], m.subject, m).catch(() => false));
}
