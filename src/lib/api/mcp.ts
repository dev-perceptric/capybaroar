// The MCP server: JSON-RPC over plain HTTP POST (MCP's Streamable HTTP, without sessions or streams). Every request is
// answered on its own, so any server can take it and a restart loses nothing. Pure: it runs the tools through Ops,
// so tests drive it with fake actions.
import { ApiError, MAX_BATCH, days, deleteArgs, id, mediaLink, optionalId, postFields, range, webhookInput } from "./input";
import { EVENTS } from "./hookRules";
import type { Ops } from "./types";

export const SERVER = { name: "capybaroar", title: "Capybaroar", version: "1.0.0" };
// Newest first. A client asking for one of these gets it back; any other gets the newest.
export const VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];

type Json = Record<string, unknown>;
type Tool = { name: string; title: string; description: string; inputSchema: Json; annotations: Json };

const POST_PROPS: Json = {
  channel_ids: { type: "array", items: { type: "string" }, description: "Channel ids from list_channels. One post can only use channels from one brand." },
  text: { type: "string", description: "The post text, shared by every channel. Keep it within each channel's character_limit." },
  publish_at: { type: "string", description: "When it goes out, ISO 8601 with an offset, like 2026-11-05T09:00:00-05:00. Needed for draft and schedule." },
  mode: {
    type: "string",
    enum: ["draft", "schedule", "now", "queue"],
    description: "draft (the default) puts it on the calendar without sending; schedule sends it at publish_at; now sends it right away; queue takes the next free time slot of the workspace's queue.",
  },
  media_ids: { type: "array", items: { type: "string" }, description: "File ids from list_media, in order." },
  channel_text: { type: "object", additionalProperties: { type: "string" }, description: "Own text for some channels, by channel id. Other channels use text." },
  settings: {
    type: "object",
    additionalProperties: { type: "object", additionalProperties: { type: "string" } },
    description: 'Network settings by channel id, like {"<channel id>": {"first_comment": "..."}}. list_channels lists each channel\'s settings and which are required.',
  },
};

const read = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
const write = { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true };

