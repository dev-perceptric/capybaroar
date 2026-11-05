"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { getCtx, writerCtx } from "@/lib/session";
import { deleteMedia, finishUpload, prepareUpload } from "@/lib/media";

type FileInfo = { name: string; type: string; size: number };

export async function startUpload(file: FileInfo): Promise<{ error?: string; path?: string; token?: string }> {
  try {
    const ctx = await writerCtx();
    return await prepareUpload(ctx.workspaceId, file);
  } catch (e) {
    unstable_rethrow(e);
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export async function endUpload(file: FileInfo & { path: string }): Promise<{ error?: string; id?: string }> {
  let id: string;
  try {
    const ctx = await writerCtx();
    id = await finishUpload(ctx.workspaceId, ctx.userId, file);
  } catch (e) {
    unstable_rethrow(e);
    return { error: e instanceof Error ? e.message : String(e) };
  }
  revalidatePath("/media");
  return { id };
}

export async function removeMedia(id: string) {
  const ctx = await writerCtx();
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
