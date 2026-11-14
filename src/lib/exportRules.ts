// Data exports, the pure half: which tables and columns go in, how each read is kept to its workspace or person, the
// 24-hour link, and the README. No Supabase, so tests run it (tests/export.test.ts).
// - Columns are picked from a fixed list per table, never `select *`, so a column added later stays out until it's
//   listed here. Then anything whose name looks like a credential is dropped, nested JSON included.
// - Every read is filtered in the query, and every row read is checked again before it's written: a row of another
//   workspace (or person) never reaches the file, even if a query came back wrong.
// - A workspace export is for owners; "Download my data" is for anyone signed in. One of each per person per day
//   (limits.ts); a failed one may be started again at once.

export type ExportKind = "account" | "workspace";
export type ExportStatus = "queued" | "running" | "ready" | "failed";
export type Row = Record<string, unknown>;

const HOUR = 3600000;
const DAY = 24 * HOUR;

export const EXPORT_RULES = {
  /** The emailed link works this long after the ZIP is ready; then the file and its row are deleted. */
  linkMs: DAY,
  /** The signed storage address the link redirects to. */
  signedS: 60,
  /** Queued or running this long (every job retry used up, or a server lost): marked failed so it can be started again. */
  stuckMs: DAY,
  /** Failed exports are kept this long for the status line, then deleted. */
  keepFailedMs: 7 * DAY,
  /** Rows per read, and ids per `in (...)` filter. */
  page: 1000,
  chunk: 200,
  /** The bucket's own limit (037_exports.sql). */
  maxBytes: 20 * 1024 * 1024 * 1024,
};

/** Column names that hold credentials. Never exported, at any depth. */
export const SECRET_COLUMN = /(token|secret|password|passwd|verifier|signature|cookie|authorization|credential|api_?key|private)|(^|_)hash(es)?(_|$)/i;

/**
 * How a table's reads are kept in bounds: a column equal to the workspace or the person, or a column whose value is one
 * of the `key` values of rows already exported from `parent` (listed earlier).
 */
export type Scope = { col: string; by: "workspace" | "user" } | { col: string; parent: string; key?: string };

export type TableSpec = {
  /** The database table. */
  table: string;
  /** The file in the ZIP, without ".json"; the table's name unless two parts read the same table. */
  file?: string;
  columns: string[];
  order: string[];
  scope: Scope;
};

const POST = ["id", "workspace_id", "brand_id", "campaign_id", "created_by", "submitted_by", "text", "thread", "media_ids", "status", "publish_at", "created_at", "updated_at"];
const AUDIT = ["id", "workspace_id", "actor_id", "actor_kind", "actor_label", "action", "target_type", "target_id", "target_label", "meta", "created_at"];
const COMMENT = ["id", "post_id", "workspace_id", "author", "author_name", "kind", "body", "created_at"];
const GRANT = ["id", "client_id", "workspace_id", "user_id", "created_at", "last_used_at", "revoked_at"];
const ws = (col = "workspace_id"): Scope => ({ col, by: "workspace" });
const me = (col: string): Scope => ({ col, by: "user" });

