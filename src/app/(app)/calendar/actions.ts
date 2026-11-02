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

/** What the composer needs when it opens, in one trip: the browser sends server actions one at a time. Each part is
 * null when it failed. */
export async function composerData() {
  const ctx = await getCtx();
  const { suggestedTimes } = await import("@/lib/analytics");
  const [best, media] = await Promise.allSettled([suggestedTimes(ctx.workspaceId, ctx.timezone), listMedia(ctx.workspaceId)]);
  return { best: best.status === "fulfilled" ? best.value : null, media: media.status === "fulfilled" ? media.value : null };
}

/** The workspace's 3 best slots, from its own results (empty until there's enough data). */
export async function bestSlots() {
  const ctx = await getCtx();
  const { suggestedTimes } = await import("@/lib/analytics");
  return suggestedTimes(ctx.workspaceId, ctx.timezone);
}

export async function aiRewrite(text: string, how: string, network: string | null): Promise<{ error?: string; text?: string }> {
  const ctx = await getCtx();
  const { rewrite } = await import("@/lib/composer");
  try {
    return { text: await rewrite(ctx.workspaceId, text, how as never, (network as never) ?? null) };
  } catch (e) {
    return fail(e);
  }
}

export async function loadSnippets() {
  const ctx = await getCtx();
  const { listSnippets } = await import("@/lib/composer");
  return listSnippets(ctx.workspaceId);
}

export async function newSnippet(name: string, body: string): Promise<{ error?: string; snippet?: { id: string; name: string; body: string } }> {
  const ctx = await getCtx();
  const { addSnippet } = await import("@/lib/composer");
  try {
    return { snippet: await addSnippet(ctx.workspaceId, name, body) };
  } catch (e) {
    return fail(e);
  }
}

export async function removeSnippet(id: string): Promise<{ error?: string }> {
  const ctx = await getCtx();
  const { deleteSnippet } = await import("@/lib/composer");
  try {
    await deleteSnippet(ctx.workspaceId, id);
    return {};
  } catch (e) {
    return fail(e);
  }
}

export async function shortLink(url: string): Promise<{ error?: string; url?: string }> {
  const ctx = await getCtx();
  const { shorten } = await import("@/lib/composer");
  try {
    return { url: await shorten(ctx.workspaceId, url) };
  } catch (e) {
    return fail(e);
  }
}

export async function trim(id: string, start: number, end: number): Promise<{ error?: string; id?: string }> {
  const ctx = await getCtx();
  const { trimVideo } = await import("@/lib/composer");
  try {
    return { id: await trimVideo(ctx.workspaceId, ctx.userId, id, start, end) };
  } catch (e) {
    return fail(e);
  }
}
