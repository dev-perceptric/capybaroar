// The audit log screen and its recording, the pure half: filter groups, pages, the Details column, and the wrapper
// that keeps a failed audit write from ever breaking the change it records. No Supabase, so tests run it.
import { AUDIT_ACTIONS, type AuditAction, type AuditEvent } from "./auditRules";

export const AUDIT_PAGE = 50;
/** Events are kept this long (036_audit_log.sql refuses deleting younger ones). */
export const AUDIT_KEEP_DAYS = 365;

/** What the hourly upkeep deletes: older than the keep time plus a day of margin for clocks. */
export const auditCutoff = (now = new Date()) => new Date(now.getTime() - (AUDIT_KEEP_DAYS + 1) * 86400000);
export const AUDIT_CSV_MAX = 10_000;

/** The action groups in the filter, each the action areas (the part before the dot) it covers. */
export const AUDIT_GROUPS = [
  { value: "all", label: "All", areas: [] },
  { value: "auth", label: "Sign-in", areas: ["auth"] },
  { value: "members", label: "Members", areas: ["member"] },
  { value: "brands", label: "Brands", areas: ["brand"] },
  { value: "channels", label: "Channels", areas: ["channel"] },
  { value: "posts", label: "Posts", areas: ["post", "media"] },
  { value: "api", label: "API and apps", areas: ["api_key", "app", "webhook"] },
  { value: "billing", label: "Billing", areas: ["billing"] },
  { value: "workspace", label: "Workspace", areas: ["workspace", "data", "account"] },
] as const;
export type AuditGroup = (typeof AUDIT_GROUPS)[number]["value"];

/** The actions a group covers, or null for every action. */
export function actionsFor(group: AuditGroup): AuditAction[] | null {
  const g = AUDIT_GROUPS.find((x) => x.value === group);
  if (!g || g.value === "all") return null;
  const areas: readonly string[] = g.areas;
  return (Object.keys(AUDIT_ACTIONS) as AuditAction[]).filter((a) => areas.includes(a.split(".")[0]));
}

export const AUDIT_PERIODS = [
  { value: "all", label: "Any time", days: null },
  { value: "7", label: "Last 7 days", days: 7 },
  { value: "30", label: "Last 30 days", days: 30 },
  { value: "90", label: "Last 90 days", days: 90 },
] as const;
export type AuditPeriod = (typeof AUDIT_PERIODS)[number]["value"];

