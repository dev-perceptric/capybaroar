// Webhook rules, pure so tests cover them: the events, the signature, and what happens after each delivery try.
import { createHmac, randomBytes } from "node:crypto";

export { EVENTS, isEvent, type HookEvent } from "./events";

export const MAX_HOOKS = 10;
/** Minutes to wait after try 1, 2, 3... about a day in all, then the delivery stops. */
export const HOOK_BACKOFF_MIN = [1, 5, 15, 60, 180, 360, 720];
export const HOOK_TRIES = HOOK_BACKOFF_MIN.length + 1;
/** Deliveries in a row that used every try before a webhook turns itself off. */
export const OFF_AFTER = 5;
export const HOOK_TIMEOUT_MS = 10000;

/** The signature header: `t=<unix seconds>,v1=<hex HMAC-SHA256 of "<t>.<body>">`. */
export function sign(secret: string, body: string, at = Math.floor(Date.now() / 1000)): string {
  const mac = createHmac("sha256", secret).update(`${at}.${body}`).digest("hex");
  return `t=${at},v1=${mac}`;
}

/** What to do after a try: done, try again after a wait, or stop (every try used). */
export function afterTry(attempts: number, status: number | null): { done: true; ok: boolean } | { done: false; waitMs: number } {
  if (status !== null && status >= 200 && status < 300) return { done: true, ok: true };
  if (attempts >= HOOK_TRIES) return { done: true, ok: false };
  return { done: false, waitMs: HOOK_BACKOFF_MIN[Math.min(attempts - 1, HOOK_BACKOFF_MIN.length - 1)] * 60000 };
}

/** A webhook's failure count after a delivery ends, and whether it should turn off. */
export function afterDelivery(failures: number, ok: boolean): { failures: number; off: boolean } {
  if (ok) return { failures: 0, off: false };
  const n = failures + 1;
  return { failures: n, off: n >= OFF_AFTER };
}

// The partner webhook (046_partner.sql): Standard Webhooks (standardwebhooks.com), so the partner can check it with
// any Standard Webhooks library. It is told when a channel of a brand it made is connected or lost.

export const PARTNER_EVENTS = ["channel.connected", "channel.lost"] as const;
export type PartnerEvent = (typeof PARTNER_EVENTS)[number];

/** A Standard Webhooks secret: "whsec_" and 24 to 64 random bytes in base64. The bytes are the HMAC key. */
export const STANDARD_SECRET = /^whsec_[A-Za-z0-9+/]{32,88}={0,2}$/;

export function standardKey(secret: string): Buffer {
  if (!STANDARD_SECRET.test(secret)) throw new Error("The secret must be whsec_ and 24 to 64 bytes in base64");
  const key = Buffer.from(secret.slice("whsec_".length), "base64");
  if (key.length < 24 || key.length > 64) throw new Error("The secret must be whsec_ and 24 to 64 bytes in base64");
  return key;
}

/** The webhook-signature header: "v1," and the base64 HMAC-SHA256 of "<webhook-id>.<webhook-timestamp>.<body>". */
export function signStandard(secret: string, msgId: string, at: number, body: string): string {
  return `v1,${createHmac("sha256", standardKey(secret)).update(`${msgId}.${at}.${body}`).digest("base64")}`;
}

/** The three Standard Webhooks headers for one try. The id stays the same on every try; the time is the try's. */
export function standardHeaders(secret: string, msgId: string, body: string, at = Math.floor(Date.now() / 1000)): Record<string, string> {
  return { "webhook-id": msgId, "webhook-timestamp": String(at), "webhook-signature": signStandard(secret, msgId, at, body) };
}

/** A partner event's body, in the Standard Webhooks shape: { type, timestamp, data }. */
export function partnerBody(type: PartnerEvent, data: Record<string, unknown>, at = new Date()): string {
  return JSON.stringify({ type, timestamp: at.toISOString(), data });
}

/** A new Standard Webhooks secret: 32 random bytes. */
export const newStandardSecret = () => `whsec_${randomBytes(32).toString("base64")}`;
