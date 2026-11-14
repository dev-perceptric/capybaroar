import "server-only";
import { createReadStream } from "node:fs";
import { statfs } from "node:fs/promises";
import { Readable } from "node:stream";
import { adminClient } from "./supabase/server";
import { appUrl } from "./channels";
import { emailsOf, sendEmail } from "./alerts";
import { audit } from "./audit";
import { enqueue } from "./jobs";
import { LIMITS, retryIn, takeAll } from "./limits";
import { isUuid } from "./uploadRules";
import {
  ACCOUNT_TABLES,
  EXPORT_RULES,
  WORKSPACE_TABLES,
  downloadName,
  exportCutoffs,
  fileOf,
  keysNeeded,
  limitBucket,
  mayDownload,
  nextStep,
  readTable,
  storagePath,
  withRetry,
  type ExportKind,
  ExportRefused,
  type ExportRow,
  type ExportView,
  type Reader,
  type Row,
  type Seen,
  type TableSpec,
  type Who,
} from "./exportRules";
import { runExportWith, type Part } from "./exportZip";

export type { ExportView } from "./exportRules";

// Data exports (rules in exportRules.ts, building in exportZip.ts). Asking queues a "data_export" job; the job builds
// the ZIP, uploads it to the private "exports" bucket and emails a link to /api/exports/<id>, which works for 24 hours.

const BUCKET = "exports";
const MEDIA = "media";
const COLS = "id, user_id, workspace_id, kind, status, path, size, error, created_at, expires_at";
const db = () => adminClient();

/** One page of a table, tried 3 times. */
const read: Reader = (q) =>
  withRetry(async () => {
    const base = db().from(q.table).select(q.columns.join(", "));
    let b = "eq" in q.filter ? base.eq(q.filter.col, q.filter.eq) : base.in(q.filter.col, q.filter.in);
    for (const o of q.order) b = b.order(o, { ascending: true });
    const { data, error } = await b.range(q.from, q.to);
    if (error) throw new Error(`${q.table}: ${error.message}`);
    return (data ?? []) as unknown as Row[];
  });

async function userOf(id: string) {
  return withRetry(async () => {
    const { data, error } = await db().auth.admin.getUserById(id);
    if (error && !/not.?found/i.test(error.message)) throw new Error(error.message);
    return data?.user ?? null;
  });
}

const nameOf = (u: { email?: string | null; user_metadata?: Record<string, unknown> } | null) => (u?.user_metadata?.name as string | undefined) || u?.email?.split("@")[0] || "";

async function brandNames(workspaceIds: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  for (let i = 0; i < workspaceIds.length; i += EXPORT_RULES.chunk) {
    for (let from = 0; ; from += EXPORT_RULES.page) {
      const rows = await read({ table: "brands", columns: ["id", "name", "workspace_id"], filter: { col: "workspace_id", in: workspaceIds.slice(i, i + EXPORT_RULES.chunk) }, order: ["id"], from, to: from + EXPORT_RULES.page - 1 });
      for (const r of rows) out.set(String(r.id), String(r.name));
      if (rows.length < EXPORT_RULES.page) break;
    }
  }
  return out;
}

const brandsOf = (ids: unknown, names: Map<string, string>) => (Array.isArray(ids) ? ids.map((id) => names.get(String(id)) ?? String(id)) : "all");

/** Members with their name, email and brands' names. */
async function* people(rows: AsyncIterable<Row>, workspaceId: string): AsyncGenerator<Row> {
  const names = await brandNames([workspaceId]);
  for await (const r of rows) {
    const u = await userOf(String(r.user_id));
    yield { user_id: r.user_id, name: nameOf(u), email: u?.email ?? "", role: r.role, brands: brandsOf(r.brand_ids, names), joined_at: r.created_at };
  }
}

async function* profile(userId: string): AsyncGenerator<Row> {
  const u = await userOf(userId);
  if (u) yield { id: u.id, name: nameOf(u), email: u.email ?? "", created_at: u.created_at, last_sign_in_at: u.last_sign_in_at ?? null };
}