/** "Export workspace": every row of the workspace, parents before the tables scoped by them. */
export const WORKSPACE_TABLES: TableSpec[] = [
  { table: "workspaces", file: "workspace", columns: ["id", "name", "timezone", "created_at", "queue", "plan", "plan_status", "trial_ends_at", "current_period_end", "billing_interval", "credit_anchor", "auto_topup_pack", "auto_topup_max", "deleting_at"], order: ["id"], scope: ws("id") },
  { table: "brands", columns: ["id", "workspace_id", "name", "color", "avatar", "needs_approval", "credit_limit", "voice", "avoid", "hashtags", "created_at"], order: ["id"], scope: ws() },
  // Names, emails and brand names are added from the sign-ins (exports.ts).
  { table: "members", columns: ["workspace_id", "user_id", "role", "brand_ids", "created_at"], order: ["user_id"], scope: ws() },
  { table: "invites", columns: ["id", "workspace_id", "email", "role", "brand_ids", "invited_by", "expires_at", "accepted_at", "accepted_by", "created_at"], order: ["id"], scope: ws() },
  { table: "review_links", columns: ["brand_id", "workspace_id", "created_by", "created_at"], order: ["brand_id"], scope: ws() },
  { table: "channels", columns: ["id", "workspace_id", "brand_id", "network", "account_id", "name", "username", "avatar", "status", "created_at"], order: ["id"], scope: ws() },
  { table: "channel_groups", columns: ["id", "workspace_id", "brand_id", "name", "channel_ids", "created_by", "created_at"], order: ["id"], scope: ws() },
  { table: "campaigns", columns: ["id", "workspace_id", "brand_id", "name", "tone", "created_by", "created_at"], order: ["id"], scope: ws() },
  { table: "posts", columns: POST, order: ["id"], scope: ws() },
  { table: "post_targets", columns: ["id", "post_id", "workspace_id", "channel_id", "status", "remote_id", "url", "error", "note", "text", "settings", "parts", "published_at", "deleted_at"], order: ["id"], scope: ws() },
  { table: "post_comments", columns: COMMENT, order: ["id"], scope: ws() },
  { table: "evergreen", columns: ["post_id", "workspace_id", "every_weeks", "next_at", "last_at", "last_post_id", "error", "created_by", "created_at"], order: ["post_id"], scope: ws() },
  // Each row also says where its file is in the ZIP (`file`).
  { table: "media", columns: ["id", "workspace_id", "brand_id", "path", "name", "mime", "size", "alt", "created_by", "created_at"], order: ["id"], scope: ws() },
  { table: "generations", columns: ["id", "workspace_id", "created_by", "kind", "model", "prompt", "aspect", "seconds", "source_media_id", "post_id", "status", "error", "media_id", "credits", "reason", "created_at", "finished_at"], order: ["id"], scope: ws() },
  { table: "inbox_items", columns: ["id", "workspace_id", "channel_id", "kind", "network_id", "thread_id", "parent_id", "target_id", "post_remote_id", "post_url", "post_text", "url", "author_id", "author_name", "author_handle", "author_avatar", "text", "created_at", "fetched_at", "mine", "status", "liked", "like_ref", "hidden", "reply_text", "replied_at", "replied_by", "extra"], order: ["id"], scope: ws() },
  { table: "metrics", columns: ["channel_id", "workspace_id", "day", "followers", "posts", "impressions", "engagements"], order: ["channel_id", "day"], scope: ws() },
  { table: "post_metrics", columns: ["target_id", "workspace_id", "channel_id", "fetched_at", "views", "reach", "impressions", "likes", "comments", "shares", "saves", "clicks", "engagement"], order: ["target_id"], scope: ws() },
  { table: "bio_pages", columns: ["id", "workspace_id", "brand_id", "slug", "title", "bio", "avatar_media_id", "links", "show_posts", "theme", "blocks", "appearance", "seo_title", "seo_description", "share_media_id", "badge", "updated_at", "created_at"], order: ["id"], scope: ws() },
  { table: "bio_views", columns: ["page_id", "day", "views", "clicks", "referrers", "items"], order: ["page_id", "day"], scope: { col: "page_id", parent: "bio_pages" } },
  { table: "links", columns: ["code", "workspace_id", "url", "clicks", "page_id", "item", "created_at"], order: ["code"], scope: ws() },
  { table: "snippets", columns: ["id", "workspace_id", "name", "body", "created_at"], order: ["id"], scope: ws() },
  { table: "reports", columns: ["id", "workspace_id", "brand_id", "name", "range_days", "sections", "notes", "schedule", "send_to", "queued_period", "last_sent_at", "logo_media_id", "accent", "created_by", "created_at"], order: ["id"], scope: ws() },
  { table: "feeds", columns: ["id", "workspace_id", "brand_id", "url", "title", "channel_ids", "template", "mode", "seen", "last_item_guid", "active", "fetched_at", "error", "created_by", "created_at"], order: ["id"], scope: ws() },
  { table: "webhooks", columns: ["id", "workspace_id", "created_by", "url", "events", "enabled", "failures", "last_status", "last_error", "last_delivered_at", "created_at"], order: ["id"], scope: ws() },
  { table: "webhook_deliveries", columns: ["id", "webhook_id", "workspace_id", "event", "event_id", "body", "attempts", "status", "error", "run_after", "done_at", "created_at"], order: ["id"], scope: ws() },
  { table: "api_keys", columns: ["id", "workspace_id", "user_id", "name", "created_at", "last_used_at"], order: ["id"], scope: ws() },
  { table: "oauth_grants", file: "connected_apps", columns: GRANT, order: ["id"], scope: ws() },
  { table: "oauth_clients", file: "connected_app_names", columns: ["id", "name", "created_at"], order: ["id"], scope: { col: "id", parent: "connected_apps", key: "client_id" } },
  { table: "credit_entries", columns: ["id", "workspace_id", "key", "kind", "seq", "bucket", "period", "lot", "expires_at", "amount", "brand_id", "user_id", "tool", "model", "post_id", "note", "created_at"], order: ["id"], scope: ws() },
  { table: "alerts", columns: ["id", "workspace_id", "kind", "ref", "sent_at"], order: ["id"], scope: ws() },
  { table: "audit_events", columns: AUDIT, order: ["id"], scope: ws() },
];

