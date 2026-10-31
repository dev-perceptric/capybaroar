"use server";

import { getCtx } from "@/lib/session";
import { deletePost, postsBetween, savePost, type SaveInput } from "@/lib/posts";
import { listMedia } from "@/lib/media";

export async function loadPosts(from: string, to: string) {
  const ctx = await getCtx();
  return postsBetween(ctx.workspaceId, new Date(from), new Date(to));
}

export async function save(input: SaveInput): Promise<{ error?: string; id?: string }> {
  const ctx = await getCtx();
  try {
    return await savePost(ctx.workspaceId, ctx.userId, input);
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export async function remove(id: string): Promise<{ error?: string }> {
  const ctx = await getCtx();
  try {
    await deletePost(ctx.workspaceId, id);
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export async function loadMedia() {
  const ctx = await getCtx();
  return listMedia(ctx.workspaceId);
}
