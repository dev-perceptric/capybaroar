import "server-only";
import { hostname } from "node:os";
import { adminClient } from "./supabase/server";
import { appUrl } from "./channels";
import { mailReady, sendEmail } from "./alerts";
import { reportError, type AppError, type OpsStore } from "./ops";
import { pruneLimits } from "./limits";
import { errorLine, logLine } from "./logLines";

// The Supabase side of ops.ts: turns, kept locks, the heartbeat and error tracking.
export const MACHINE = process.env.FLY_MACHINE_ID || hostname();
export const VERSION = process.env.NEXT_PUBLIC_BUILD || "dev";

const localTurns = new Map<string, number>();

export const opsStore: OpsStore = {
  async takeTurn(name, everyS, leaseS, worker) {
    const { data, error } = await adminClient().rpc("take_turn", { job_name: name, every_s: everyS, lease_s: leaseS, worker });
    // Before migration 012 runs there is no take_turn: keep the period on this server alone, as the one server did.
    if (error?.code === "PGRST202") {
      if (Date.now() - (localTurns.get(name) ?? 0) < everyS * 1000) return false;
      localTurns.set(name, Date.now());
      return true;
    }
    if (error) throw new Error(error.message);
    return data === true;
  },
  async endTurn(name, worker) {
    const { error } = await adminClient().rpc("end_turn", { job_name: name, worker });
    if (error && error.code !== "PGRST202") throw new Error(error.message);
  },
  async keepLocks(ids, worker) {
    const { error } = await adminClient().rpc("keep_locks", { ids, worker });
    if (error) throw new Error(error.message);
  },
  async recordError(e, mail) {
    const { data, error } = await adminClient().rpc("record_error", { fp: e.fingerprint, msg: e.message, trace: e.stack, at_route: e.route, at_machine: e.machine, mail });
    if (error) throw new Error(error.message);
    return data === true;
  },
};

const alertTo = () =>
  (process.env.ALERT_EMAIL ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const mailError = (e: AppError) =>
  sendEmail(alertTo(), `Capybaroar error: ${e.message.slice(0, 80)}`, {
    title: "A server error happened",
    body: `${e.message}\n\nWhere: ${e.route ?? "runner"}\nServer: ${e.machine}\n\n${(e.stack ?? "").split("\n").slice(0, 6).join("\n")}`,
    button: "Open Capybaroar",
    href: appUrl(),
  });

/** Records a server error in app_errors, and emails ALERT_EMAIL at most once an hour per error. Never throws.
 * Also writes one JSON line to stdout for the central log store (src/lib/logLines.ts). */
export function trackError(e: unknown, route: string | null) {
  logLine(errorLine(e, route));
  return reportError(opsStore, mailReady() && alertTo().length ? mailError : null, e, route, MACHINE);
}

/** This server's runner is alive. */
export async function beat(startedAt: Date) {
  const { error } = await adminClient().from("runner_beats").upsert({ machine: MACHINE, beat_at: new Date().toISOString(), started_at: startedAt.toISOString(), version: VERSION });
  if (error) throw new Error(error.message);
}

/** Hourly: drop errors not seen in 30 days, beats from servers gone for a week, old limit counters and OAuth apps
 * never approved after a week (prune_limits in 032_auth_limits.sql). */
export async function cleanupOps() {
  const db = adminClient();
  const { error } = await db.from("app_errors").delete().lt("last_seen", new Date(Date.now() - 30 * 86400000).toISOString());
  if (error) throw new Error(error.message);
  const { error: e2 } = await db.from("runner_beats").delete().lt("beat_at", new Date(Date.now() - 7 * 86400000).toISOString());
  if (e2) throw new Error(e2.message);
  // On its own, so a failure here never stops the rest of upkeep.
  await pruneLimits().catch((e) => console.error("prune limits:", e instanceof Error ? e.message : e));
}
