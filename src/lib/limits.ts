import "server-only";
import { createHmac } from "node:crypto";
import { adminClient } from "./supabase/server";
import { PER_MINUTE, RateLimit } from "./api/limit";

// Counters shared by every server (take_rate in 032_auth_limits.sql). When the database can't be asked, each server
// counts on its own, so a limit still holds on that server instead of falling open.

export const LIMITS = {
  loginEmail: { windowS: 900, max: 10 },
  loginIp: { windowS: 900, max: 30 },
  signupIp: { windowS: 3600, max: 10 },
  resetEmail: { windowS: 3600, max: 3 },
  resetIp: { windowS: 3600, max: 10 },
  reportSend: { windowS: 3600, max: 5 },
  reportWorkspaceDay: { windowS: 86400, max: 50 },
  inviteWorkspaceDay: { windowS: 86400, max: 20 },
  // The first invite to an address and 3 more.
  inviteAddressDay: { windowS: 86400, max: 4 },
  // Claude and ChatGPT register from their own servers, so many people share one IP: generous, but bounded.
  oauthRegisterIp: { windowS: 3600, max: 60 },
  apiKeyMinute: { windowS: 60, max: PER_MINUTE },
  // Subprocessor change notices: the sign-up form on capybaroar.com sends a confirm email.
  subscribeIp: { windowS: 3600, max: 5 },
  subscribeEmail: { windowS: 86400, max: 3 },
  // Data exports (exports.ts): one of each kind per person per day; starting a failed one again doesn't count.
  exportAccountDay: { windowS: 86400, max: 1 },
  exportWorkspaceDay: { windowS: 86400, max: 1 },
  // Two-factor codes (sign-in, set-up, turning off, new backup codes): 5 tries per person per 10 minutes.
  mfaCode: { windowS: 600, max: 5 },
  // Starting a new authenticator app set-up, which makes a factor in Supabase Auth each time.
  mfaEnroll: { windowS: 3600, max: 10 },
} as const;

/** A bucket name that never holds an address or IP as it is. Keyed, so an IP can't be found by trying every address. */
const limitSalt = () => process.env.AUDIT_SALT || process.env.BIO_SALT || process.env.TOKEN_KEY || "";
export const hashed = (kind: string, v: string) => `${kind}:${createHmac("sha256", limitSalt()).update(v.trim().toLowerCase()).digest("hex").slice(0, 32)}`;

const local = new Map<string, RateLimit>();

/** Counts `n` hits. 0 when they may go ahead, or the seconds to wait. */
export async function take(bucket: string, l: { windowS: number; max: number }, n = 1): Promise<number> {
  try {
    const { data, error } = await adminClient().rpc("take_rate", { p_bucket: bucket.slice(0, 200), p_window_s: l.windowS, p_max: l.max, p_n: n }).abortSignal(AbortSignal.timeout(3000));
    if (error) throw new Error(error.message);
    return Number(data) || 0;
  } catch (e) {
    console.error("limits:", e instanceof Error ? e.message : e);
    const k = `${l.windowS}:${l.max}`;
    let r = local.get(k);
    if (!r) local.set(k, (r = new RateLimit(l.max, l.windowS * 1000)));
    return r.take(bucket, Date.now(), n);
  }
}

/** Counts a hit in each bucket; the longest wait of any that is over its limit (0 when none is). */
export async function takeAll(list: { bucket: string; l: { windowS: number; max: number }; n?: number }[]): Promise<number> {
  const waits = await Promise.all(list.map((x) => take(x.bucket, x.l, x.n ?? 1)));
  return Math.max(0, ...waits);
}

/** "Try again in 12 minutes" for a wait in seconds. */
export function retryIn(s: number) {
  if (s < 90) return `Try again in ${Math.max(1, s)} seconds.`;
  if (s < 5400) return `Try again in ${Math.ceil(s / 60)} minutes.`;
  return `Try again in ${Math.ceil(s / 3600)} hours.`;
}

/** Hourly upkeep: old counters, apps never approved after a week, long-expired codes. */
export async function pruneLimits() {
  const { error } = await adminClient().rpc("prune_limits");
  if (error) throw new Error(error.message);
}
