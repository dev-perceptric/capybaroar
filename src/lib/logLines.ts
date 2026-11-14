// One JSON line on stdout per security event, server error and runner start, so the central log store
// (ops/monitoring, Grafana Loki) can count them and alert. The pure half: tests check the shape.
//
// A line holds only what counting and alerting need. It never holds an email, a name, an IP, a message or the event's
// meta. The full audit event stays in the database (036_audit_log.sql), and the full error in app_errors.
import { appError } from "./ops";
import type { AuditEvent } from "./auditRules";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ACTION = /^[a-z_]+\.[a-z_]+$/;
const KINDS = new Set(["user", "api", "app", "review_link", "system"]);
// Fixed role words. A role change logs which one it gave, so an owner or admin grant can be picked out.
const ROLES = new Set(["owner", "admin", "editor", "client"]);

/** {"type":"audit","action":...,"workspace":...,"actor_kind":...,"at":...}, plus "role" on member.role_changed. */
export function auditLine(ev: AuditEvent, now = new Date()): string {
  const kind = ev.actorKind ?? (ev.actorId ? "user" : "system");
  const line: Record<string, string | null> = {
    type: "audit",
    action: ACTION.test(ev.action) ? ev.action : "unknown",
    workspace: ev.workspaceId && UUID.test(ev.workspaceId) ? ev.workspaceId.toLowerCase() : null,
    actor_kind: KINDS.has(kind) ? kind : "system",
  };
  const to = ev.action === "member.role_changed" ? ev.meta?.to : undefined;
  if (typeof to === "string" && ROLES.has(to)) line.role = to;
  line.at = now.toISOString();
  return JSON.stringify(line);
}

const EMAIL = /[^\s/@?#]+@[^\s/@?#]+/g;

/** {"type":"error","where":...,"fp":...,"at":...}: where it happened (path only, scrubbed) and the error's fingerprint. */
export function errorLine(e: unknown, route: string | null, now = new Date()): string {
  let where: string | null = null;
  let fp: string | null = null;
  try {
    const err = appError(e, route, "");
    where = err.route ? err.route.replace(EMAIL, "[email]").slice(0, 200) : null;
    fp = err.fingerprint;
  } catch {
    // the line still goes out with what it has
  }
  return JSON.stringify({ type: "error", where, fp, at: now.toISOString() });
}

/** {"type":"start"} when a runner starts, and {"type":"beat"} every few minutes, so a silent app shows in Loki. */
export const runnerLine = (type: "start" | "beat", now = new Date()) => JSON.stringify({ type, at: now.toISOString() });
export const BEAT_LINE_MS = 5 * 60000;

/** Writes one line to stdout. Never throws. */
export function logLine(line: string) {
  try {
    console.log(line);
  } catch {
    // stdout closed: nothing to do
  }
}
