import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { adminClient, userClient } from "./supabase/server";
import { LIMITS, hashed, retryIn, take } from "./limits";
import { hashBackup, newBackupCodes, retry, verifiedTotp, type BackupStore, type TotpApi } from "./mfaRules";

// Two-factor sign-in, the server half: who is signed in and at what level, their authenticator apps (Supabase Auth's
// own MFA), backup codes (038_mfa.sql) and the code limit. The rules are in mfaRules.ts.

export type Me = { userId: string; email: string; aal: string | null; sb: SupabaseClient };

/** The signed-in person from their cookie session, at whatever level. Never getCtx: it sends aal1 sessions to /mfa. */
export async function me(): Promise<Me | null> {
  const sb = await userClient();
  const { data } = await sb.auth.getClaims();
  const c = data?.claims;
  if (!c?.sub) return null;
  return { userId: c.sub, email: (c.email as string) ?? "", aal: (c.aal as string | undefined) ?? null, sb };
}

type DbRes<T> = { data: T | null; error: { message: string; code?: string } | null; status?: number };
/** A database error as something retry() can read: a 5xx or a network failure is a hiccup. */
function must<T>(res: DbRes<T>): T {
  if (res.error) throw Object.assign(new Error(res.error.message), { status: res.status, code: res.error.code });
  return res.data as T;
}

/** Every authenticator app on file for this person, verified or not, read from Supabase Auth. */
export async function totpFactors(userId: string) {
  return retry(async () => {
    const { data, error } = await adminClient().auth.admin.mfa.listFactors({ userId });
    if (error) throw error;
    return (data?.factors ?? []).filter((f) => f.factor_type === "totp");
  });
}

/** The person's verified authenticator apps. */
export const verifiedFactors = async (userId: string) => verifiedTotp(await totpFactors(userId));

/** sb.auth.mfa as mfaRules.verifyTotp calls it. Verifying moves this session to aal2 (new cookies). */
export const totpApi = (sb: SupabaseClient): TotpApi => ({
  challenge: async (p) => {
    const r = await sb.auth.mfa.challenge(p);
    return { data: r.data ? { id: r.data.id } : null, error: r.error };
  },
  verify: (p) => sb.auth.mfa.verify(p),
});

/** Counts one code try for this person: an error to show when they're over 5 in 10 minutes. */
export async function codeTry(userId: string): Promise<string | null> {
  const wait = await take(hashed("mfa:user", userId), LIMITS.mfaCode);
  return wait ? `Too many tries. ${retryIn(wait)}` : null;
}

/** Opening a new authenticator app, which makes a factor in Supabase Auth each time. */
export async function enrollTry(userId: string): Promise<string | null> {
  const wait = await take(hashed("mfa:enroll", userId), LIMITS.mfaEnroll);
  return wait ? `Too many tries. ${retryIn(wait)}` : null;
}

export const backupStore: BackupStore = {
  consume: async (userId, hash, attempt) => Boolean(must(await adminClient().rpc("use_backup_code", { p_user: userId, p_hash: hash, p_attempt: attempt }))),
};

/** Gives back a code its try had used, when the step after it failed. */
export async function releaseBackup(userId: string, attempt: string) {
  await retry(async () => must(await adminClient().rpc("release_backup_code", { p_user: userId, p_attempt: attempt })));
}

/** Ten new backup codes in place of the old ones. Only their hashes are kept; the codes are shown once. */
export async function saveBackupCodes(userId: string): Promise<string[]> {
  const codes = newBackupCodes();
  const hashes = await Promise.all(codes.map((c) => hashBackup(userId, c)));
  await retry(async () => must(await adminClient().rpc("replace_backup_codes", { p_user: userId, p_hashes: hashes })));
  return codes;
}

export async function backupLeft(userId: string): Promise<number> {
  const res = await adminClient().from("mfa_backup_codes").select("id", { count: "exact", head: true }).eq("user_id", userId).is("used_at", null);
  must(res);
  return res.count ?? 0;
}

export async function clearBackupCodes(userId: string) {
  await retry(async () => must(await adminClient().from("mfa_backup_codes").delete().eq("user_id", userId)));
}

/** The person's workspaces that require 2FA. */
export async function requiringWorkspaces(userId: string): Promise<{ id: string; name: string }[]> {
  const rows = must(await adminClient().from("members").select("workspace_id, workspaces!inner(name, require_mfa)").eq("user_id", userId).eq("workspaces.require_mfa", true)) as unknown as { workspace_id: string; workspaces: { name: string } }[];
  return (rows ?? []).map((r) => ({ id: r.workspace_id, name: r.workspaces.name }));
}

/** The workspace of the person's first membership, for sign-in events in the audit log. */
export async function firstWorkspaceId(userId: string): Promise<string | null> {
  const { data } = await adminClient().from("members").select("workspace_id").eq("user_id", userId).order("created_at").limit(1);
  return (data?.[0]?.workspace_id as string | undefined) ?? null;
}

/** Removes an authenticator app as the server. Supabase Auth signs the person out everywhere when it was verified. */
export async function deleteFactor(userId: string, id: string) {
  await retry(async () => {
    const { error } = await adminClient().auth.admin.mfa.deleteFactor({ userId, id });
    if (error && error.code !== "mfa_factor_not_found" && error.status !== 404) throw error;
  });
}

/** After a backup code: the lost authenticator apps go, so do the other codes, and this browser gets a new session
 *  (Supabase Auth ended every session when the app went). "signed_out" when that last step failed: the person signs
 *  in with their password again, now without 2FA. Throws when the apps couldn't be removed, so the code can go back. */
export async function recoverWithBackup(m: Me): Promise<"ok" | "signed_out"> {
  for (const f of verifiedTotp(await totpFactors(m.userId))) await deleteFactor(m.userId, f.id);
  await clearBackupCodes(m.userId).catch((e) => console.error("mfa: clear codes:", e instanceof Error ? e.message : e));
  try {
    await retry(async () => {
      const { data, error } = await adminClient().auth.admin.generateLink({ type: "magiclink", email: m.email });
      if (error) throw error;
      const res = await m.sb.auth.verifyOtp({ token_hash: data.properties.hashed_token, type: "magiclink" });
      if (res.error) throw res.error;
    });
    return "ok";
  } catch (e) {
    console.error("mfa: new session:", e instanceof Error ? e.message : e);
    await m.sb.auth.signOut({ scope: "local" }).catch(() => {});
    return "signed_out";
  }
}

/** The QR code Supabase Auth gives (an SVG behind a data: prefix that isn't escaped), as a safe image address. */
export function qrSrc(qr: string): string {
  const svg = qr.replace(/^data:image\/svg\+xml;(utf-8|charset=utf-8),/, "");
  return svg.startsWith("data:") ? svg : `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
