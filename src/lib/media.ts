import "server-only";
import { adminClient } from "./supabase/server";
import type { MediaFile } from "./providers/types";

export type MediaRow = { id: string; path: string; name: string; mime: string; size: number; alt: string | null; created_at: string };

const BUCKET = "media";
export const MAX_BYTES = 250 * 1024 * 1024;
export const ALLOWED = /^(image\/(jpeg|png|gif|webp)|video\/(mp4|quicktime))$/;

export async function listMedia(workspaceId: string): Promise<(MediaRow & { thumb: string | null })[]> {
  const db = adminClient();
  const { data, error } = await db.from("media").select("id, path, name, mime, size, alt, created_at").eq("workspace_id", workspaceId).order("created_at", { ascending: false }).limit(200);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as MediaRow[];
  if (!rows.length) return [];
  const { data: signed } = await db.storage.from(BUCKET).createSignedUrls(rows.map((r) => r.path), 3600);
  return rows.map((r, i) => ({ ...r, thumb: signed?.[i]?.signedUrl ?? null }));
}

/** Step 1 of an upload: check the file and hand back a one-time link the browser uploads to directly. */
export async function prepareUpload(workspaceId: string, file: { name: string; type: string; size: number }) {
  if (!ALLOWED.test(file.type)) throw new Error("Use JPG, PNG, GIF, WebP, MP4 or MOV");
  if (file.size > MAX_BYTES) throw new Error("Files are up to 250 MB");
  const safe = file.name.replace(/[^\w.-]+/g, "-").slice(-80);
  const path = `${workspaceId}/${crypto.randomUUID()}-${safe}`;
  const { data, error } = await adminClient().storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) throw new Error(error?.message ?? "Couldn't start the upload");
  return { path, token: data.token };
}

/** Step 2: the file is in storage, so record it. The path must belong to this workspace. */
export async function finishUpload(workspaceId: string, userId: string, file: { path: string; name: string; type: string; size: number }) {
  if (!file.path.startsWith(`${workspaceId}/`)) throw new Error("Wrong workspace");
  const db = adminClient();
  const dir = file.path.slice(0, file.path.lastIndexOf("/"));
  const base = file.path.slice(file.path.lastIndexOf("/") + 1);
  const { data: found } = await db.storage.from(BUCKET).list(dir, { search: base, limit: 1 });
  if (!found?.length) throw new Error("Upload didn't finish");
  const { data, error } = await db.from("media").insert({ workspace_id: workspaceId, path: file.path, name: file.name.slice(0, 200), mime: file.type, size: file.size, created_by: userId }).select("id").single();
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
