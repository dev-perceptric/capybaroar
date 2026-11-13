import "server-only";
import { adminClient } from "./supabase/server";
import type { MediaFile } from "./providers/types";
import { HEAD_BYTES, checkClaim, isUploadPath, judgeUpload } from "./uploadRules";

export type MediaRow = { id: string; path: string; name: string; mime: string; size: number; alt: string | null; created_at: string };

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

export async function listMedia(workspaceId: string): Promise<(MediaRow & { thumb: string | null })[]> {
  const db = adminClient();
  const { data, error } = await db.from("media").select("id, path, name, mime, size, alt, created_at").eq("workspace_id", workspaceId).order("created_at", { ascending: false }).limit(200);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as MediaRow[];
  if (!rows.length) return [];
  const thumbs = await showLinks(rows.map((r) => r.path));
  return rows.map((r, i) => ({ ...r, thumb: thumbs[i] }));
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
export async function finishUpload(workspaceId: string, userId: string, file: { path: string; name: string; type: string; size: number }) {
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
  const { data, error } = await db.from("media").insert({ workspace_id: workspaceId, path: file.path, name: file.name.slice(0, 200), mime: real.mime, size: real.size, created_by: userId }).select("id").single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function deleteMedia(workspaceId: string, id: string) {
  const db = adminClient();
  const { data } = await db.from("media").delete().eq("id", id).eq("workspace_id", workspaceId).select("path").maybeSingle();
  if (data?.path) await db.storage.from(BUCKET).remove([data.path]);
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

export async function setAlt(workspaceId: string, id: string, alt: string) {
  const { error } = await adminClient().from("media").update({ alt: alt.trim() || null }).eq("id", id).eq("workspace_id", workspaceId);
  if (error) throw new Error(error.message);
}

/** Signed links to show these files (an hour), for previews outside the app. */
export async function mediaThumbs(workspaceId: string, ids: string[]): Promise<{ id: string; mime: string; thumb: string | null; alt: string | null }[]> {
  if (!ids.length) return [];
  const db = adminClient();
  const { data, error } = await db.from("media").select("id, path, mime, alt").eq("workspace_id", workspaceId).in("id", ids);
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  if (!rows.length) return [];
  const { data: signed } = await db.storage.from(BUCKET).createSignedUrls(rows.map((r) => r.path as string), 3600);
  return rows.map((r, i) => ({ id: r.id as string, mime: r.mime as string, thumb: signed?.[i]?.signedUrl ?? null, alt: (r.alt as string | null) ?? null }));
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
  return data.id as string;
}
