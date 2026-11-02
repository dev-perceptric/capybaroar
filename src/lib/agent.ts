import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { adminClient } from "./supabase/server";
import { listChannels } from "./channels";
import { postsBetween, savePost } from "./posts";
import { networkOf } from "./networks";
import type { Ctx } from "./session";
import { assertCanUseAgent } from "./billing";

// The agent: Claude with three tools over this workspace. It writes drafts unless asked to schedule.
const MODEL = "claude-opus-5-5";
const MAX_TURNS = 8;

const SYSTEM = `You are the agent inside Capybaroar, a tool that schedules social media posts.
You help the user plan, write and schedule posts for their connected channels.
- Use list_channels to see which channels exist before writing posts. Only use channel ids it returns.
- Respect each channel's character limit. Write in the user's voice, plainly, without hashtags unless asked.
- Save posts as drafts unless the user clearly asks to schedule or publish them.
- Times are in the workspace time zone unless the user says otherwise. Send publish_at as ISO 8601 with the offset.
- Never invent facts, numbers, quotes or customer names. If you need one, ask.
- After saving, say briefly what you saved and when it goes out.`;

const tools: Anthropic.Tool[] = [
  {
    name: "list_channels",
    description: "List the workspace's connected channels with their id, network, name and character limit.",
    strict: true,
    input_schema: { type: "object", properties: {}, required: [], additionalProperties: false },
  },
  {
    name: "list_posts",
    description: "List posts with a publish time between two ISO 8601 times.",
    strict: true,
    input_schema: {
      type: "object",
      properties: { from: { type: "string", description: "ISO 8601 start" }, to: { type: "string", description: "ISO 8601 end" } },
      required: ["from", "to"],
      additionalProperties: false,
    },
  },
  {
    name: "save_posts",
    description: "Save one or more posts. mode 'draft' keeps them as drafts on the calendar; mode 'schedule' queues them to publish at publish_at.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        posts: {
          type: "array",
          items: {
            type: "object",
            properties: {
              channel_ids: { type: "array", items: { type: "string" } },
              text: { type: "string" },
              publish_at: { type: "string", description: "ISO 8601 with offset" },
              mode: { type: "string", enum: ["draft", "schedule"] },
            },
            required: ["channel_ids", "text", "publish_at", "mode"],
            additionalProperties: false,
          },
        },
      },
      required: ["posts"],
      additionalProperties: false,
    },
  },
];

async function runTool(ctx: Ctx, name: string, input: Record<string, unknown>): Promise<string> {
  if (name === "list_channels") {
    const chans = await listChannels(ctx.workspaceId, ctx.brandIds);
    return JSON.stringify(chans.map((c) => ({ id: c.id, network: networkOf(c.network).name, name: c.name, status: c.status, limit: networkOf(c.network).limit })));
  }
  if (name === "list_posts") {
    const posts = await postsBetween(ctx.workspaceId, new Date(String(input.from)), new Date(String(input.to)), ctx.brandIds);
    return JSON.stringify(posts.map((p) => ({ id: p.id, status: p.status, publish_at: p.publish_at, text: p.text, channel_ids: p.post_targets.map((t) => t.channel_id) })));
  }
  if (name === "save_posts") {
    const out = [];
    for (const p of (input.posts as { channel_ids: string[]; text: string; publish_at: string; mode: "draft" | "schedule" }[]) ?? []) {
      try {
        const r = await savePost(ctx.workspaceId, ctx.userId, { text: p.text, targets: p.channel_ids.map((channelId) => ({ channelId, text: null, settings: {} })), mediaIds: [], publishAt: new Date(p.publish_at).toISOString(), mode: p.mode }, { role: ctx.role, brandIds: ctx.brandIds, brandId: null });
        out.push({ ok: true, id: r.id, publish_at: p.publish_at, mode: p.mode, status: r.status });
      } catch (e) {
        out.push({ ok: false, error: e instanceof Error ? e.message : String(e) });
      }
    }
    return JSON.stringify(out);
  }
  throw new Error(`Unknown tool ${name}`);
}

export type ChatMessage = { role: "user" | "assistant"; content: Anthropic.MessageParam["content"] };

/** Send one user message and run the agent until it answers. Every message is saved, append-only. */
export async function agentTurn(ctx: Ctx, chatId: string | null, text: string): Promise<{ chatId: string }> {
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
  const system = `${SYSTEM}\nWorkspace time zone: ${ctx.timezone}. Now: ${new Date().toISOString()}.`;
  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const res = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      system,
      tools,
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
        results.push({ type: "tool_result", tool_use_id: c.id, content: await runTool(ctx, c.name, c.input as Record<string, unknown>) });
      } catch (e) {
        results.push({ type: "tool_result", tool_use_id: c.id, content: e instanceof Error ? e.message : String(e), is_error: true });
      }
    }
    await add({ role: "user", content: results });
  }
  return { chatId: id };
}
