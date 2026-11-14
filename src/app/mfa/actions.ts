"use server";

import { randomUUID } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { audit } from "@/lib/audit";
import { trustedIp } from "@/lib/clientIp";
import { safeNext } from "@/proxy";
import { WORKSPACE_COOKIE } from "@/lib/session";
import { BRAND_COOKIE } from "@/lib/brands";
import { adminClient } from "@/lib/supabase/server";
import {
  backupLeft,
  backupStore,
  clearBackupCodes,
  codeTry,
  deleteFactor,
  enrollTry,
  firstWorkspaceId,
  me,
  qrSrc,
  recoverWithBackup,
  releaseBackup,
  requiringWorkspaces,
  saveBackupCodes,
  totpApi,
  totpFactors,
  verifiedFactors,
  type Me,
} from "@/lib/mfa";
import { codeKind, mfaNext, redeemBackup, retry, verifiedTotp, verifyTotp } from "@/lib/mfaRules";
import type { AuthState } from "@/app/login/actions";

// Two-factor sign-in: the code after a password or Google (/mfa), and setting it up or turning it off (TwoFactor).
// These take the cookie session at any level (lib/mfa.ts me()), never getCtx, which sends aal1 sessions here.
// Codes and secrets never go into the audit log.

const WRONG = "That code didn't work";
const FAILED = "Couldn't check the code. Try again.";
const ip = async () => trustedIp(await headers());

/** The workspace an account event shows in: the one open in the switcher, else the first membership. */
async function eventWorkspace(userId: string): Promise<string | null> {
  const want = (await cookies()).get(WORKSPACE_COOKIE)?.value;
  if (want) {
    const { data } = await adminClient().from("members").select("workspace_id").eq("user_id", userId).eq("workspace_id", want).maybeSingle();
    if (data) return want;
  }
  return firstWorkspaceId(userId);
}

/** A code from the app (against each verified app) or a backup code (used up). null when it worked. */
async function secondFactor(m: Me, factorIds: string[], code: string): Promise<string | null> {
  const kind = codeKind(code);
  if (kind === "totp") {
    for (const id of factorIds) {
      const r = await verifyTotp(totpApi(m.sb), id, code);
      if (r.ok) return null;
      if (r.reason === "failed") return FAILED;
    }
    return WRONG;
  }
  if (kind === "backup") {
    try {
      return (await redeemBackup(backupStore, m.userId, code)) === "ok" ? null : WRONG;
    } catch (e) {
      console.error("mfa: backup code:", e instanceof Error ? e.message : e);
      return FAILED;
    }
  }
  return WRONG;
}

/** /mfa: the code after a password or Google. A backup code removes the lost app and opens /mfa/setup. */
export async function verifyMfa(_: AuthState, form: FormData): Promise<AuthState> {
  const m = await me();
  if (!m) redirect("/login");
  const next = mfaNext(String(form.get("next") ?? ""), safeNext);
  const factors = await verifiedFactors(m.userId);
  if (!factors.length || m.aal === "aal2") redirect(next);
  const code = String(form.get("code") ?? "");
  const kind = codeKind(code);
  if (!kind) return { error: WRONG };
  const stop = await codeTry(m.userId);
  if (stop) return { error: stop };
  const [addr, ws] = await Promise.all([ip(), firstWorkspaceId(m.userId)]);
  const who = { workspaceId: ws, actorId: m.userId, actorLabel: m.email, ip: addr };
  const failed = (reason: string) => audit({ ...who, action: "auth.sign_in_failed", meta: { reason, step: "2fa" } });

  if (kind === "totp") {
    const err = await secondFactor(m, factors.map((f) => f.id), code);
    if (err === WRONG) await failed("wrong_code");
    if (err) return { error: err };
    await audit({ ...who, action: "auth.sign_in", meta: { second_factor: "totp" } });
    redirect(next);
  }

  const attempt = randomUUID();
  let used: "ok" | "wrong";
  try {
    used = await redeemBackup(backupStore, m.userId, code, { attempt });
  } catch (e) {
    console.error("mfa: backup code:", e instanceof Error ? e.message : e);
    return { error: FAILED };
  }
  if (used !== "ok") {
    await failed("wrong_backup_code");
    return { error: WRONG };
  }
  let done: "ok" | "signed_out";
  try {
    done = await recoverWithBackup(m);
  } catch (e) {
    // The app is still there: give the code back so the same code works on the next try.
    console.error("mfa: recover:", e instanceof Error ? e.message : e);
    await releaseBackup(m.userId, attempt).catch((x) => console.error("mfa: release:", x instanceof Error ? x.message : x));
    return { error: FAILED };
  }
  await audit({ ...who, action: "auth.mfa_disabled", meta: { via: "backup_code" } });
  await audit({ ...who, action: "auth.sign_in", meta: { second_factor: "backup_code" } });
  if (done === "signed_out") redirect("/login");
  redirect(`/mfa/setup${next === "/calendar" ? "" : `?next=${encodeURIComponent(next)}`}`);
}

export type TwoFactorState = {
  on: boolean;
  /** Backup codes not used yet. */
  left: number;
  /** Names of this person's workspaces that require 2FA (it can't be turned off while there's one). */
  required: string[];
};

export async function loadTwoFactor(): Promise<TwoFactorState> {
  const m = await me();
  if (!m) throw new Error("Sign in again");
  const [factors, left, req] = await Promise.all([verifiedFactors(m.userId), backupLeft(m.userId), requiringWorkspaces(m.userId)]);
  return { on: factors.length > 0, left: factors.length ? left : 0, required: req.map((w) => w.name) };
}

