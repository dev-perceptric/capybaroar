// Two-factor sign-in, the pure half: backup codes (make, read, hash, use once), checking an authenticator code with
// Supabase Auth through retries, and where a signed-in person goes next. No Supabase or Next here, so
// tests/mfa.test.ts runs it.
//
// Supabase Auth keeps the authenticator factors and the session's level (aal1 after a password or Google, aal2 after a
// code). Backup codes are ours (038_mfa.sql): Supabase has none we can rely on. A backup code is for a lost phone, so
// using one removes the authenticator and asks the person to set 2FA up again (src/lib/mfa.ts, recoverWithBackup).
import { randomBytes, randomUUID, scrypt } from "node:crypto";

export const BACKUP_COUNT = 10;
/** No 0/o, 1/l/i: nothing that reads as another character when copied by hand. */
const ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";
const BACKUP_LEN = 10;

/** Ten new backup codes, "abcde-23456" (10 characters, about 49 bits each), all different. */
export function newBackupCodes(n = BACKUP_COUNT, bytes: (n: number) => Uint8Array = randomBytes): string[] {
  const out = new Set<string>();
  // Rejection sampling keeps every character equally likely (256 isn't a multiple of 31).
  const limit = 256 - (256 % ALPHABET.length);
  while (out.size < n) {
    let s = "";
    while (s.length < BACKUP_LEN) {
      for (const b of bytes(16)) {
        if (b >= limit) continue;
        s += ALPHABET[b % ALPHABET.length];
        if (s.length === BACKUP_LEN) break;
      }
    }
    out.add(`${s.slice(0, 5)}-${s.slice(5)}`);
  }
  return [...out];
}

/** A typed backup code as stored: lower case, no spaces or dashes. null when it can't be one. */
export function normalizeBackup(input: string): string | null {
  const s = String(input ?? "").toLowerCase().replace(/[\s-]/g, "");
  return s.length === BACKUP_LEN && [...s].every((c) => ALPHABET.includes(c)) ? s : null;
}

/** What the person typed: six digits from their app, a backup code, or neither. */
export function codeKind(input: string): "totp" | "backup" | null {
  const s = String(input ?? "").replace(/\s/g, "");
  if (/^\d{6}$/.test(s)) return "totp";
  return normalizeBackup(s) ? "backup" : null;
}

export const totpDigits = (input: string) => String(input ?? "").replace(/\s/g, "");

/** A backup code's stored hash: scrypt, salted with the person's id, so a copy of the table can't be guessed back
 *  into codes and one person's hash means nothing for another. */
export function hashBackup(userId: string, code: string): Promise<string> {
  const norm = normalizeBackup(code);
  if (!norm) return Promise.reject(new Error("Not a backup code"));
  return new Promise((resolve, reject) =>
    scrypt(norm, `capybaroar-backup:${userId}`, 32, { N: 16384, r: 8, p: 1 }, (err, key) => (err ? reject(err) : resolve(key.toString("base64url")))),
  );
}

/** Where codes are kept. `consume` marks the unused code with this hash used by `attempt` and says whether that
 *  attempt holds it now, so a try repeated after a lost reply still counts as its own (use_backup_code in 038). */
export type BackupStore = { consume(userId: string, hash: string, attempt: string): Promise<boolean> };

type Wait = { tries?: number; sleep?: (ms: number) => Promise<void> };
const nap = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** A hiccup worth trying again: the network, a timeout, a busy or broken server. */
export function transient(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const x = e as { name?: string; status?: number; code?: string; message?: string };
  if (x.name === "AuthRetryableFetchError" || x.name === "AbortError" || x.name === "TimeoutError") return true;
  if (typeof x.status === "number" && (x.status === 0 || x.status === 408 || x.status === 429 || x.status >= 500)) return true;
  if (x.code === "request_timeout" || x.code === "over_request_rate_limit" || x.code === "hook_timeout") return true;
  return /fetch failed|network|timed? ?out|ECONNRESET|ECONNREFUSED|socket hang up/i.test(x.message ?? "");
}

/** Runs `fn`, trying again after a hiccup with growing waits (200ms, 400ms). Anything else, or the last hiccup, throws. */
export async function retry<T>(fn: () => Promise<T>, { tries = 3, sleep = nap }: Wait = {}): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i >= tries || !transient(e)) throw e;
      await sleep(200 * i);
    }
  }
}