async function* memberships(userId: string): AsyncGenerator<Row> {
  const data = await withRetry(async () => {
    const r = await db().from("members").select("workspace_id, user_id, role, brand_ids, created_at, workspaces(name)").eq("user_id", userId).order("created_at");
    if (r.error) throw new Error(`members: ${r.error.message}`);
    return r.data ?? [];
  });
  // Checked again, like every other read.
  const rows = data.filter((m) => m.user_id === userId);
  const names = await brandNames(rows.map((m) => m.workspace_id as string));
  for (const m of rows) {
    const w = (Array.isArray(m.workspaces) ? m.workspaces[0] : m.workspaces) as { name?: string } | null;
    yield { workspace_id: m.workspace_id, workspace_name: w?.name ?? "", role: m.role, brands: brandsOf(m.brand_ids, names), joined_at: m.created_at };
  }
}

/** The JSON files of an export, in order: parents before the tables scoped by them. */
function partsOf(row: ExportRow): Part[] {
  const userId = row.user_id!;
  const who: Who = { workspaceId: row.kind === "workspace" ? row.workspace_id : null, userId };
  const specs: TableSpec[] = row.kind === "workspace" ? WORKSPACE_TABLES : ACCOUNT_TABLES;
  const seen: Seen = new Map();
  const needed = keysNeeded(specs);
  const tables: Part[] = specs.map((spec) => ({
    name: fileOf(spec),
    rows: () => (spec.table === "members" && who.workspaceId ? people(readTable(spec, read, who, seen, needed), who.workspaceId) : readTable(spec, read, who, seen, needed)),
  }));
  if (row.kind === "workspace") return tables;
  return [{ name: "profile", rows: () => profile(userId) }, { name: "memberships", rows: () => memberships(userId) }, ...tables];
}

/** A stored media file as a stream, or null when storage no longer has it. */
async function openMedia(path: string): Promise<Readable | null> {
  return withRetry(async () => {
    const { data, error } = await db().storage.from(MEDIA).createSignedUrl(path, 3600);
    if (error || !data) {
      if (/not.?found|404/i.test(error?.message ?? "")) return null;
      throw new Error(`file: ${error?.message ?? "no link"}`);
    }
    // Up to 250 MB a file: 15 minutes is a slow link's worth.
    const res = await fetch(data.signedUrl, { signal: AbortSignal.timeout(15 * 60000) });
    if (res.status === 404 || res.status === 400) {
      await res.body?.cancel().catch(() => {});
      return null;
    }
    if (!res.ok || !res.body) throw new Error(`file: storage answered ${res.status}`);
    return Readable.fromWeb(res.body as import("node:stream/web").ReadableStream<Uint8Array>);
  });
}

/** Bytes of media in a workspace, to check there's room before building. */
async function mediaBytes(workspaceId: string) {
  let n = 0;
  for (let from = 0; ; from += EXPORT_RULES.page) {
    const rows = await read({ table: "media", columns: ["id", "size", "workspace_id"], filter: { col: "workspace_id", eq: workspaceId }, order: ["id"], from, to: from + EXPORT_RULES.page - 1 });
    for (const r of rows) n += Number(r.size) || 0;
    if (rows.length < EXPORT_RULES.page) break;
  }
  return n;
}

async function loadExport(id: string): Promise<ExportRow | null> {
  const { data, error } = await db().from("data_exports").select(COLS).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as ExportRow | null) ?? null;
}

/** Updates the export unless it's ready; true when a row changed. */
async function setUnlessReady(id: string, values: Record<string, unknown>) {
  const { data, error } = await db().from("data_exports").update(values).eq("id", id).neq("status", "ready").select("id");
  if (error) throw new Error(error.message);
  return (data ?? []).length > 0;
}