/** "Download my data": what's about the person, across every workspace. Profile and memberships come from exports.ts. */
export const ACCOUNT_TABLES: TableSpec[] = [
  { table: "policy_acceptances", columns: ["user_id", "document", "version", "source", "accepted_at"], order: ["document", "version"], scope: me("user_id") },
  { table: "api_keys", columns: ["id", "workspace_id", "user_id", "name", "created_at", "last_used_at"], order: ["id"], scope: me("user_id") },
  { table: "oauth_grants", file: "connected_apps", columns: GRANT, order: ["id"], scope: me("user_id") },
  { table: "oauth_clients", file: "connected_app_names", columns: ["id", "name", "created_at"], order: ["id"], scope: { col: "id", parent: "connected_apps", key: "client_id" } },
  { table: "agent_chats", columns: ["id", "workspace_id", "user_id", "title", "created_at"], order: ["id"], scope: me("user_id") },
  { table: "agent_messages", columns: ["id", "chat_id", "role", "content", "created_at"], order: ["id"], scope: { col: "chat_id", parent: "agent_chats" } },
  { table: "posts", columns: POST, order: ["id"], scope: me("created_by") },
  { table: "post_comments", columns: COMMENT, order: ["id"], scope: me("author") },
  { table: "audit_events", columns: AUDIT, order: ["id"], scope: me("actor_id") },
];

/** Workspace tables that stay out of "Export workspace", and why. tests/export.test.ts fails on one not listed here or above. */
export const LEFT_OUT: Record<string, string> = {
  channel_secrets: "Network sign-in tokens: never exported.",
  oauth_states: "Half-finished channel sign-ins with their PKCE verifiers, deleted after an hour.",
  oauth_codes: "One-time app sign-in codes (hashes), valid for minutes.",
  oauth_tokens: "App access tokens (hashes).",
  inbox_state: "Where each channel's last Inbox read stopped (the network's cursor): internal.",
  bio_visits: "Hashed visitor ids kept 2 hours to count views once: not the workspace's data.",
  agent_chats: "Private to each person: in their own Download my data.",
  agent_messages: "Private to each person: in their own Download my data.",
  jobs: "The background queue.",
  data_exports: "The exports themselves.",
};