export const TOOLS: Tool[] = [
  { name: "list_brands", title: "List brands", description: "The brands (clients) in this workspace. Channels and posts belong to one brand.", inputSchema: { type: "object", properties: {} }, annotations: read },
  {
    name: "list_channels",
    title: "List channels",
    description: "Connected social channels with their id, network, character limit and the settings each network takes. Call this before writing posts.",
    inputSchema: { type: "object", properties: { brand_id: { type: "string", description: "Only this brand's channels" } } },
    annotations: read,
  },
  {
    name: "list_posts",
    title: "List posts",
    description: "Posts with a publish time in a range (up to 92 days). Without from and to: the next 30 days.",
    inputSchema: {
      type: "object",
      properties: { from: { type: "string", description: "ISO 8601 start, with offset" }, to: { type: "string", description: "ISO 8601 end, with offset" }, brand_id: { type: "string", description: "Only this brand's posts" } },
    },
    annotations: read,
  },
  { name: "get_post", title: "Get a post", description: "One post with its status on each channel and links to what went out.", inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] }, annotations: read },
  {
    name: "create_posts",
    title: "Create posts",
    description: `Create up to ${MAX_BATCH} posts. Each one is checked on its own: one bad post doesn't stop the rest. Posts are drafts unless mode says otherwise. A brand that needs approval keeps an editor's posts in review.`,
    inputSchema: {
      type: "object",
      properties: { posts: { type: "array", maxItems: MAX_BATCH, items: { type: "object", properties: POST_PROPS, required: ["channel_ids", "text"] } } },
      required: ["posts"],
    },
    annotations: write,
  },
  {
    name: "update_post",
    title: "Change a post",
    description: "Change a post that hasn't gone out. Send only the fields to change. Without mode, a draft stays a draft and a scheduled post is scheduled again.",
    inputSchema: { type: "object", properties: { id: { type: "string" }, ...POST_PROPS }, required: ["id"] },
    annotations: write,
  },
  {
    name: "delete_post",
    title: "Delete a post",
    description:
      "Delete a post. Without everywhere it's removed from Capybaroar only, and a post that already went out stays on the networks. With everywhere: true it's deleted on the networks too and the record stays as deleted; the answer lists each channel's result (deleted, failed with the error, or manual with the link where it must be deleted by hand, like Instagram and TikTok). Ask the user before deleting everywhere.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        everywhere: { type: "boolean", description: "Also delete it on the networks it went out on. Default false." },
        channel_ids: { type: "array", items: { type: "string" }, description: "With everywhere: only these channels. Default: every channel it went out on." },
      },
      required: ["id"],
    },
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true },
  },
  { name: "list_media", title: "List media", description: "The newest files in the media library, with ids to attach to posts.", inputSchema: { type: "object", properties: {} }, annotations: read },
  {
    name: "upload_media",
    title: "Upload media from a link",
    description: "Download a picture or video (JPG, PNG, GIF, WebP, MP4 or MOV, up to 250 MB) from a public link into the media library. Returns its id for media_ids.",
    inputSchema: { type: "object", properties: { url: { type: "string", description: "A public http or https link to the file" }, alt: { type: "string", description: "Alt text for people who can't see it" } }, required: ["url"] },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  },
  { name: "next_queue_slot", title: "Next queue slot", description: "The next free time slot in the workspace's posting queue.", inputSchema: { type: "object", properties: {} }, annotations: read },
  {
    name: "get_analytics",
    title: "Get analytics",
    description: "Reach and engagement for a period against the one before, the best times to post, results by format and the top posts.",
    inputSchema: { type: "object", properties: { days: { type: "number", enum: [7, 30, 90], description: "7, 30 (default) or 90" }, channel_id: { type: "string", description: "Only this channel" } } },
    annotations: read,
  },
  { name: "list_webhooks", title: "List webhooks", description: "The workspace's webhooks with their events and how the last delivery went. Owners and admins only.", inputSchema: { type: "object", properties: {} }, annotations: read },
  {
    name: "create_webhook",
    title: "Add a webhook",
    description: `Have Capybaroar POST to an https URL when these events happen: ${EVENTS.join(", ")}. Returns a signing secret, shown once. Owners and admins only.`,
    inputSchema: { type: "object", properties: { url: { type: "string", description: "An https URL" }, events: { type: "array", items: { type: "string", enum: [...EVENTS] } } }, required: ["url", "events"] },
    annotations: write,
  },
  {
    name: "set_webhook",
    title: "Turn a webhook on or off",
    description: "Turn a webhook on or off. Turning it on again starts its failure count over.",
    inputSchema: { type: "object", properties: { id: { type: "string" }, enabled: { type: "boolean" } }, required: ["id", "enabled"] },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  { name: "test_webhook", title: "Test a webhook", description: "Send a ping event to a webhook now, to check its URL answers.", inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] }, annotations: write },
  {
    name: "delete_webhook",
    title: "Delete a webhook",
    description: "Delete a webhook. Nothing more is sent to its URL.",
    inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
  },
];

export function instructions(timezone: string) {
  return [
    "Capybaroar schedules posts to social channels from one calendar.",
    "Call list_channels first and only use the channel ids it returns. Respect each channel's character_limit and required settings.",
    "Save posts as drafts unless the user clearly asks to schedule or publish them.",
    `Send times as ISO 8601 with an offset. The workspace time zone is ${timezone}.`,
    "Never invent facts, numbers, quotes or customer names.",
  ].join("\n");
}

const err = (code: number, message: string) => ({ code, message });
const reply = (msgId: unknown, body: { result: unknown } | { error: { code: number; message: string } }) => ({ jsonrpc: "2.0", id: msgId, ...body });

