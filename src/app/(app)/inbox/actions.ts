"use server";

import { revalidatePath } from "next/cache";
import { getCtx } from "@/lib/session";
import { getThread, listThreads, replyTo, setHidden, setLiked, setThreadStatus, suggestReply, type Filters, type InboxStatus, type Thread, type ThreadRow } from "@/lib/inbox";

const fail = (e: unknown) => ({ error: e instanceof Error ? e.message : String(e) });

export async function loadThreads(f: Filters): Promise<{ error?: string; threads?: ThreadRow[] }> {
  const ctx = await getCtx();
  try {
    return { threads: await listThreads(ctx.workspaceId, f) };
  } catch (e) {
    return fail(e);
  }
}

export async function loadThread(channelId: string, threadId: string): Promise<{ error?: string; thread?: Thread }> {
  const ctx = await getCtx();
  try {
    return { thread: await getThread(ctx.workspaceId, channelId, threadId) };
  } catch (e) {
    return fail(e);
  }
}

export async function reply(itemId: string, text: string): Promise<{ error?: string }> {
  const ctx = await getCtx();
  try {
    await replyTo(ctx.workspaceId, ctx.userId, itemId, text);
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/inbox");
  return {};
}

export async function like(itemId: string, on: boolean): Promise<{ error?: string }> {
  const ctx = await getCtx();
  try {
    await setLiked(ctx.workspaceId, itemId, on);
    return {};
  } catch (e) {
    return fail(e);
  }
}

export async function hide(itemId: string, on: boolean): Promise<{ error?: string }> {
  const ctx = await getCtx();
  try {
    await setHidden(ctx.workspaceId, itemId, on);
    return {};
  } catch (e) {
    return fail(e);
  }
}

export async function mark(channelId: string, threadId: string, status: InboxStatus): Promise<{ error?: string }> {
  const ctx = await getCtx();
  try {
    await setThreadStatus(ctx.workspaceId, channelId, threadId, status);
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/inbox");
  return {};
}

export async function suggest(itemId: string): Promise<{ error?: string; text?: string }> {
  const ctx = await getCtx();
  if (!process.env.ANTHROPIC_API_KEY) return { error: "Suggestions aren't set up yet" };
  try {
    return { text: await suggestReply(ctx.workspaceId, itemId) };
  } catch (e) {
    return fail(e);
  }
}
