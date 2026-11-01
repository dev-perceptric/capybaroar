"use server";

import { getCtx } from "@/lib/session";
import { deletePost, duplicatePost, postsBetween, reschedulePost, savePost, type SaveInput } from "@/lib/posts";
import { listMedia, setAlt } from "@/lib/media";

const fail = (e: unknown) => ({ error: e instanceof Error ? e.message : String(e) });

export async function loadPosts(from: string, to: string) {
  const ctx = await getCtx();
  return postsBetween(ctx.workspaceId, new Date(from), new Date(to));
}

export async function save(input: SaveInput): Promise<{ error?: string; id?: string; publishAt?: string | null }> {
  const ctx = await getCtx();
  try {
    return await savePost(ctx.workspaceId, ctx.userId, input);
  } catch (e) {
    return fail(e);
  }
}

export async function move(id: string, publishAt: string): Promise<{ error?: string }> {
  const ctx = await getCtx();
  try {
    await reschedulePost(ctx.workspaceId, id, new Date(publishAt));
    return {};
  } catch (e) {
    return fail(e);
  }
}

export async function duplicate(id: string): Promise<{ error?: string; id?: string }> {
  const ctx = await getCtx();
  try {
    return await duplicatePost(ctx.workspaceId, ctx.userId, id);
  } catch (e) {
    return fail(e);
  }
}

export async function remove(id: string): Promise<{ error?: string }> {
  const ctx = await getCtx();
  try {
    await deletePost(ctx.workspaceId, id);
    return {};
  } catch (e) {
    return fail(e);
  }
}

export async function loadMedia() {
  const ctx = await getCtx();
  return listMedia(ctx.workspaceId);
}

export async function saveAlt(id: string, alt: string): Promise<{ error?: string }> {
  const ctx = await getCtx();
  try {
    await setAlt(ctx.workspaceId, id, alt);
    return {};
  } catch (e) {
    return fail(e);
  }
}
