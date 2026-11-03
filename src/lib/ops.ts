// Ops rules, kept free of Supabase so tests can race two servers against an in-memory store (like publisher.ts).
// - Periodic work (hourly upkeep, the 10-minute Inbox queue) runs on whichever server takes the period's turn first
//   (take_turn in SQL): one winner per period, and a run still going blocks the next one until its lease ends.
// - Jobs a server is still working on keep their lock fresh (keep_locks), so a slow upload is never taken over by
//   another server after the 10-minute crash timeout and posted twice. A job held past MAX_HOLD_MS stops being kept,
//   so a hung server can't hold a post forever.
// - Errors are counted per fingerprint (message with numbers and ids taken out, plus the top stack frame), with
//   tokens scrubbed first; each fingerprint emails at most once an hour across every server (record_error in SQL).
import { createHash } from "node:crypto";

export interface OpsStore {
  /** True for exactly one caller per period: the last run started at least `everyS` ago and none is still going. */
  takeTurn(name: string, everyS: number, leaseS: number, worker: string): Promise<boolean>;
  endTurn(name: string, worker: string): Promise<void>;
  keepLocks(ids: number[], worker: string): Promise<void>;
  /** Counts the error; true when this caller should send its email (at most one per fingerprint per hour). */
  recordError(e: AppError, mail: boolean): Promise<boolean>;
}

export type AppError = { fingerprint: string; message: string; stack: string | null; route: string | null; machine: string };

/** Runs `fn` if this server wins the period's turn. Returns whether it ran. */
export async function onePerPeriod(store: OpsStore, name: string, everyS: number, leaseS: number, worker: string, fn: () => Promise<void>) {
  if (!(await store.takeTurn(name, everyS, leaseS, worker))) return false;
  try {
    await fn();
  } finally {
    await store.endTurn(name, worker).catch(() => {});
  }
  return true;
}

/** Jobs a server has claimed and not yet finished, so their locks can be kept fresh. */
export const MAX_HOLD_MS = 60 * 60000;
export class HeldJobs {
  private held = new Map<number, number>();
  hold(ids: number[], now = Date.now()) {
    for (const id of ids) this.held.set(id, now);
  }
  release(id: number) {
    this.held.delete(id);
  }
  /** The claiming loop ended: nothing it claimed is still running. */
  clear() {
    this.held.clear();
  }
  /** The jobs to keep locked; ones held past MAX_HOLD_MS are let go. */
  fresh(now = Date.now()) {
    for (const [id, at] of this.held) if (now - at > MAX_HOLD_MS) this.held.delete(id);
    return [...this.held.keys()];
  }
}

/** Refreshes the locks of jobs this server still holds. Never throws. */
export async function keepHeld(store: OpsStore, held: HeldJobs, worker: string, now = Date.now()) {
  const ids = held.fresh(now);
  if (!ids.length) return;
  try {
    await store.keepLocks(ids, worker);
  } catch {
    // the next round tries again; a lock lasts 10 minutes
  }
}

const SECRETS: [RegExp, string][] = [
  [/\b(Bearer|Basic|OAuth)\s+[A-Za-z0-9._~+/=-]{8,}/gi, "$1 [redacted]"],
  [/\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]*/g, "[jwt]"],
  [/\b(sk|pk|rk)_(live|test)_[A-Za-z0-9]{8,}/g, "[key]"],
  [/\b(whsec|sbp|xox[abpr]|ghp|gho|github_pat|AKIA)[_-]?[A-Za-z0-9_-]{8,}/g, "[key]"],
  [/((?:access|refresh|id)?_?token|secret|password|passwd|pass|api_?key|key|code|signature|sig|client_secret|authorization|cookie)(["']?\s*[=:]\s*["']?)[^\s"'&,;}]+/gi, "$1$2[redacted]"],
  [/(postgres(?:ql)?:\/\/[^:\s]+:)[^@\s]+@/gi, "$1[redacted]@"],
  [/\b[A-Fa-f0-9]{40,}\b/g, "[hex]"],
  [/\b[A-Za-z0-9+_-]{40,}={0,2}/g, "[long]"],
];

/** Takes out anything that looks like a token, key, password or signed link before an error is stored or sent. */
export function scrub(s: string) {
  let out = s;
  for (const [re, to] of SECRETS) out = out.replace(re, to);
  return out;
}

/** The first stack line that points at a file (not the message line). */
export function topFrame(stack: string | null | undefined) {
  if (!stack) return "";
  const line = stack.split("\n").find((l) => /^\s+at\s/.test(l));
  // Line and column numbers change with every build; the function and file are what make an error the same one.
  return (line ?? "").trim().replace(/:\d+:\d+\)?$/, "").replace(/\?[^\s)]*/, "");
}

/** The same mistake with different ids, numbers or quoted values counts as one error. */
export const normalize = (msg: string) =>
  msg
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ":id")
    .replace(/"[^"]{0,200}"/g, '"…"')
    .replace(/\d+/g, "N")
    .slice(0, 500);

export const fingerprint = (message: string, stack: string | null | undefined) => createHash("sha256").update(`${normalize(message)}\n${topFrame(stack)}`).digest("hex").slice(0, 32);

/** An error as stored: scrubbed, trimmed, fingerprinted. The route keeps its path only (no query string). */
export function appError(e: unknown, route: string | null, machine: string): AppError {
  const err = e instanceof Error ? e : new Error(typeof e === "string" ? e : safeString(e));
  const message = scrub(`${err.name && err.name !== "Error" ? `${err.name}: ` : ""}${err.message || "Unknown error"}`).slice(0, 1000);
  const stack = err.stack ? scrub(err.stack.split("\n").slice(0, 12).join("\n")).slice(0, 4000) : null;
  return { fingerprint: fingerprint(message, stack), message, stack, route: route ? scrub(route.split("?")[0]).slice(0, 300) : null, machine };
}

const safeString = (v: unknown) => {
  try {
    return JSON.stringify(v) ?? String(v);
  } catch {
    return String(v);
  }
};

/** Records an error and sends its email when this server won the hour. Never throws. */
export async function reportError(store: OpsStore, send: ((e: AppError) => Promise<unknown>) | null, e: unknown, route: string | null, machine: string) {
  try {
    const err = appError(e, route, machine);
    const mail = await store.recordError(err, Boolean(send));
    if (mail && send) await send(err);
    return err;
  } catch (x) {
    console.error("error tracking:", x instanceof Error ? x.message : x);
    return null;
  }
}

/** /api/health's answer. The runner counts as running when its server wrote a beat in the last 3 minutes. */
export const BEAT_STALE_S = 180;
export function healthOf(p: { db: boolean; runs: boolean; beatAt: Date | null; version: string; now?: number }) {
  const ago = p.beatAt ? Math.max(0, Math.round(((p.now ?? Date.now()) - p.beatAt.getTime()) / 1000)) : null;
  const runner = !p.runs ? "off" : ago != null && ago <= BEAT_STALE_S ? "ok" : "stale";
  const ok = p.db && runner !== "stale";
  return { status: ok ? 200 : 503, body: { ok, db: p.db ? "ok" : "down", runner, lastBeatSecondsAgo: ago, version: p.version } };
}