/** Columns kept out of tables that are in the export, and why (for the report and the README). */
export const COLUMNS_LEFT_OUT: Record<string, string> = {
  "workspaces.stripe_customer_id, stripe_subscription_id, topup_wanted_at": "Billing references and a queue flag; invoices are in Stripe's billing portal.",
  "invites.token, token_hash; review_links.token, token_hash; reports.token, token_hash": "Link credentials.",
  "webhooks.secret": "The signing secret.",
  "api_keys.prefix, hash": "Part of the key, and its hash.",
  "generations.endpoint, input, request_id, status_url, response_url, tries, check_after, locked_at, locked_by": "The AI provider's queue details; input can hold short-lived signed file links.",
  "audit_events.ip_hash": "A keyed hash, meaningless outside Capybaroar.",
  "webhook_deliveries.max_attempts, locked_at, locked_by": "Queue internals.",
};

/** The files a spec writes, in order (the ZIP name without .json). */
export const fileOf = (s: TableSpec) => s.file ?? s.table;

/** A JSON value without any key that looks like a credential, at any depth. */
export function scrubValue(v: unknown, depth = 0): unknown {
  if (depth > 20 || v == null || typeof v !== "object") return v;
  if (Array.isArray(v)) return v.map((x) => scrubValue(x, depth + 1));
  const out: Row = {};
  for (const [k, x] of Object.entries(v as Row)) if (!SECRET_COLUMN.test(k)) out[k] = scrubValue(x, depth + 1);
  return out;
}

/** Only the spec's columns, and none that look like a credential (also inside JSON columns). */
export function pickColumns(spec: TableSpec, row: Row): Row {
  const out: Row = {};
  for (const c of spec.columns) if (!SECRET_COLUMN.test(c) && c in row) out[c] = scrubValue(row[c]);
  return out;
}

/** Values of rows already exported, by file and column: what child tables are scoped by. */
export type Seen = Map<string, Map<string, Set<string>>>;

/** The (file, column) pairs some later spec is scoped by. */
export function keysNeeded(specs: TableSpec[]): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  for (const s of specs)
    if ("parent" in s.scope) {
      const set = out.get(s.scope.parent) ?? new Set<string>();
      set.add(s.scope.key ?? "id");
      out.set(s.scope.parent, set);
    }
  return out;
}

export type Who = { workspaceId: string | null; userId: string };

/** Whether a row read belongs in this export. */
export function inScope(spec: TableSpec, row: Row, who: Who, seen: Seen): boolean {
  const v = row[spec.scope.col];
  if (v == null) return false;
  const s = spec.scope;
  if ("by" in s) return s.by === "workspace" ? !!who.workspaceId && v === who.workspaceId : v === who.userId;
  return seen.get(s.parent)?.get(s.key ?? "id")?.has(String(v)) ?? false;
}

export type Filter = { col: string; eq: string } | { col: string; in: string[] };
export type Query = { table: string; columns: string[]; filter: Filter; order: string[]; from: number; to: number };
/** Runs one query: the rows of `from`..`to` (inclusive) in `order`. Throws on an error. */
export type Reader = (q: Query) => Promise<Row[]>;

/** The filters a spec is read with: one, or one per chunk of parent ids. None when the parent had no rows. */
export function filtersFor(spec: TableSpec, who: Who, seen: Seen): Filter[] {
  const s = spec.scope;
  if ("by" in s) {
    const v = s.by === "workspace" ? who.workspaceId : who.userId;
    if (!v) throw new Error(`${spec.table}: no ${s.by} to export`);
    return [{ col: s.col, eq: v }];
  }
  const ids = [...(seen.get(s.parent)?.get(s.key ?? "id") ?? [])];
  const out: Filter[] = [];
  for (let i = 0; i < ids.length; i += EXPORT_RULES.chunk) out.push({ col: s.col, in: ids.slice(i, i + EXPORT_RULES.chunk) });
  return out;
}

/**
 * Every row of a spec, page by page, checked against the scope and cut to its columns. Remembers the values later
 * specs are scoped by. Throws when a read fails (the export fails and is tried again).
 */
