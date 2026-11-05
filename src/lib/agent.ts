import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { adminClient } from "./supabase/server";
import type { Ctx } from "./session";
import { assertCanUseAgent } from "./billing";
import { agentTools, systemPrompt, withModel, type ModelChoice } from "./agentTools";
import { aiReady, attachToPost, waitForGeneration } from "./generations";
import { callTool } from "./api/mcp";
import { realOps } from "./api/ops";
import { ApiError, id as checkId } from "./api/input";
import type { ApiCtx } from "./api/types";

// The agent: Claude with every action of the REST API and the MCP server (agentTools.ts), run through the same Ops
// and checks as the person using it. It writes drafts unless asked to schedule, and asks before deleting. With
// FAL_KEY set it also makes pictures and videos for posts (fal.ai, generations.ts), within the plan's monthly limits.
const MODEL = "claude-opus-5-5";
// Making a week of posts with a picture each takes more rounds than writing text alone.
const MAX_TURNS = 20;

async function runTool(ctx: Ctx, name: string, input: Record<string, unknown>, models: ModelChoice): Promise<string> {
  const api: ApiCtx = { keyId: "agent", workspaceId: ctx.workspaceId, workspaceName: ctx.workspaceName, timezone: ctx.timezone, userId: ctx.userId, role: ctx.role as ApiCtx["role"], brandIds: ctx.brandIds };
  const ops = realOps(api);
  if (name === "attach_when_done") {
    const postId = checkId(input.post_id, "post_id");
    const ids = Array.isArray(input.generation_ids) ? input.generation_ids.map((g) => checkId(g, "generation_ids")) : [];
    if (!ids.length) throw new ApiError(400, "invalid_request", "generation_ids must list at least one id");
    const post = await ops.post(postId);
    if (post.status !== "draft" && post.status !== "review") throw new ApiError(409, "conflict", "Only drafts and posts in review take files later. Save it as a draft first.");
    for (const g of ids) await ops.generation(g);
    await attachToPost(ctx.workspaceId, ids, postId);
    return JSON.stringify({ post_id: postId, generation_ids: ids, note: "Each file is added to the post when it's done." });
  }
  const out = (await callTool(ops, name, name === "generate_media" ? withModel(input, models) : input)) as { generation?: { id: string; kind: string; status: string } };
  // A picture usually takes seconds: wait for it, so it can be attached right away.
  if (name === "generate_media" && out.generation && out.generation.kind === "image" && out.generation.status !== "done" && out.generation.status !== "failed") {
    await waitForGeneration(ctx.workspaceId, out.generation.id, 45000);
    return JSON.stringify({ generation: await ops.generation(out.generation.id) });
  }
  return JSON.stringify(out);
}

export type ChatMessage = { role: "user" | "assistant"; content: Anthropic.MessageParam["content"] };

/** Send one user message and run the agent until it answers. Every message is saved, append-only. */
export async function agentTurn(ctx: Ctx, chatId: string | null, text: string, models: ModelChoice): Promise<{ chatId: string }> {
  await assertCanUseAgent(ctx.workspaceId);
  const db = adminClient();
  let id = chatId;
  if (!id) {
    const { data, error } = await db.from("agent_chats").insert({ workspace_id: ctx.workspaceId, user_id: ctx.userId, title: text.slice(0, 60) }).select("id").single();
    if (error) throw new Error(error.message);
    id = data.id as string;
  } else {
    const { data } = await db.from("agent_chats").select("id").eq("id", id).eq("user_id", ctx.userId).maybeSingle();
    if (!data) throw new Error("Chat not found");
  }
  const { data: rows } = await db.from("agent_messages").select("role, content").eq("chat_id", id).order("id");
  const messages: Anthropic.MessageParam[] = (rows ?? []).map((r) => ({ role: r.role as "user" | "assistant", content: r.content }));
  const add = async (m: Anthropic.MessageParam) => {
    messages.push(m);
    const { error } = await db.from("agent_messages").insert({ chat_id: id, role: m.role, content: m.content });
    if (error) throw new Error(error.message);
  };
  await add({ role: "user", content: [{ type: "text", text }] });

  const client = new Anthropic();
  const ai = aiReady();
  const system = systemPrompt(ai, ctx.timezone, new Date(), models);
  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const res = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      system,
      tools: agentTools(ai),
      messages: messages as Anthropic.Beta.BetaMessageParam[],
      betas: ["server-side-fallback-2026-07-01"],
      // A request a safety check declines is re-run on Anthropic's recommended fallback model.
      ...({ fallbacks: "default" } as object),
    } as Anthropic.Beta.MessageCreateParamsNonStreaming);
    if (res.stop_reason === "refusal") {
      await add({ role: "assistant", content: [{ type: "text", text: "I can't help with that request." }] });
      break;
    }
    await add({ role: "assistant", content: res.content as Anthropic.MessageParam["content"] });
    if (res.stop_reason === "pause_turn") continue;
    const calls = res.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
    if (res.stop_reason !== "tool_use" || !calls.length) break;
    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const c of calls) {
      try {
        results.push({ type: "tool_result", tool_use_id: c.id, content: await runTool(ctx, c.name, c.input as Record<string, unknown>, models) });
      } catch (e) {
        results.push({ type: "tool_result", tool_use_id: c.id, content: e instanceof Error ? e.message : String(e), is_error: true });
      }
    }
    await add({ role: "user", content: results });
  }
  return { chatId: id };
}
