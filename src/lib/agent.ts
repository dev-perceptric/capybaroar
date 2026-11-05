import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { adminClient } from "./supabase/server";
import { listChannels } from "./channels";
import { postsBetween, savePost } from "./posts";
import { networkOf } from "./networks";
import type { Ctx } from "./session";
import { assertCanUseAgent } from "./billing";
import { listMedia } from "./media";
import { genRequest } from "./genRules";
import { MEDIA_RULES, SYSTEM, filesFor, toolsFor, type SavePostInput } from "./agentTools";
import { aiReady, attachToPost, generationsOf, startGeneration, waitForGeneration } from "./generations";

// The agent: Claude with tools over this workspace. It writes drafts unless asked to schedule. With FAL_KEY set it
// also makes pictures and videos for posts (fal.ai, generations.ts), within the plan's monthly limits.
const MODEL = "claude-opus-5-5";
// Making a week of posts with a picture each takes more rounds than writing text alone.
const MAX_TURNS = 20;

async function runTool(ctx: Ctx, name: string, input: Record<string, unknown>): Promise<string> {
  if (name === "list_channels") {
    const chans = await listChannels(ctx.workspaceId, ctx.brandIds);
    return JSON.stringify(chans.map((c) => ({ id: c.id, network: networkOf(c.network).name, name: c.name, status: c.status, limit: networkOf(c.network).limit, needs_media: !!networkOf(c.network).needsMedia })));
  }
  if (name === "list_posts") {
    const posts = await postsBetween(ctx.workspaceId, new Date(String(input.from)), new Date(String(input.to)), ctx.brandIds);
    return JSON.stringify(posts.map((p) => ({ id: p.id, status: p.status, publish_at: p.publish_at, text: p.text, channel_ids: p.post_targets.map((t) => t.channel_id) })));
  }
  if (name === "save_posts") {
    const out = [];
    for (const p of (input.posts as SavePostInput[]) ?? []) {
      try {
        // Files already done go in now; the rest are added to the draft when they're done.
        const { mediaIds, waiting, mode } = filesFor(p, await generationsOf(ctx.workspaceId, p.generation_ids ?? []));
        const r = await savePost(ctx.workspaceId, ctx.userId, { text: p.text, targets: p.channel_ids.map((channelId) => ({ channelId, text: null, settings: {} })), mediaIds, publishAt: new Date(p.publish_at).toISOString(), mode }, { role: ctx.role, brandIds: ctx.brandIds, brandId: null });
        if (waiting.length) await attachToPost(ctx.workspaceId, waiting, r.id);
        out.push({ ok: true, id: r.id, publish_at: p.publish_at, mode, status: r.status, media_ids: mediaIds, ...(waiting.length ? { waiting_for: waiting, note: "Saved as a draft. Its files are added when they're done; schedule it after that." } : {}) });
      } catch (e) {
        out.push({ ok: false, error: e instanceof Error ? e.message : String(e) });
      }
    }
    return JSON.stringify(out);
  }
  if (name === "list_media") {
    const files = await listMedia(ctx.workspaceId);
    return JSON.stringify(files.slice(0, 40).map((m) => ({ id: m.id, name: m.name, kind: m.mime.startsWith("video/") ? "video" : "image", alt: m.alt, added: m.created_at })));
  }
  if (name === "generate_media") {
    const g = await startGeneration(ctx.workspaceId, ctx.userId, genRequest(input));
    // A picture usually takes seconds: wait for it, so the agent can attach it right away.
    const now = g.kind === "image" && g.status !== "done" && g.status !== "failed" ? await waitForGeneration(ctx.workspaceId, g.id, 45000) : g;
    if (now.status === "failed") return JSON.stringify({ generation_id: now.id, status: "failed", error: now.error });
    if (now.status === "done") return JSON.stringify({ generation_id: now.id, status: "done", media_id: now.media_id });
    return JSON.stringify({ generation_id: now.id, status: "running", note: now.kind === "video" ? "A video takes a few minutes. Save its post as a draft with generation_ids." : "Still being made. Use generation_ids or check_media." });
  }
  if (name === "check_media") {
    const gens = await generationsOf(ctx.workspaceId, (input.generation_ids as string[]) ?? []);
    return JSON.stringify(gens.map((g) => ({ generation_id: g.id, kind: g.kind, status: g.status, media_id: g.media_id, error: g.error })));
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
  const ai = aiReady();
  const system = `${SYSTEM}${ai ? MEDIA_RULES : ""}\nWorkspace time zone: ${ctx.timezone}. Now: ${new Date().toISOString()}.`;
  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const res = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      system,
      tools: toolsFor(ai),
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