export type AuditFilter = { group: AuditGroup; actorId: string | null; period: AuditPeriod };
export const NO_FILTER: AuditFilter = { group: "all", actorId: null, period: "all" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A filter from anything a request or server action sends: unknown values fall back to "all". */
export function cleanFilter(raw: unknown): AuditFilter {
  const f = (raw ?? {}) as Record<string, unknown>;
  const group = AUDIT_GROUPS.some((g) => g.value === f.group) ? (f.group as AuditGroup) : "all";
  const period = AUDIT_PERIODS.some((p) => p.value === f.period) ? (f.period as AuditPeriod) : "all";
  const actorId = typeof f.actorId === "string" && UUID.test(f.actorId) ? f.actorId.toLowerCase() : null;
  return { group, actorId, period };
}

/** The oldest time a period shows, or null for any time. */
export function sinceFor(period: AuditPeriod, now = new Date()): Date | null {
  const days = AUDIT_PERIODS.find((p) => p.value === period)?.days ?? null;
  return days ? new Date(now.getTime() - days * 86400000) : null;
}

/** Where the next page starts: just after this row, newest first by time, then id. */
export type Cursor = { at: string; id: number };

export function encodeCursor(c: Cursor): string {
  return Buffer.from(`${c.at}|${c.id}`).toString("base64url");
}

/** A cursor back, or null for one that's missing or doesn't look like ours (then the list starts from the top). */
export function decodeCursor(raw: unknown): Cursor | null {
  if (typeof raw !== "string" || !raw || raw.length > 200) return null;
  let text: string;
  try {
    text = Buffer.from(raw, "base64url").toString("utf8");
  } catch {
    return null;
  }
  const m = /^(\d{4}-\d{2}-\d{2}T[0-9:.]+(?:Z|[+-]\d{2}(?::?\d{2})?))\|(\d{1,18})$/.exec(text);
  if (!m || Number.isNaN(new Date(m[1]).getTime())) return null;
  const id = Number(m[2]);
  return Number.isSafeInteger(id) && id > 0 ? { at: m[1], id } : null;
}

/** The PostgREST `or` filter for rows after the cursor (older), with values quoted. */
export const afterCursor = (c: Cursor) => `created_at.lt."${c.at}",and(created_at.eq."${c.at}",id.lt.${c.id})`;

/** One page from `limit + 1` rows read: the first `limit`, and a cursor when there were more. */
export function pageOf<T extends { id: number; created_at: string }>(rows: T[], limit = AUDIT_PAGE): { rows: T[]; next: string | null } {
  const page = rows.slice(0, limit);
  const last = page.at(-1);
  return { rows: page, next: rows.length > limit && last ? encodeCursor({ at: last.created_at, id: last.id }) : null };
}

const words = (k: string) => k.replace(/_/g, " ");
const value = (v: unknown) => (v == null ? "none" : Array.isArray(v) ? v.join(", ") : typeof v === "object" ? JSON.stringify(v) : String(v));

/** The Details column: "editor to admin", then "key: value" for the rest. */
export function detailsOf(meta: Record<string, unknown> | null | undefined): string {
  const m = { ...(meta ?? {}) };
  const parts: string[] = [];
  if ("from" in m || "to" in m) {
    parts.push("from" in m ? `${value(m.from)} to ${value(m.to)}` : value(m.to));
    delete m.from;
    delete m.to;
  }
  for (const [k, v] of Object.entries(m)) parts.push(typeof v === "boolean" ? (v ? words(k) : `not ${words(k)}`) : `${words(k)}: ${value(v)}`);
  return parts.join(", ");
}

/** Who did it, as recording sees it. `ip` undefined: read it from the request; null: there is none to read. */
export type Actor = { id: string | null; kind: NonNullable<AuditEvent["actorKind"]>; label: string | null; ip?: string | null };
export const SYSTEM: Actor = { id: null, kind: "system", label: null, ip: null };

export type RecordDeps = {
  /** The actor, or null when nobody is known (recorded as the system). */
  actor: () => Promise<Actor | null>;
  /** A person's email, for an actor known only by id. */
  labelOf: (userId: string) => Promise<string | null>;
  /** The request's IP, when there is a request. */
  ip: () => Promise<string | null>;
  write: (ev: AuditEvent) => Promise<boolean>;
  timeoutMs?: number;
};

const settle = <T,>(p: () => Promise<T>, fallback: T): Promise<T> => {
  try {
    return p().catch(() => fallback);
  } catch {
    return Promise.resolve(fallback);
  }
};

/**
 * Record one event without ever throwing or holding up the change it describes: an actor, label or IP that can't be
 * read is left out, and a write that fails, throws or takes longer than `timeoutMs` gives false.
 */
export async function recordSafely(ev: Omit<AuditEvent, "actorId" | "actorKind" | "actorLabel" | "ip">, deps: RecordDeps): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<false>((resolve) => {
    timer = setTimeout(() => resolve(false), deps.timeoutMs ?? 5000);
  });
  const run = async () => {
    const a = (await settle(deps.actor, null)) ?? SYSTEM;
    const label = a.label ?? (a.id ? await settle(() => deps.labelOf(a.id!), null) : null);
    const ip = a.kind === "system" ? null : a.ip !== undefined ? a.ip : await settle(deps.ip, null);
    return settle(() => deps.write({ ...ev, actorId: a.id, actorKind: a.kind, actorLabel: label, ip }), false);
  };
  try {
    return await Promise.race([run(), timeout]);
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
