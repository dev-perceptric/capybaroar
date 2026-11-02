"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { writerCtx } from "@/lib/session";
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
