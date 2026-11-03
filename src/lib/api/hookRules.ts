// Webhook rules, pure so tests cover them: the events, the signature, and what happens after each delivery try.
import { createHmac } from "node:crypto";

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