export type Enrollment = { factorId: string; qr: string; secret: string };

/** "Turn on 2FA": a new authenticator app in Supabase Auth, with its QR code and secret. Set-ups never finished go first. */
export async function startTwoFactor(): Promise<Enrollment | { error: string }> {
  const m = await me();
  if (!m) return { error: "Sign in again" };
  const stop = await enrollTry(m.userId);
  if (stop) return { error: stop };
  try {
    const all = await totpFactors(m.userId);
    if (verifiedTotp(all).length) return { error: "2FA is already on" };
    for (const f of all) await deleteFactor(m.userId, f.id);
    const { data, error } = await m.sb.auth.mfa.enroll({ factorType: "totp", issuer: "Capybaroar", friendlyName: `Authenticator ${randomUUID().slice(0, 8)}` });
    if (error || !data) throw error ?? new Error("No factor");
    return { factorId: data.id, qr: qrSrc(data.totp.qr_code), secret: data.totp.secret };
  } catch (e) {
    console.error("mfa: enroll:", e instanceof Error ? e.message : e);
    return { error: "Couldn't start. Try again." };
  }
}

/** The first code from the new app: 2FA is on, and the 10 backup codes come back, shown this once. */
export async function confirmTwoFactor(factorId: string, code: string): Promise<{ codes: string[] } | { error: string; on?: boolean }> {
  const m = await me();
  if (!m) return { error: "Sign in again" };
  const all = await totpFactors(m.userId);
  if (!all.some((f) => f.id === factorId && f.status !== "verified")) return { error: "Start again" };
  if (codeKind(code) !== "totp") return { error: WRONG };
  const stop = await codeTry(m.userId);
  if (stop) return { error: stop };
  const r = await verifyTotp(totpApi(m.sb), factorId, code);
  if (!r.ok) return { error: r.reason === "failed" ? FAILED : WRONG };
  await audit({ workspaceId: await eventWorkspace(m.userId), actorId: m.userId, actorLabel: m.email, action: "auth.mfa_enabled", ip: await ip() });
  try {
    return { codes: await saveBackupCodes(m.userId) };
  } catch (e) {
    console.error("mfa: backup codes:", e instanceof Error ? e.message : e);
    return { error: "2FA is on, but the backup codes weren't made. Make new ones.", on: true };
  }
}

/** Checks that it's this person at the full level, with an app, and counts the try. */
async function fullLevel(): Promise<{ m: Me; ids: string[] } | { error: string }> {
  const m = await me();
  if (!m) return { error: "Sign in again" };
  const factors = await verifiedFactors(m.userId);
  if (!factors.length) return { error: "2FA is off" };
  if (m.aal !== "aal2") redirect("/mfa?next=%2Fsettings");
  return { m, ids: factors.map((f) => f.id) };
}

/** "Turn off 2FA", with a current code (or a backup code). Not while a workspace requires it. */
export async function turnOffTwoFactor(code: string): Promise<{ error?: string }> {
  const who = await fullLevel();
  if ("error" in who) return who;
  const { m, ids } = who;
  const req = await requiringWorkspaces(m.userId);
  if (req.length) return { error: `${req[0].name} requires 2FA` };
  const stop = await codeTry(m.userId);
  if (stop) return { error: stop };
  const err = await secondFactor(m, ids, code);
  if (err) return { error: err };
  try {
    for (const id of ids)
      await retry(async () => {
        const { error } = await m.sb.auth.mfa.unenroll({ factorId: id });
        if (error && error.code !== "mfa_factor_not_found") throw error;
      });
  } catch (e) {
    console.error("mfa: unenroll:", e instanceof Error ? e.message : e);
    return { error: "Couldn't turn off 2FA. Try again." };
  }
  await clearBackupCodes(m.userId).catch((e) => console.error("mfa: clear codes:", e instanceof Error ? e.message : e));
  await m.sb.auth.refreshSession().catch(() => {});
  await audit({ workspaceId: await eventWorkspace(m.userId), actorId: m.userId, actorLabel: m.email, action: "auth.mfa_disabled", meta: { via: "settings" }, ip: await ip() });
  return {};
}

/** "New backup codes", with a current code: the old ones stop working. */
export async function newBackupCodes(code: string): Promise<{ codes: string[] } | { error: string }> {
  const who = await fullLevel();
  if ("error" in who) return who;
  const { m, ids } = who;
  const stop = await codeTry(m.userId);
  if (stop) return { error: stop };
  const err = await secondFactor(m, ids, code);
  if (err) return { error: err };
  try {
    return { codes: await saveBackupCodes(m.userId) };
  } catch (e) {
    console.error("mfa: backup codes:", e instanceof Error ? e.message : e);
    return { error: "Couldn't make new codes. Try again." };
  }
}

/** /mfa/setup: open another of this person's workspaces instead (one that doesn't require 2FA). */
export async function openWorkspace(id: string): Promise<{ error?: string }> {
  const m = await me();
  if (!m) redirect("/login");
  const { data } = await adminClient().from("members").select("workspace_id").eq("user_id", m.userId).eq("workspace_id", id).maybeSingle();
  if (!data) return { error: "Workspace not found" };
  const jar = await cookies();
  jar.set(WORKSPACE_COOKIE, id, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax", httpOnly: true, secure: process.env.NODE_ENV === "production" });
  jar.delete(BRAND_COOKIE);
  redirect("/calendar");
}
