import "server-only";
import { randomUUID } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { adminClient } from "./supabase/server";
import type { Ctx } from "./session";
import { assertCanUseAi } from "./billing";
import { hold, settle } from "./credits";
import { AGENT_HOLD, AGENT_MIN, claudeCredits } from "./creditRules";
import { ATTACHED, agentTools, systemPrompt, type CapyChoice } from "./agentTools";
import { modelOf } from "./genRules";
import { aiReady, attachToPost, waitForGeneration } from "./generations";
import { brandKits } from "./brands";
import { kitPrompt } from "./brandKit";
import { callTool } from "./api/mcp";
import { realOps } from "./api/ops";
import { ApiError, id as checkId } from "./api/input";
import type { ApiCtx } from "./api/types";

// The agent: Claude with every action of the REST API and the MCP server (agentTools.ts), run through the same Ops
// and checks as the person using it. It writes drafts unless asked to schedule, and asks before deleting. With
// FAL_KEY set it also makes pictures and videos for posts (fal.ai, generations.ts), within the plan's monthly limits.
// Credits: each message holds AGENT_HOLD when it starts and again each time it has used that much, and is charged
// what Claude really used (tokens times MARKUP, creditRules.ts) when it ends. When no more can be held, it finishes the
// step it's on, keeps what it saved, and stops. Files it makes are charged on their own (generations.ts).
const MODEL = "claude-opus-5-5";
// Making a week of posts with a picture each takes more rounds than writing text alone.
const MAX_TURNS = 20;

export const OUT_OF_CREDITS = "I stopped here because the credits ran out. What I saved is kept. Buy more in Settings, Billing.";

async function runTool(ctx: Ctx, brandId: string | null, name: string, input: Record<string, unknown>, model: string | null = null): Promise<string> {
  // The model picked in the chat box wins for files of its kind, whatever the agent asked for.
  if (name === "generate_media" && model && modelOf(model)?.kind === input.kind) input = { ...input, model };
  const api: ApiCtx = { keyId: "agent", workspaceId: ctx.workspaceId, workspaceName: ctx.workspaceName, timezone: ctx.timezone, userId: ctx.userId, role: ctx.role as ApiCtx["role"], brandIds: ctx.brandIds, spendBrand: brandId };
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
  const out = (await callTool(ops, name, input)) as { generation?: { id: string; kind: string; status: string } };
  // A picture usually takes seconds: wait for it, so it can be attached right away.
  if (name === "generate_media" && out.generation && out.generation.kind === "image" && out.generation.status !== "done" && out.generation.status !== "failed") {
    await waitForGeneration(ctx.workspaceId, out.generation.id, 45000);
    return JSON.stringify({ generation: await ops.generation(out.generation.id) });
  }
  return JSON.stringify(out);
}

export type ChatMessage = { role: "user" | "assistant"; content: Anthropic.MessageParam["content"] };

/** Send one user message and run the agent until it answers. Every message is saved, append-only. */
export async function agentTurn(ctx: Ctx, brandId: string | null, chatId: string | null, text: string, capy: CapyChoice = "auto", files: { id: string; name: string }[] = [], model: string | null = null): Promise<{ chatId: string }> {
  await assertCanUseAi(ctx.workspaceId);
  const sp = { workspaceId: ctx.workspaceId, userId: ctx.userId, brandId };
  const key = `agent:${randomUUID()}`;
  // The first hold takes what there is, up to AGENT_HOLD; less than one message's least is out of credits.
  let held = await hold(sp, key, AGENT_HOLD, { tool: "agent" }, { partial: true });
  if (held < AGENT_MIN) {
    await settle(ctx.workspaceId, key, 0).catch(() => undefined);
    throw new ApiError(402, "out_of_credits", "You're out of credits. Buy more in Settings, Billing.");
  }
  let used = 0;
  let seq = 1;
  try {
    return await converse(ctx, brandId, chatId, text, capy, files, model, {
      spent: (n) => void (used += n),
      // Before each round: hold more when this message has used what it holds. False when none is left.
      async room() {
        while (used >= held) {
          const more = await hold(sp, key, AGENT_HOLD, { tool: "agent" }, { partial: true, seq: seq++ }).catch(() => 0);
          if (more <= 0) return false;
          held += more;
        }
        return true;
      },
    });
  } finally {
    await settle(ctx.workspaceId, key, used > 0 ? Math.max(AGENT_MIN, used) : 0).catch((e) => console.error("agent credits:", e instanceof Error ? e.message : e));
  }
}

type Meter = { spent: (credits: number) => void; room: () => Promise<boolean> };

async function converse(ctx: Ctx, brandId: string | null, chatId: string | null, text: string, capy: CapyChoice, files: { id: string; name: string }[], model: string | null, meter: Meter): Promise<{ chatId: string }> {
  const db = adminClient();
  let id = chatId;
  if (!id) {
    const { data, error } = await db.from("agent_chats").insert({ workspace_id: ctx.workspaceId, user_id: ctx.userId, title: text.slice(0, 60) }).select("id").single();
    if (error) throw new Error(error.message);
    id = data.id as string;
  } else {
    const { data } = await db.from("agent_chats").select("id").eq("id", id).eq("user_id", ctx.userId).eq("workspace_id", ctx.workspaceId).maybeSingle();
    if (!data) throw new Error("Chat not found");
  }
  const { data: rows } = await db.from("agent_messages").select("role, content").eq("chat_id", id).order("id");
  const messages: Anthropic.MessageParam[] = (rows ?? []).map((r) => ({ role: r.role as "user" | "assistant", content: r.content }));
  const add = async (m: Anthropic.MessageParam) => {
    messages.push(m);
    const { error } = await db.from("agent_messages").insert({ chat_id: id, role: m.role, content: m.content });
    if (error) throw new Error(error.message);
  };
  // Files added with + ride along as a second text block, so the chat shows them as chips and the agent gets their ids.
  await add({ role: "user", content: [{ type: "text", text }, ...(files.length ? [{ type: "text" as const, text: `${ATTACHED}${files.map((f) => `${f.name} (media id ${f.id})`).join(", ")}` }] : [])] });

  const client = new Anthropic();
  const ai = aiReady();
  const all = await brandKits(ctx.workspaceId).catch(() => ({}) as Awaited<ReturnType<typeof brandKits>>);
  const kits = Object.entries(all)
    .filter(([id]) => !ctx.brandIds || ctx.brandIds.includes(id))
    .map(([, k]) => kitPrompt(k, k.name))
    .filter(Boolean)
    .join("\n");
  const system = systemPrompt(ai, ctx.timezone, new Date(), capy, kits, model);
  for (let turn = 0; turn < MAX_TURNS; turn++) {
    if (turn > 0 && !(await meter.room())) {
      await add({ role: "assistant", content: [{ type: "text", text: OUT_OF_CREDITS }] });
      break;
    }
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
    meter.spent(claudeCredits(res.usage));
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
        results.push({ type: "tool_result", tool_use_id: c.id, content: await runTool(ctx, brandId, c.name, c.input as Record<string, unknown>, model) });
      } catch (e) {
        results.push({ type: "tool_result", tool_use_id: c.id, content: e instanceof Error ? e.message : String(e), is_error: true });
      }
    }
    await add({ role: "user", content: results });
  }
  return { chatId: id };
}
