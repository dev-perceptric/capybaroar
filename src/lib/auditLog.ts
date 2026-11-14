import "server-only";
import { adminClient } from "./supabase/server";
import { actionLabel, auditCsv, type AuditRow } from "./auditRules";
import { AUDIT_CSV_MAX, AUDIT_PAGE, actionsFor, afterCursor, decodeCursor, detailsOf, pageOf, sinceFor, type AuditFilter } from "./auditLogRules";

// Reading the audit log (036_audit_log.sql) for Settings: one workspace's events, newest first, filtered. Callers
// check the person is an owner or admin.

export type AuditItem = {
  id: number;
  at: string;
  actorId: string | null;
  actorKind: string;
  actorLabel: string | null;
  action: string;
  actionLabel: string;
  targetType: string | null;
  targetLabel: string | null;
  details: string;
};

type Raw = AuditRow & { id: number; actor_id: string | null };
const COLS = "id, created_at, actor_id, actor_kind, actor_label, action, target_type, target_label, meta";

function query(workspaceId: string, filter: AuditFilter, limit: number, cursor: ReturnType<typeof decodeCursor>) {
  let q = adminClient().from("audit_events").select(COLS).eq("workspace_id", workspaceId);
  const actions = actionsFor(filter.group);
  if (actions) q = q.in("action", actions);
  if (filter.actorId) q = q.eq("actor_id", filter.actorId);
  const since = sinceFor(filter.period);
  if (since) q = q.gte("created_at", since.toISOString());
  if (cursor) q = q.or(afterCursor(cursor));
  return q.order("created_at", { ascending: false }).order("id", { ascending: false }).limit(limit);
}

/** Rows, tried 3 times with growing waits. */
async function read(workspaceId: string, filter: AuditFilter, limit: number, cursor: ReturnType<typeof decodeCursor>): Promise<Raw[]> {
  for (let i = 1; ; i++) {
    const { data, error } = await query(workspaceId, filter, limit, cursor);
    if (!error) return (data ?? []) as Raw[];
    if (i >= 3) throw new Error("Couldn't load the audit log. Try again.");
    await new Promise((r) => setTimeout(r, 300 * i));
  }
}

const toItem = (r: Raw): AuditItem => ({
  id: r.id,
  at: r.created_at,
  actorId: r.actor_id,
  actorKind: r.actor_kind,
  actorLabel: r.actor_label,
  action: r.action,
  actionLabel: actionLabel(r.action),
  targetType: r.target_type,
  targetLabel: r.target_label,
  details: detailsOf(r.meta),
});

/** One page of 50, and the cursor for the next one (null at the end). */
export async function listAudit(workspaceId: string, filter: AuditFilter, cursor?: string | null): Promise<{ rows: AuditItem[]; next: string | null }> {
  const page = pageOf(await read(workspaceId, filter, AUDIT_PAGE + 1, decodeCursor(cursor)));
  return { rows: page.rows.map(toItem), next: page.next };
}

/** The filter's events as a CSV file, newest first, up to 10,000, read 1,000 at a time. */
export async function auditCsvFor(workspaceId: string, filter: AuditFilter): Promise<{ csv: string; rows: number }> {
  const rows: Raw[] = [];
  let cursor: ReturnType<typeof decodeCursor> = null;
  while (rows.length < AUDIT_CSV_MAX) {
    const want = Math.min(1000, AUDIT_CSV_MAX - rows.length);
    const got = await read(workspaceId, filter, want, cursor);
    rows.push(...got);
    const last = got.at(-1);
    if (got.length < want || !last) break;
    cursor = { at: last.created_at, id: last.id };
  }
  return { csv: auditCsv(rows), rows: rows.length };
}