/** The "data_export" job. Throws to retry; a repeat after it finished does nothing. */
export async function runDataExport(payload: Record<string, string>) {
  const id = payload.exportId;
  if (!isUuid(id)) return;
  const r = await runExportWith({
    load: () => withRetry(() => loadExport(id)),
    start: () => withRetry(() => setUnlessReady(id, { status: "running", error: null })),
    async checkRoom(dir) {
      const row = await loadExport(id);
      const want = (row?.kind === "workspace" && row.workspace_id ? await mediaBytes(row.workspace_id) : 0) * 2.05 + 200 * 1024 * 1024;
      const s = await statfs(dir);
      if (s.bavail * s.bsize < want) throw new Error("Not enough disk space to build the export");
    },
    parts: partsOf,
    open: openMedia,
    async upload(file) {
      const row = await loadExport(id);
      if (!row?.path) throw new Error("The export has no path");
      await withRetry(async () => {
        const { error } = await db().storage.from(BUCKET).upload(row.path!, createReadStream(file), { contentType: "application/zip", duplex: "half", upsert: true });
        if (error) throw new Error(`upload: ${error.message}`);
      });
    },
    async remove() {
      const row = await loadExport(id);
      if (row?.path) await db().storage.from(BUCKET).remove([row.path]);
    },
    ready: (size, expiresAt) => withRetry(() => setUnlessReady(id, { status: "ready", size, error: null, expires_at: expiresAt.toISOString() })),
    failed: (error) => withRetry(() => setUnlessReady(id, { status: "failed", error }).then(() => {})),
    async done(row, size, expiresAt) {
      try {
        const to = row.user_id ? await emailsOf([row.user_id]) : [];
        const what = row.kind === "account" ? "Your Capybaroar data is ready" : "Your workspace export is ready";
        await sendEmail(to, what, { title: what, body: `The link works until ${expiresAt.toUTCString()}.`, button: "Download", href: `${appUrl()}/api/exports/${row.id}` });
        await audit({ workspaceId: row.workspace_id, actorId: row.user_id, action: "data.exported", target: { type: "export", id: row.id, label: row.kind === "account" ? "My data" : "Workspace" }, meta: { kind: row.kind, size } });
      } catch (e) {
        console.error("export done:", e instanceof Error ? e.message : e);
      }
    },
  });
  if (r === "done") console.log(`export ${id} ready`);
}

/** The newest export of a kind for this person (and workspace). */
async function newest(userId: string, kind: ExportKind, workspaceId: string | null): Promise<ExportRow | null> {
  let q = db().from("data_exports").select(COLS).eq("user_id", userId).eq("kind", kind);
  if (kind === "workspace" && workspaceId) q = q.eq("workspace_id", workspaceId);
  const { data, error } = await q.order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as ExportRow | null) ?? null;
}

function view(r: ExportRow | null, now = new Date()): ExportView | null {
  if (!r) return null;
  if (r.status === "ready" && (!r.expires_at || new Date(r.expires_at) <= now)) return null;
  const stuck = (r.status === "queued" || r.status === "running") && now.getTime() - new Date(r.created_at).getTime() >= EXPORT_RULES.stuckMs;
  return { id: r.id, status: stuck ? "failed" : r.status, createdAt: r.created_at, expiresAt: r.expires_at, size: r.size };
}

/** The data loader for DataExport: this person's last export, and the workspace's when they're its owner. */
export async function lastExports(userId: string, workspaceId: string, owner: boolean): Promise<{ account: ExportView | null; workspace: ExportView | null }> {
  const [a, w] = await Promise.all([newest(userId, "account", null), owner ? newest(userId, "workspace", workspaceId) : Promise.resolve(null)]);
  return { account: view(a), workspace: owner ? view(w) : null };
}

/**
 * Starts an export: waits on one already running, starts a failed one again, or (once a day per kind) a new one.
 * Callers check the person may (owners only for a workspace).
 */