export async function* readTable(spec: TableSpec, read: Reader, who: Who, seen: Seen, needed: Map<string, Set<string>>): AsyncGenerator<Row> {
  const keep = needed.get(fileOf(spec));
  const columns = [...new Set([...spec.columns, spec.scope.col, ...(keep ?? [])])];
  for (const filter of filtersFor(spec, who, seen)) {
    for (let from = 0; ; from += EXPORT_RULES.page) {
      const rows = await read({ table: spec.table, columns, filter, order: spec.order, from, to: from + EXPORT_RULES.page - 1 });
      for (const r of rows) {
        if (!inScope(spec, r, who, seen)) continue;
        if (keep) {
          const byCol = seen.get(fileOf(spec)) ?? new Map<string, Set<string>>();
          seen.set(fileOf(spec), byCol);
          for (const k of keep) {
            if (r[k] == null) continue;
            const set = byCol.get(k) ?? new Set<string>();
            set.add(String(r[k]));
            byCol.set(k, set);
          }
        }
        yield pickColumns(spec, r);
      }
      if (rows.length < EXPORT_RULES.page) break;
    }
  }
}

/** Where a media file goes in the ZIP: its id keeps names unique, its name stays readable. */
export function zipPathOf(m: Row) {
  const safe = String(m.name ?? "").replace(/[^\w.-]+/g, "-").replace(/^[.-]+/, "").slice(-80) || "file";
  return `files/${String(m.id).replace(/[^\w-]/g, "")}-${safe}`;
}

/** The storage path of an export: the person's folder, one file per export. */
export const storagePath = (userId: string, exportId: string) => `${userId}/${exportId}.zip`;

/** The name the browser saves it as. */
export const downloadName = (kind: ExportKind, at: Date) => `capybaroar-${kind === "account" ? "my-data" : "workspace"}-${at.toISOString().slice(0, 10)}.zip`;

/** The daily limit's counter for a person and kind (limits.ts). */
export const limitBucket = (kind: ExportKind, userId: string) => `export_${kind}:${userId}`;

export type ExportRow = { id: string; user_id: string | null; workspace_id: string | null; kind: ExportKind; status: ExportStatus; path: string | null; size: number | null; error: string | null; created_at: string; expires_at: string | null };

/** What Settings shows of an export. */
export type ExportView = { id: string; status: ExportStatus; createdAt: string; expiresAt: string | null; size: number | null };

/** A refusal to show the person as it is (a limit, a missing workspace); other errors show a short generic line. */
export class ExportRefused extends Error {}

/** When a link made for a ZIP ready at `readyAt` stops working. */
export const linkExpiry = (readyAt: Date) => new Date(readyAt.getTime() + EXPORT_RULES.linkMs);

/**
 * Whether this person may download this export now: theirs, ready, with a file, and inside its 24 hours. A workspace
 * export also needs them to still be its owner (`ownerNow`).
 */
export function mayDownload(row: ExportRow | null, userId: string, now: Date, ownerNow = true): "ok" | "missing" | "expired" | "not_ready" {
  if (!row || !row.user_id || row.user_id !== userId) return "missing";
  if (row.kind === "workspace" && !ownerNow) return "missing";
  if (row.status !== "ready" || !row.path) return "not_ready";
  if (!row.expires_at || new Date(row.expires_at).getTime() <= now.getTime()) return "expired";
  return "ok";
}

/** What a person asking for an export gets: start a new one, start the failed one again, or wait for the one running. */
export function nextStep(last: Pick<ExportRow, "id" | "status" | "created_at"> | null, now: Date): { do: "new" } | { do: "retry"; id: string } | { do: "wait"; id: string } {
  if (!last) return { do: "new" };
  const age = now.getTime() - new Date(last.created_at).getTime();
  if ((last.status === "queued" || last.status === "running") && age < EXPORT_RULES.stuckMs) return { do: "wait", id: last.id };
  // A failed (or stuck) one from today doesn't use up the day's export.
  if (last.status !== "ready" && age < EXPORT_RULES.stuckMs) return { do: "retry", id: last.id };
  return { do: "new" };
}

