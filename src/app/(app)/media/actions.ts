"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { getCtx, writerCtx } from "@/lib/session";
import { deleteMedia, finishUpload, prepareUpload } from "@/lib/media";
import { isUuid } from "@/lib/uploadRules";

type FileInfo = { name: string; type: string; size: number };

/** A server action takes anything: keep only the fields, with their types. */
function fileInfo(raw: unknown): FileInfo & { path?: string } {
  const f = (raw ?? {}) as Record<string, unknown>;
  if (typeof f.name !== "string" || typeof f.type !== "string" || typeof f.size !== "number" || (f.path !== undefined && typeof f.path !== "string")) throw new Error("Upload didn't finish");
  return { name: f.name, type: f.type, size: f.size, ...(typeof f.path === "string" ? { path: f.path } : {}) };
}

export async function startUpload(file: FileInfo): Promise<{ error?: string; path?: string; token?: string }> {
  try {
    const ctx = await writerCtx();
    return await prepareUpload(ctx.workspaceId, fileInfo(file));
  } catch (e) {
    unstable_rethrow(e);
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export async function endUpload(file: FileInfo & { path: string }): Promise<{ error?: string; id?: string }> {
  let id: string;
  try {
    const ctx = await writerCtx();
    const f = fileInfo(file);
    if (!f.path) throw new Error("Upload didn't finish");
    id = await finishUpload(ctx.workspaceId, ctx.userId, { ...f, path: f.path });
  } catch (e) {
    unstable_rethrow(e);
    return { error: e instanceof Error ? e.message : String(e) };
  }
  revalidatePath("/media");
  return { id };
}

/** How many posts still to go out (drafts, in review, scheduled) use this file, so deleting it can warn first. */
export async function mediaUsage(id: string): Promise<number> {
  const ctx = await writerCtx();
  // The id goes into a filter string, so it must be a plain UUID.
  if (!isUuid(id)) return 0;
  const { adminClient } = await import("@/lib/supabase/server");
  const { count } = await adminClient()
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", ctx.workspaceId)
    .in("status", ["draft", "review", "scheduled"])
    .or(`media_ids.cs.{${id}},thread.cs.[{"media_ids":["${id}"]}]`);
  return count ?? 0;
}

export async function removeMedia(id: string) {
  const ctx = await writerCtx();
  if (!isUuid(id)) return;
  await deleteMedia(ctx.workspaceId, id);
  revalidatePath("/media");
}

/** Start an AI picture or video. Its file lands in the library when it's done (generationsStatus). */
export async function generate(body: unknown): Promise<{ error?: string; id?: string }> {
  try {
    const ctx = await writerCtx();
    const { genRequest } = await import("@/lib/genRules");
    const { startGeneration } = await import("@/lib/generations");
    const { getBrandCtx, homeBrand } = await import("@/lib/brands");
    const g = await startGeneration({ workspaceId: ctx.workspaceId, userId: ctx.userId, brandId: homeBrand(await getBrandCtx()) }, genRequest(body));
    return g.status === "failed" ? { error: g.error ?? "Couldn't make it. Try again." } : { id: g.id };
  } catch (e) {
    unstable_rethrow(e);
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export async function generationsStatus(ids: string[]): Promise<{ id: string; kind: string; status: string; error: string | null; media_id: string | null }[]> {
  const ctx = await getCtx();
  const { generationsOf } = await import("@/lib/generations");
  return (await generationsOf(ctx.workspaceId, ids.filter((x) => typeof x === "string"))).map((g) => ({ id: g.id, kind: g.kind, status: g.status, error: g.error, media_id: g.media_id }));
}

/** The workspace's AI credits: this period's plan credits, and what's left in all. */
export async function aiCredits(): Promise<{ total: number; left: number }> {
  const ctx = await getCtx();
  const { aiCreditsOf } = await import("@/lib/generations");
  return aiCreditsOf(ctx.workspaceId);
}