export async function startExport(userId: string, kind: ExportKind, workspaceId: string | null): Promise<void> {
  if (kind === "workspace" && !workspaceId) throw new ExportRefused("No workspace");
  const step = nextStep(await newest(userId, kind, workspaceId), new Date());
  if (step.do === "wait") return;
  let id: string;
  if (step.do === "retry") {
    id = step.id;
    const { error } = await db().from("data_exports").update({ status: "queued", error: null, created_at: new Date().toISOString() }).eq("id", id).neq("status", "ready");
    if (error) throw new Error(error.message);
  } else {
    const wait = await takeAll([{ bucket: limitBucket(kind, userId), l: kind === "account" ? LIMITS.exportAccountDay : LIMITS.exportWorkspaceDay }]);
    if (wait > 0) throw new ExportRefused(`One export a day. ${retryIn(wait)}`);
    id = crypto.randomUUID();
    const { error } = await db().from("data_exports").insert({ id, user_id: userId, workspace_id: kind === "workspace" ? workspaceId : null, kind, status: "queued", path: storagePath(userId, id) });
    if (error) throw new Error(error.message);
  }
  try {
    await withRetry(() => enqueue("data_export", { exportId: id }));
  } catch (e) {
    // Shown as failed, so asking again starts it without waiting a day.
    await db().from("data_exports").update({ status: "failed", error: "Couldn't queue the export" }).eq("id", id).neq("status", "ready");
    throw e;
  }
}

/** For /api/exports/<id>: a short-lived signed address of the ZIP, when this person may download it now. */
export async function downloadUrl(id: string, userId: string): Promise<{ url: string } | { error: "missing" | "expired" | "not_ready" }> {
  if (!isUuid(id)) return { error: "missing" };
  const row = await loadExport(id);
  let owner = true;
  if (row?.kind === "workspace") {
    const { data } = await db().from("members").select("role").eq("workspace_id", row.workspace_id ?? "").eq("user_id", userId).maybeSingle();
    owner = data?.role === "owner";
  }
  const may = mayDownload(row, userId, new Date(), owner);
  if (may !== "ok") return { error: may };
  const { data, error } = await db().storage.from(BUCKET).createSignedUrl(row!.path!, EXPORT_RULES.signedS, { download: downloadName(row!.kind, new Date(row!.created_at)) });
  if (error || !data) return { error: "missing" };
  return { url: data.signedUrl };
}

/**
 * Hourly (prune.ts): exports stuck for a day are marked failed; expired exports, and failed ones older than a week,
 * lose their file and then their row. A file that can't be deleted keeps its row for the next hour.
 */
export async function pruneExports(now = new Date()) {
  const c = exportCutoffs(now);
  const { error: e1 } = await db().from("data_exports").update({ status: "failed", error: "Didn't finish" }).in("status", ["queued", "running"]).lt("created_at", c.stuck.toISOString());
  if (e1) throw new Error(e1.message);
  const gone: { id: string; path: string | null }[] = [];
  for (const q of [
    db().from("data_exports").select("id, path").lt("expires_at", now.toISOString()).limit(500),
    db().from("data_exports").select("id, path").eq("status", "failed").lt("created_at", c.failed.toISOString()).limit(500),
  ]) {
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    gone.push(...((data ?? []) as { id: string; path: string | null }[]));
  }
  const paths = [...new Set(gone.map((g) => g.path).filter((p): p is string => !!p))];
  for (let i = 0; i < paths.length; i += 100) {
    const { error } = await db().storage.from(BUCKET).remove(paths.slice(i, i + 100));
    if (error) throw new Error(`export files: ${error.message}`);
  }
  const ids = [...new Set(gone.map((g) => g.id))];
  for (let i = 0; i < ids.length; i += EXPORT_RULES.chunk) {
    const { error } = await db().from("data_exports").delete().in("id", ids.slice(i, i + EXPORT_RULES.chunk));
    if (error) throw new Error(error.message);
  }
}
