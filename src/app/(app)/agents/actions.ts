"use server";

import { getCtx } from "@/lib/session";
import { agentTurn } from "@/lib/agent";

export async function send(chatId: string | null, text: string): Promise<{ chatId?: string; error?: string }> {
  const ctx = await getCtx();
  if (ctx.role === "client") return { error: "Clients can only approve or reject posts" };
  if (!text.trim()) return { error: "Write a message" };
  if (!process.env.ANTHROPIC_API_KEY) return { error: "The agent isn't set up yet" };
  try {
    return await agentTurn(ctx, chatId, text.trim());
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}
