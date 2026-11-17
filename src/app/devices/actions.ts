"use server";

import { cookies, headers } from "next/headers";
import { me, firstWorkspaceId } from "@/lib/mfa";
import { adminClient } from "@/lib/supabase/server";
import { audit } from "@/lib/audit";
import { trustedIp } from "@/lib/clientIp";
import { cleanDevice } from "@/lib/deviceRules";
import { DEVICE_COOKIE } from "@/lib/devices";

// Settings › Your account › Signed-in devices (src/components/Devices.tsx): the devices this person has signed in on
// (044_login_devices.sql), sign out every other one, and forget one so it alerts again next time.

export type DeviceRow = { id: string; label: string; lastSeen: string; current: boolean };

export async function loadDevices(): Promise<DeviceRow[]> {
  const m = await me();
  if (!m) throw new Error("Sign in again");
  const here = cleanDevice((await cookies()).get(DEVICE_COOKIE)?.value);
  const { data, error } = await adminClient().from("login_devices").select("device, label, last_seen").eq("user_id", m.userId).order("last_seen", { ascending: false }).limit(50);
  // Until migration 044 is in, the list is empty.
  if (error) return [];
  return (data ?? []).map((d) => ({ id: d.device as string, label: (d.label as string) || "A browser", lastSeen: d.last_seen as string, current: d.device === here }));
}

/** Signs out every session but this one. */
export async function signOutOthers(): Promise<{ error?: string }> {
  const m = await me();
  if (!m) return { error: "Sign in again" };
  const { error } = await m.sb.auth.signOut({ scope: "others" });
  if (error) return { error: "Couldn't sign out other devices. Try again." };
  const here = cleanDevice((await cookies()).get(DEVICE_COOKIE)?.value);
  // The other devices alert again if they sign back in.
  if (here) await adminClient().from("login_devices").delete().eq("user_id", m.userId).neq("device", here);
  await audit({ workspaceId: await firstWorkspaceId(m.userId), actorId: m.userId, actorLabel: m.email, action: "auth.sign_out_others", ip: trustedIp(await headers()) });
  return {};
}

/** Forgets one device, so signing in there emails again. */
export async function forgetDevice(id: string): Promise<{ error?: string }> {
  const m = await me();
  if (!m) return { error: "Sign in again" };
  const device = cleanDevice(id);
  if (!device) return { error: "Device not found" };
  await adminClient().from("login_devices").delete().eq("user_id", m.userId).eq("device", device);
  return {};
}