/** Uses a backup code once. "ok" when this try used it; "wrong" when it isn't one of theirs or was used before. */
export async function redeemBackup(store: BackupStore, userId: string, input: string, opts: Wait & { hash?: (u: string, c: string) => Promise<string>; attempt?: string } = {}): Promise<"ok" | "wrong"> {
  if (!normalizeBackup(input)) return "wrong";
  const hash = await (opts.hash ?? hashBackup)(userId, input);
  // One id for every retry of this try: a retry after the first went through finds the code as its own.
  const attempt = opts.attempt ?? randomUUID();
  return (await retry(() => store.consume(userId, hash, attempt), opts)) ? "ok" : "wrong";
}

type AuthErr = { name?: string; status?: number; code?: string; message?: string } | null;
/** The two calls of Supabase Auth's MFA this needs (sb.auth.mfa). */
export type TotpApi = {
  challenge(p: { factorId: string }): Promise<{ data: { id: string } | null; error: AuthErr }>;
  verify(p: { factorId: string; challengeId: string; code: string }): Promise<{ data: unknown; error: AuthErr }>;
};
export type TotpResult = { ok: true } | { ok: false; reason: "wrong" | "expired" | "failed"; message?: string };

/** Checks a code from the authenticator app: a fresh challenge, then the code against it. A challenge that expired
 *  (Supabase gives each 5 minutes) gets a new one; hiccups are tried again; a wrong code is never tried twice. */
export async function verifyTotp(api: TotpApi, factorId: string, code: string, { tries = 3, sleep = nap }: Wait = {}): Promise<TotpResult> {
  const digits = totpDigits(code);
  if (!/^\d{6}$/.test(digits)) return { ok: false, reason: "wrong" };
  let expired = 0;
  let last: AuthErr = null;
  for (let i = 1; i <= tries + 1; i++) {
    let res: { data: unknown; error: AuthErr };
    try {
      const ch = await api.challenge({ factorId });
      if (ch.error || !ch.data?.id) {
        last = ch.error ?? { message: "No challenge" };
        if (transient(last) && i < tries) {
          await sleep(200 * i);
          continue;
        }
        return { ok: false, reason: "failed", message: last.message };
      }
      res = await api.verify({ factorId, challengeId: ch.data.id, code: digits });
    } catch (e) {
      last = e as AuthErr;
      if (transient(e) && i < tries) {
        await sleep(200 * i);
        continue;
      }
      return { ok: false, reason: "failed", message: e instanceof Error ? e.message : String(e) };
    }
    if (!res.error) return { ok: true };
    last = res.error;
    if (res.error.code === "mfa_challenge_expired") {
      if (++expired > 1) return { ok: false, reason: "expired" };
      continue;
    }
    if (res.error.code === "mfa_verification_failed" || res.error.code === "mfa_verification_rejected" || res.error.code === "validation_failed" || res.error.status === 422) return { ok: false, reason: "wrong" };
    if (transient(res.error) && i < tries) {
      await sleep(200 * i);
      continue;
    }
    return { ok: false, reason: "failed", message: res.error.message };
  }
  return { ok: false, reason: "failed", message: last?.message };
}

/** The verified authenticator apps among a person's factors. Unverified ones (set up, never confirmed) don't count. */
export const verifiedTotp = <F extends { factor_type?: string; status?: string }>(factors: F[] | null | undefined): F[] => (factors ?? []).filter((f) => f.factor_type === "totp" && f.status === "verified");

/** A path to come back to after /mfa: only this site's own paths (the same rule as safeNext), never /mfa itself. */
export function mfaNext(path: string | null | undefined, safe: (v: string | null | undefined) => string): string {
  const to = safe(path);
  return to === "/mfa" || to.startsWith("/mfa?") || to.startsWith("/mfa/") ? "/calendar" : to;
}

export type GateInput = {
  /** The session's level from its token: "aal1" after a password or Google, "aal2" after a code. */
  aal: string | null | undefined;
  /** Whether the person has a verified authenticator app. */
  verified: boolean;
  /** Whether the workspace they're opening requires 2FA. */
  required: boolean;
  /** Where they were going, for after. */
  next: string;
};

/** Where a signed-in person goes before an app page or action, or null to go on. An app on file but only a password
 *  so far: enter a code (/mfa). A workspace that requires 2FA and no app: set one up (/mfa/setup). */
export function mfaGate({ aal, verified, required, next }: GateInput): string | null {
  const back = `?next=${encodeURIComponent(next)}`;
  if (verified && aal !== "aal2") return `/mfa${next === "/calendar" ? "" : back}`;
  if (required && !verified) return `/mfa/setup${next === "/calendar" ? "" : back}`;
  return null;
}
