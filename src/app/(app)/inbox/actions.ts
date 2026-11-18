"use server";

import { writerCtx } from "@/lib/session";
import { getBrandCtx } from "@/lib/brands";
import { channelsIn, itemChannel, getThread, listThreads, openCount, replyTo, setHidden, setLiked, setThreadStatus, suggestReply, type Filters, type InboxStatus, type Thread, type ThreadRow } from "@/lib/inbox";

/** Team members only, and only the channels of the brands they may see. */
async function allowed(check?: { channelId?: string; itemId?: string }) {
  await writerCtx();
  const ctx = await getBrandCtx();
  const ids = await channelsIn(ctx.workspaceId, ctx.scope);
  const ch = check?.itemId ? await itemChannel(ctx.workspaceId, check.itemId) : check?.channelId;
  if (check && (!ch || (ids && !ids.includes(ch)))) throw new Error("Not found");
  return { ...ctx, channelIds: ids };
}

const fail = (e: unknown) => ({ error: e instanceof Error ? e.message : String(e) });

// Done and reply don't re-render the inbox page: the screen already updates its own list, and re-rendering read up to
// 400 threads again only to be ignored. They answer with the sidebar's new open count instead (inboxCount, Sidebar).
const openNow = (ctx: { workspaceId: string; scope: string[] | null }) => openCount(ctx.workspaceId, ctx.scope).catch(() => undefined);

export async function loadThreads(f: Filters): Promise<{ error?: string; threads?: ThreadRow[] }> {
  try {
    const ctx = await allowed();
    return { threads: await listThreads(ctx.workspaceId, { ...f, channelIds: ctx.channelIds }) };
  } catch (e) {
    return fail(e);
  }
}

export async function loadThread(channelId: string, threadId: string): Promise<{ error?: string; thread?: Thread }> {
  try {
    const ctx = await allowed({ channelId });
    return { thread: await getThread(ctx.workspaceId, channelId, threadId) };
  } catch (e) {
    return fail(e);
  }
}

export async function reply(itemId: string, text: string): Promise<{ error?: string; open?: number }> {
  try {
    const ctx = await allowed({ itemId });
    await replyTo(ctx.workspaceId, ctx.userId, itemId, text);
    return { open: await openNow(ctx) };
  } catch (e) {
    return fail(e);
  }
}

export async function like(itemId: string, on: boolean): Promise<{ error?: string }> {
  try {
    const ctx = await allowed({ itemId });
    await setLiked(ctx.workspaceId, itemId, on);
    return {};
  } catch (e) {
    return fail(e);
  }
}

export async function hide(itemId: string, on: boolean): Promise<{ error?: string }> {
  try {
    const ctx = await allowed({ itemId });
    await setHidden(ctx.workspaceId, itemId, on);
    return {};
  } catch (e) {
    return fail(e);
  }
}

export async function mark(channelId: string, threadId: string, status: InboxStatus): Promise<{ error?: string; open?: number }> {
  try {
    const ctx = await allowed({ channelId });
    await setThreadStatus(ctx.workspaceId, channelId, threadId, status);
    return { open: await openNow(ctx) };
  } catch (e) {
    return fail(e);
  }
}

export async function suggest(itemId: string): Promise<{ error?: string; text?: string }> {
  if (!process.env.ANTHROPIC_API_KEY) return { error: "Suggestions aren't set up yet" };
  try {
    const ctx = await allowed({ itemId });
    return { text: await suggestReply(ctx.workspaceId, ctx.userId, itemId) };
  } catch (e) {
    return fail(e);
  }
}