/** What the hourly prune removes. */
export function exportCutoffs(now = new Date()) {
  const t = now.getTime();
  return { stuck: new Date(t - EXPORT_RULES.stuckMs), failed: new Date(t - EXPORT_RULES.keepFailedMs) };
}

/** Tries `fn` up to `tries` times with growing waits; the last error is thrown. */
export async function withRetry<T>(fn: () => Promise<T>, tries = 3, waitMs = 500, sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i >= tries) throw e;
      await sleep(waitMs * 2 ** (i - 1));
    }
  }
}

export const fmtBytes = (n: number) => (n < 1024 ? `${n} B` : n < 1024 ** 2 ? `${(n / 1024).toFixed(1)} KB` : n < 1024 ** 3 ? `${(n / 1024 ** 2).toFixed(1)} MB` : `${(n / 1024 ** 3).toFixed(2)} GB`);

/** README.txt: what each file holds. */
export function readme(kind: ExportKind, o: { at: Date; files: { name: string; rows: number }[]; media: number; missing: string[] }) {
  const lines = [
    kind === "account" ? "Capybaroar: your data" : "Capybaroar: workspace export",
    `Made ${o.at.toISOString()} (UTC).`,
    "",
    "Each .json file is one list of records, one per row, with the columns as keys. Times are UTC (ISO 8601). Ids link",
    "records across files: a post's brand_id is an id in brands.json, a post target's post_id an id in posts.json.",
    "Passwords, sign-in tokens, API keys and webhook secrets are never included.",
    "",
  ];
  if (kind === "account")
    lines.push(
      "profile.json        Your name, email and when you signed up.",
      "memberships.json    The workspaces you belong to, your role and brands in each.",
      "policy_acceptances.json  The terms, privacy policy and DPA versions you accepted, and when.",
      "api_keys.json       Your API keys' names and dates (never the key).",
      "connected_apps.json and connected_app_names.json  Apps you connected (Claude, ChatGPT and others).",
      "agent_chats.json and agent_messages.json  Your chats with Capy.",
      "posts.json          Posts you created, in every workspace.",
      "post_comments.json  Your comments and approvals on posts.",
      "audit_events.json   What you did, from the workspaces' activity logs.",
    );
  else
    lines.push(
      "workspace.json      The workspace: name, time zone, posting times, plan.",
      "members.json        People: name, email, role and brands. invites.json holds invites not yet accepted.",
      "brands.json, channels.json, channel_groups.json, campaigns.json  How the workspace is set up. Channels never",
      "                    include their sign-in tokens.",
      "posts.json          Every post; post_targets.json is each post on each channel, with its link once published.",
      "post_comments.json, evergreen.json  Comments and approvals; evergreen repeats.",
      "media.json          Every file, with `file`: where it is in files/.",
      "generations.json    Pictures, videos and audio made with Capy.",
      "inbox_items.json    Comments, mentions and messages read into the Inbox.",
      "metrics.json, post_metrics.json  Follower counts by day, and each post's results.",
      "bio_pages.json, bio_views.json, links.json  Link-in-bio pages, their daily views and the short links.",
      "reports.json, feeds.json, snippets.json  Reports, RSS feeds and saved text.",
      "webhooks.json, webhook_deliveries.json  Webhook addresses and events (never the secret), and what was sent.",
      "api_keys.json, connected_apps.json  API key names and apps connected.",
      "credit_entries.json, alerts.json  Credits used and bought; alert emails sent.",
      "audit_events.json   The activity log.",
      "files/              The files themselves.",
    );
  lines.push("", "Rows in each file:");
  for (const f of o.files) lines.push(`  ${f.name}: ${f.rows}`);
  if (kind === "workspace") lines.push(`  files/: ${o.media}`);
  if (o.missing.length) lines.push("", "Files no longer in storage (their records are in media.json):", ...o.missing.map((m) => `  ${m}`));
  return lines.join("\r\n") + "\r\n";
}
