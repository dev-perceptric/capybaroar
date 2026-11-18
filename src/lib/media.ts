import "server-only";
import { adminClient } from "./supabase/server";
import type { MediaFile } from "./providers/types";
import { HEAD_BYTES, checkClaim, isUploadPath, isUuid, judgeUpload, mediaFilter, type MediaScope } from "./uploadRules";
import { THUMB_MIME, keepThumb, renderThumb, storedPaths, thumbPathOf, thumbable, tilePath } from "./thumbRules";
export type { MediaScope } from "./uploadRules";

export type MediaRow = { id: string; path: string; name: string; mime: string; size: number; alt: string | null; created_at: string; brand_id?: string | null };
/** A library file with links: `thumb` is the original (editing, previews, attaching), `tile` the small picture for a
 * tile (its thumbnail, or the original for files that have none). */
export type ListedMedia = MediaRow & { thumb: string | null; tile: string | null };

const BUCKET = "media";
export { ALLOWED, MAX_BYTES, MAX_PDF, UPLOADS } from "./uploadRules";

// Links for showing files are made for 2 hours and reused while they have more than an hour left. The same file keeps
// the same address between visits, so the browser shows it from its cache, and most lists skip the call to storage.
const SHOW_FOR_S = 2 * 3600;
const REUSE_MS = 3600 * 1000;
const shown = new Map<string, { url: string; until: number }>();

async function showLinks(paths: string[]): Promise<(string | null)[]> {
  const now = Date.now();
  const need = [...new Set(paths.filter((p) => !((shown.get(p)?.until ?? 0) - now > REUSE_MS)))];
  if (need.length) {
    const { data } = await adminClient().storage.from(BUCKET).createSignedUrls(need, SHOW_FOR_S);
    if (shown.size > 20000) for (const [p, v] of shown) if (v.until - now <= REUSE_MS) shown.delete(p);
    if (shown.size > 20000) shown.clear();
    (data ?? []).forEach((s, i) => {
      if (s.signedUrl && !s.error) shown.set(need[i], { url: s.signedUrl, until: now + SHOW_FOR_S * 1000 });
    });
  }
  return paths.map((p) => shown.get(p)?.url ?? null);
}

/** Whether this member may see or change this file. */
export async function mayUseMedia(workspaceId: string, id: string, scope?: MediaScope | null): Promise<boolean> {
  if (!isUuid(id)) return false;
  let q = adminClient().from("media").select("id").eq("workspace_id", workspaceId).eq("id", id);
  const f = mediaFilter(scope);
  if (f) q = q.or(f);
  const { data } = await q.maybeSingle();
  return !!data;
}

// Until migration 048 has run, media has no thumb_path column, and a select naming it fails (the Media page, the
// composer's library, deletes). Every read of it asks here first: whether the column exists, remembered for good once
// it does and looked at again every 5 minutes while it doesn't, so the app works before and after the migration.
let thumbCol: { has: boolean; at: number } | null = null;
async function hasThumbColumn(): Promise<boolean> {
  if (thumbCol && (thumbCol.has || Date.now() - thumbCol.at < 300_000)) return thumbCol.has;
  const { error } = await adminClient().from("media").select("thumb_path").limit(1);
  // Any other error (the database busy) says nothing about the column: don't remember it.
  const missing = !!error && (error.code === "42703" || error.code === "PGRST204" || /thumb_path/.test(error.message));
  if (!error || missing) thumbCol = { has: !error, at: Date.now() };
  return !error;
}
/** `cols` plus thumb_path when the column exists. */
export async function withThumb(cols: string): Promise<string> {
  return (await hasThumbColumn()) ? `${cols}, thumb_path` : cols;
}
type StoredRow = { path: string; thumb_path?: string | null };
/** A row read with withThumb, as storedPaths and tilePath take it. */
export const stored = (row: unknown) => {
  const r = row as StoredRow;
  return { path: r.path, thumb_path: r.thumb_path ?? null };
};

export async function listMedia(workspaceId: string, scope?: MediaScope | null): Promise<ListedMedia[]> {
  const db = adminClient();
  let q = db.from("media").select(await withThumb("id, path, name, mime, size, alt, created_at, brand_id")).eq("workspace_id", workspaceId);
  const f = mediaFilter(scope);
  if (f) q = q.or(f);
  const { data, error } = await q.order("created_at", { ascending: false }).limit(200);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as unknown as (MediaRow & { thumb_path?: string | null })[];
  if (!rows.length) return [];
  const [full, small] = await Promise.all([showLinks(rows.map((r) => r.path)), showLinks(rows.map((r) => tilePath(stored(r))))]);
  return rows.map((r, i) => ({ id: r.id, path: r.path, name: r.name, mime: r.mime, size: r.size, alt: r.alt, created_at: r.created_at, brand_id: r.brand_id, thumb: full[i], tile: small[i] ?? full[i] }));
}