/** Runs one tool. Errors in what the caller sent come back as a tool error the model can read and fix. */
export async function callTool(ops: Ops, name: string, args: Json): Promise<unknown> {
  switch (name) {
    case "list_brands":
      return { brands: await ops.brands() };
    case "list_channels":
      return { channels: await ops.channels(optionalId(args.brand_id, "brand_id")) };
    case "list_posts": {
      const r = range(args.from, args.to);
      return { posts: await ops.posts(r.from, r.to, optionalId(args.brand_id, "brand_id")) };
    }
    case "get_post":
      return { post: await ops.post(id(args.id)) };
    case "create_posts": {
      const list = args.posts;
      if (!Array.isArray(list) || !list.length) throw new ApiError(400, "invalid_request", "posts must be a list with at least one post");
      if (list.length > MAX_BATCH) throw new ApiError(400, "invalid_request", `Send up to ${MAX_BATCH} posts at a time`);
      const results = [];
      for (const p of list) {
        try {
          const f = postFields(p, false);
          results.push({ ok: true, post: await ops.create(f as Parameters<Ops["create"]>[0]) });
        } catch (e) {
          results.push({ ok: false, error: e instanceof Error ? e.message : String(e) });
        }
      }
      return { results };
    }
    case "update_post": {
      const { id: postId, ...rest } = args;
      return { post: await ops.update(id(postId), postFields(rest, true)) };
    }
    case "delete_post": {
      const postId = id(args.id);
      const d = deleteArgs(args.everywhere, args.channel_ids);
      if (d.everywhere) return await ops.unpublish(postId, d.channelIds);
      await ops.remove(postId);
      return { deleted: true };
    }
    case "list_media":
      return { media: await ops.media() };
    case "upload_media": {
      const m = mediaLink(args);
      return { media: await ops.uploadFromLink(m.url, m.alt) };
    }
    case "list_webhooks":
      return { webhooks: await ops.webhooks() };
    case "create_webhook": {
      const w = webhookInput(args, EVENTS);
      return await ops.createWebhook(w.url, w.events);
    }
    case "set_webhook":
      if (typeof args.enabled !== "boolean") throw new ApiError(400, "invalid_request", "enabled must be true or false");
      return { webhook: await ops.setWebhook(id(args.id), args.enabled) };
    case "test_webhook":
      await ops.testWebhook(id(args.id));
      return { sent: true };
    case "delete_webhook":
      await ops.deleteWebhook(id(args.id));
      return { deleted: true };
    case "next_queue_slot":
      return { publish_at: await ops.nextSlot() };
    case "get_analytics":
      return { analytics: await ops.analytics(days(args.days), optionalId(args.channel_id, "channel_id")) };
    default:
      throw new ApiError(404, "unknown_tool", `Unknown tool ${name}`);
  }
}

async function one(msg: unknown, ops: Ops, timezone: string): Promise<unknown | null> {
  if (typeof msg !== "object" || msg === null || Array.isArray(msg)) return reply(null, { error: err(-32600, "Invalid request") });
  const m = msg as Json;
  const isRequest = "id" in m && m.id !== null && m.id !== undefined;
  // Answers and notifications from the client (initialized, cancelled) need no reply.
  if (!isRequest) return null;
  if (m.jsonrpc !== "2.0" || typeof m.method !== "string") return reply(m.id, { error: err(-32600, "Invalid request") });
  const params = (typeof m.params === "object" && m.params !== null ? m.params : {}) as Json;
  switch (m.method) {
    case "initialize": {
      const asked = typeof params.protocolVersion === "string" ? params.protocolVersion : "";
      return reply(m.id, {
        result: {
          protocolVersion: VERSIONS.includes(asked) ? asked : VERSIONS[0],
          capabilities: { tools: { listChanged: false } },
          serverInfo: SERVER,
          instructions: instructions(timezone),
        },
      });
    }
    case "ping":
      return reply(m.id, { result: {} });
    case "tools/list":
      return reply(m.id, { result: { tools: TOOLS } });
    case "tools/call": {
      const name = params.name;
      if (typeof name !== "string" || !TOOLS.some((t) => t.name === name)) return reply(m.id, { error: err(-32602, `Unknown tool ${String(name)}`) });
      const args = (typeof params.arguments === "object" && params.arguments !== null && !Array.isArray(params.arguments) ? params.arguments : {}) as Json;
      try {
        const out = await callTool(ops, name, args);
        return reply(m.id, { result: { content: [{ type: "text", text: JSON.stringify(out) }], isError: false } });
      } catch (e) {
        const text = e instanceof Error ? e.message : String(e);
        return reply(m.id, { result: { content: [{ type: "text", text }], isError: true } });
      }
    }
    case "resources/list":
      return reply(m.id, { result: { resources: [] } });
    case "prompts/list":
      return reply(m.id, { result: { prompts: [] } });
    default:
      return reply(m.id, { error: err(-32601, `Method not found: ${m.method}`) });
  }
}

/** One POST body: a message or a batch. null means "accepted, nothing to send back" (HTTP 202). */
export async function handleMcp(body: unknown, ops: Ops, timezone: string): Promise<unknown | null> {
  if (Array.isArray(body)) {
    if (!body.length) return reply(null, { error: err(-32600, "Invalid request") });
    const out = [];
    for (const m of body) {
      const r = await one(m, ops, timezone);
      if (r) out.push(r);
    }
    return out.length ? out : null;
  }
  return one(body, ops, timezone);
}

export const parseError = () => reply(null, { error: err(-32700, "Parse error") });
