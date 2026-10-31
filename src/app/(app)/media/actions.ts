"use server";

import { revalidatePath } from "next/cache";
import { getCtx } from "@/lib/session";
import { deleteMedia, finishUpload, prepareUpload } from "@/lib/media";

type FileInfo = { name: string; type: string; size: number };

export async function startUpload(file: FileInfo): Promise<{ error?: string; path?: string; token?: string }> {
  const ctx = await getCtx();
  try {
    return await prepareUpload(ctx.workspaceId, file);
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export async function endUpload(file: FileInfo & { path: string }): Promise<{ error?: string }> {
  const ctx = await getCtx();
  try {
    await finishUpload(ctx.workspaceId, ctx.userId, file);
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
  revalidatePath("/media");
  return {};
}

export async function removeMedia(id: string) {
  const ctx = await getCtx();
  await deleteMedia(ctx.workspaceId, id);
  revalidatePath("/media");
}