/** Step 1 of an upload: check the file and hand back a one-time link the browser uploads to directly. */
export async function prepareUpload(workspaceId: string, file: { name: string; type: string; size: number }) {
  checkClaim(file);
  const safe = String(file.name ?? "").replace(/[^\w.-]+/g, "-").slice(-80) || "file";
  const path = `${workspaceId}/${crypto.randomUUID()}-${safe}`;
  const { data, error } = await adminClient().storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) throw new Error(error?.message ?? "Couldn't start the upload");
  return { path, token: data.token };
}

/** The first bytes of a stored file, without downloading the rest. */
async function headOf(path: string): Promise<Uint8Array> {
  const { data: s, error } = await adminClient().storage.from(BUCKET).createSignedUrl(path, 60);
  if (error || !s) throw new Error(error?.message ?? "Couldn't read the upload");
  const res = await fetch(s.signedUrl, { headers: { Range: `bytes=0-${HEAD_BYTES - 1}` }, signal: AbortSignal.timeout(30000) });
  if (!res.ok || !res.body) throw new Error("Couldn't read the upload");
  // A server that ignores Range sends the whole file: read only the start, then stop.
  const reader = res.body.getReader();
  const out = new Uint8Array(HEAD_BYTES);
  let n = 0;
  try {
    while (n < HEAD_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      const take = value.subarray(0, HEAD_BYTES - n);
      out.set(take, n);
      n += take.length;
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  return out.subarray(0, n);
}

/**
 * Step 2: the file is in storage, so record it. The path must be one prepareUpload made for this workspace. What
 * the browser said is only a claim: the stored file's real size and first bytes decide, and a file that isn't an
 * allowed kind, isn't what was claimed, or is too big is deleted and refused.
 */
export async function finishUpload(workspaceId: string, userId: string, file: { path: string; name: string; type: string; size: number }, brandId: string | null = null) {
  if (!isUploadPath(workspaceId, file.path)) throw new Error("Wrong workspace");
  if (typeof file.type !== "string" || typeof file.name !== "string") throw new Error("Upload didn't finish");
  const db = adminClient();
  const dir = file.path.slice(0, file.path.lastIndexOf("/"));
  const base = file.path.slice(file.path.lastIndexOf("/") + 1);
  const { data: found } = await db.storage.from(BUCKET).list(dir, { search: base, limit: 5 });
  const obj = found?.find((f) => f.name === base);
  if (!obj) throw new Error("Upload didn't finish");
  const { data: had } = await db.from("media").select("id").eq("workspace_id", workspaceId).eq("path", file.path).maybeSingle();
  if (had) return had.id as string;
  const stored = Number((obj.metadata as { size?: unknown } | null)?.size);
  if (!Number.isFinite(stored)) throw new Error("Upload didn't finish");
  // A hiccup reading the file leaves it in place for a retry; only a refused file is deleted.
  const head = await headOf(file.path);
  let real: { mime: string; size: number };
  try {
    real = judgeUpload(file.type, head, stored);
  } catch (e) {
    await db.storage.from(BUCKET).remove([file.path]);
    throw e;
  }
  const { data, error } = await db.from("media").insert({ workspace_id: workspaceId, brand_id: isUuid(brandId) ? brandId : null, path: file.path, name: file.name.slice(0, 200), mime: real.mime, size: real.size, created_by: userId }).select("id").single();
  if (error) throw new Error(error.message);
  await makeThumb(workspaceId, data.id as string, file.path, real.mime, real.size);
  return data.id as string;
}

/**
 * Makes a picture's thumbnail (renderThumb), stores it at thumbPathOf(path) and records it on the media row. Never
 * throws: a file without one shows its original. Pass the original's bytes when they're at hand; otherwise they're
 * downloaded.
 */
export async function makeThumb(workspaceId: string, id: string, path: string, mime: string, size: number, bytes?: Uint8Array): Promise<void> {
  if (!thumbable(mime, size) || !(await hasThumbColumn())) return;
  const db = adminClient();
  try {
    let src = bytes;
    if (!src) {
      const { data, error } = await db.storage.from(BUCKET).download(path);
      if (error || !data) throw new Error(error?.message ?? "Couldn't read the file");
      src = new Uint8Array(await data.arrayBuffer());
    }
    const out = await renderThumb(src);
    if (!keepThumb(out.length, src.length)) return;
    const thumb = thumbPathOf(path);
    const up = await db.storage.from(BUCKET).upload(thumb, out, { contentType: THUMB_MIME, upsert: true });
    if (up.error) throw new Error(up.error.message);
    const { error } = await db.from("media").update({ thumb_path: thumb }).eq("id", id).eq("workspace_id", workspaceId);
    if (error) {
      await db.storage.from(BUCKET).remove([thumb]);
      throw new Error(error.message);
    }
  } catch (e) {
    console.error("thumbnail:", id, e instanceof Error ? e.message : e);
  }
}

export async function deleteMedia(workspaceId: string, id: string, scope?: MediaScope | null) {
  if (!(await mayUseMedia(workspaceId, id, scope))) throw new Error("File not found");
  const db = adminClient();
  const { data } = await db.from("media").delete().eq("id", id).eq("workspace_id", workspaceId).select(await withThumb("path")).maybeSingle();
  if (data) await db.storage.from(BUCKET).remove(storedPaths([stored(data)]));
}

/** Media for publishing: a signed link networks can fetch for an hour, and the bytes for networks we upload to. */
export async function mediaFiles(workspaceId: string, ids: string[]): Promise<MediaFile[]> {
  if (!ids.length) return [];
  const db = adminClient();
  const { data, error } = await db.from("media").select("id, path, name, mime, size, alt").eq("workspace_id", workspaceId).in("id", ids);
  if (error) throw new Error(error.message);
  const byId = new Map((data ?? []).map((r) => [r.id as string, r as MediaRow]));
  const out: MediaFile[] = [];
  for (const id of ids) {
    const r = byId.get(id);
    if (!r) throw new Error("A file in this post was deleted");
    const { data: s, error: e } = await db.storage.from(BUCKET).createSignedUrl(r.path, 3600);
    if (e || !s) throw new Error(e?.message ?? "Couldn't link a file");
    out.push({
      url: s.signedUrl,
      mime: r.mime,
      size: Number(r.size),
      name: r.name,
      alt: r.alt,
      bytes: async () => {
        const { data: blob, error: e3 } = await db.storage.from(BUCKET).download(r.path);
        if (e3 || !blob) throw new Error(e3?.message ?? "Couldn't read a file");
        return Buffer.from(await blob.arrayBuffer());
      },
    });
  }
  return out;
}

/** Size and type only, for checks before scheduling (no download). */
export async function mediaInfo(workspaceId: string, ids: string[]): Promise<(MediaFile & { id: string })[]> {
  if (!ids.length) return [];
  const { data } = await adminClient().from("media").select("id, name, mime, size, alt").eq("workspace_id", workspaceId).in("id", ids);
  return (data ?? []).map((r) => ({ id: r.id as string, url: "", mime: r.mime as string, size: Number(r.size), name: r.name as string, alt: r.alt as string | null, bytes: async () => Buffer.alloc(0) }));
}

export async function setAlt(workspaceId: string, id: string, alt: string, scope?: MediaScope | null) {
  if (!(await mayUseMedia(workspaceId, id, scope))) throw new Error("File not found");
  const { error } = await adminClient().from("media").update({ alt: alt.trim() || null }).eq("id", id).eq("workspace_id", workspaceId);
  if (error) throw new Error(error.message);
}

/**
 * Signed links to show these files, good for at least an hour (reused like the library's), for previews outside the
 * app. `thumb` is the original; `tile` the small picture for a tile (its thumbnail, or the original).
 */
export async function mediaThumbs(workspaceId: string, ids: string[]): Promise<{ id: string; mime: string; thumb: string | null; tile: string | null; alt: string | null }[]> {
  if (!ids.length) return [];
  const { data, error } = await adminClient().from("media").select(await withThumb("id, path, mime, alt")).eq("workspace_id", workspaceId).in("id", ids);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as unknown as { id: string; path: string; thumb_path?: string | null; mime: string; alt: string | null }[];
  if (!rows.length) return [];
  const [full, small] = await Promise.all([showLinks(rows.map((r) => r.path)), showLinks(rows.map((r) => tilePath(stored(r))))]);
  return rows.map((r, i) => ({ id: r.id, mime: r.mime, thumb: full[i], tile: small[i] ?? full[i], alt: r.alt ?? null }));
}

/** Saves a file the server made (a carousel PDF, slideshow pictures) to the media library. Returns its id. */
export async function saveMadeFile(workspaceId: string, userId: string, bytes: Buffer, name: string, mime: string): Promise<string> {
  const safe = name.replace(/[^\w.-]+/g, "-").slice(-80);
  const path = `${workspaceId}/${crypto.randomUUID()}-${safe}`;
  const db = adminClient();
  const up = await db.storage.from(BUCKET).upload(path, bytes, { contentType: mime });
  if (up.error) throw new Error(`Couldn't save ${name}: ${up.error.message}`);
  const { data, error } = await db.from("media").insert({ workspace_id: workspaceId, path, name: name.slice(0, 200), mime, size: bytes.length, created_by: userId }).select("id").single();
  if (error) throw new Error(error.message);
  await makeThumb(workspaceId, data.id as string, path, mime, bytes.length, bytes);
  return data.id as string;
}
