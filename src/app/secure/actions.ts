"use server";

import { headers } from "next/headers";
import { adminClient } from "@/lib/supabase/server";
import { audit } from "@/lib/audit";
import { trustedIp } from "@/lib/clientIp";
import { firstWorkspaceId } from "@/lib/mfa";
import { readSecureToken } from "@/lib/deviceRules";
import { secureKey } from "@/lib/devices";
import { LIMITS, hashed, retryIn, take } from "@/lib/limits";

export type SecureState = { done?: boolean; error?: string };

/**
 * "Sign out everywhere" on the page the new-device email's "This wasn't me" opens. Ends every session the person has,
 * forgets the device in the email (so it alerts again) and logs it. A button, never the link itself, so a mail
 * scanner opening links can't sign anyone out.
 */
export async function secureAccount(_: SecureState, form: FormData): Promise<SecureState> {
  const who = readSecureToken(String(form.get("token") ?? ""), secureKey(), new Date());
  if (!who) return { error: "This link expired. Sign in and use Settings to sign out other devices, or reset your password." };
  const ip = trustedIp(await headers());
  const wait = await take(hashed("secure:user", who.userId), LIMITS.resetEmail);
  if (wait) return { error: `Too many tries. ${retryIn(wait)}` };
  const db = adminClient();
  const { error } = await db.rpc("revoke_user_sessions", { p_user: who.userId });
  if (error) {
    console.error("secure:", error.message);
    return { error: "Couldn't sign out every device. Try again in a minute." };
  }
  await db.from("login_devices").delete().eq("user_id", who.userId).eq("device", who.device);
  const { data } = await db.auth.admin.getUserById(who.userId);
  await audit({ workspaceId: await firstWorkspaceId(who.userId), actorId: who.userId, actorLabel: data.user?.email ?? null, action: "auth.secured", ip });
  return { done: true };
}
