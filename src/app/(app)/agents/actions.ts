"use server";

import { getCtx } from "@/lib/session";
import { agentTurn } from "@/lib/agent";
import { capyChoice } from "@/lib/agentTools";
import { adminClient } from "@/lib/supabase/server";

export async function send(chatId: string | null, text: string, capy?: unknown, mediaIds?: string[]): Promise<{ chatId?: string; error?: string }> {
  const ctx = await getCtx();
  if (ctx.role === "client") return { error: "Clients can only approve or reject posts" };
  if (!text.trim()) return { error: "Write a message" };
  if (!process.env.ANTHROPIC_API_KEY) return { error: "The agent isn't set up yet" };
  try {
    // Files added with + must be this workspace's.
    const ids = [...new Set((Array.isArray(mediaIds) ? mediaIds : []).filter((x) => typeof x === "string"))].slice(0, 10);
    let files: { id: string; name: string }[] = [];
    if (ids.length) {
      const { data, error } = await adminClient().from("media").select("id, name").eq("workspace_id", ctx.workspaceId).in("id", ids);
      if (error) throw new Error(error.message);
      files = (data ?? []).map((m) => ({ id: m.id as string, name: m.name as string }));
    }
    return await agentTurn(ctx, chatId, text.trim(), capyChoice(capy), files);
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

/** This person's chats in this workspace, newest first. */
export async function recentChats(): Promise<{ id: string; title: string }[]> {
  const ctx = await getCtx();
  if (ctx.role === "client") return [];
  const { data } = await adminClient().from("agent_chats").select("id, title").eq("user_id", ctx.userId).eq("workspace_id", ctx.workspaceId).order("created_at", { ascending: false }).limit(50);
  return (data ?? []) as { id: string; title: string }[];
}

/** Deletes one of this person's chats and its messages. */
export async function deleteChat(id: string): Promise<{ error?: string }> {
  const ctx = await getCtx();
  const { error } = await adminClient().from("agent_chats").delete().eq("id", id).eq("user_id", ctx.userId).eq("workspace_id", ctx.workspaceId);
  return error ? { error: error.message } : {};
}
