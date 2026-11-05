// The agent's instructions and tools, and how a post's files are picked. Pure, so tests check the tool schemas
// (strict tool use needs every property listed in required) and the file rules without Claude or Supabase.
import type Anthropic from "@anthropic-ai/sdk";
import { ASPECTS, SECONDS, modelsFor } from "./genRules";

export const SYSTEM = `You are the agent inside Capybaroar, a tool that schedules social media posts.
You help the user plan, write and schedule posts for their connected channels.
- Use list_channels to see which channels exist before writing posts. Only use channel ids it returns.
- Respect each channel's character limit. Write in the user's voice, plainly, without hashtags unless asked.
- Save posts as drafts unless the user clearly asks to schedule or publish them.
- Times are in the workspace time zone unless the user says otherwise. Send publish_at as ISO 8601 with the offset.
- Never invent facts, numbers, quotes or customer names. If you need one, ask.
- After saving, say briefly what you saved and when it goes out.`;

export const MEDIA_RULES = `
Pictures and videos:
- Some networks need a picture or video (needs_media in list_channels). Use one from list_media, or make one with generate_media when the user asks for it or the post needs one.
- Write generate_media prompts as a short scene: the subject, the setting, the light and the style, and for videos what moves and how the camera moves. No text or logos inside the picture unless the user asks.
- Pick the shape for where it goes: 9:16 for stories, reels, TikTok and Shorts; 1:1 for feeds; 16:9 for YouTube, X and LinkedIn link posts.
- A picture is usually ready when generate_media answers. A video takes a few minutes: save its post as a draft with generation_ids and the file is added to the draft when it's done. Don't schedule a post whose file isn't done.
- Each picture and each second of video counts against the plan's monthly limit, so make one per post unless the user asks for options.`;

export const tools: Anthropic.Tool[] = [
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

export const mediaTools: Anthropic.Tool[] = [
  {
    name: "list_media",
    description: "List the newest files in the media library with their id, name and kind (image or video).",
    strict: true,
    input_schema: { type: "object", properties: {}, required: [], additionalProperties: false },
  },
  {
    name: "generate_media",
    description: "Make a picture or a short video from a description. Answers with media_id when it's done (pictures, usually), or with generation_id while it's still being made (videos).",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["image", "video"] },
        prompt: { type: "string", description: "The scene to make" },
        model: {
          anyOf: [{ type: "string", enum: [...modelsFor("image"), ...modelsFor("video")].map((m) => m.id) }, { type: "null" }],
          description: `null for the default. Pictures: ${modelsFor("image").map((m) => `${m.id} (${m.name})`).join(", ")}. Videos: ${modelsFor("video").map((m) => `${m.id} (${m.name})`).join(", ")}.`,
        },
        aspect: { type: "string", enum: ASPECTS },
        seconds: { anyOf: [{ type: "integer", enum: [...SECONDS] }, { type: "null" }], description: "Videos only: 5 or 10. null for pictures." },
        source_media_id: { anyOf: [{ type: "string" }, { type: "null" }], description: "Videos only: a picture's id from list_media to start from. null otherwise." },
      },
      required: ["kind", "prompt", "model", "aspect", "seconds", "source_media_id"],
      additionalProperties: false,
    },
  },
  {
    name: "check_media",
    description: "Where pictures and videos from generate_media are: running, done (with media_id) or failed (with the error).",
    strict: true,
    input_schema: { type: "object", properties: { generation_ids: { type: "array", items: { type: "string" } } }, required: ["generation_ids"], additionalProperties: false },
  },
];

export type SavePostInput = { channel_ids: string[]; text: string; publish_at: string; mode: "draft" | "schedule"; media_ids?: string[]; generation_ids?: string[] };

/** The tools this workspace's agent has: the media ones only when AI media is set up. */
export const toolsFor = (ai: boolean): Anthropic.Tool[] => {
  if (!ai) return tools;
  const save = structuredClone(tools.find((t) => t.name === "save_posts")!);
  const item = (save.input_schema.properties as { posts: { items: { properties: Record<string, unknown>; required: string[] } } }).posts.items;
  item.properties.media_ids = { type: "array", items: { type: "string" }, description: "Files from list_media or generate_media, in order. [] for none." };
  item.properties.generation_ids = { type: "array", items: { type: "string" }, description: "generate_media requests still being made; their files are added when done (drafts only). [] for none." };
  item.required = [...item.required, "media_ids", "generation_ids"];
  save.description = `${save.description} media_ids attach files now; generation_ids attach files still being made, so those posts are saved as drafts.`;
  return [...tools.filter((t) => t.name !== "save_posts"), save, ...mediaTools];
};

type Gen = { id: string; status: string; media_id: string | null; error: string | null };

/**
 * A post's files: media_ids plus the generations already done go in now; generations still being made are added to
 * the draft later, so a post waiting for one is saved as a draft. Throws for a failed or unknown generation.
 */
export function filesFor(p: Pick<SavePostInput, "media_ids" | "generation_ids" | "mode">, gens: Gen[]): { mediaIds: string[]; waiting: string[]; mode: "draft" | "schedule" } {
  const asked = [...new Set(p.generation_ids ?? [])];
  const byId = new Map(gens.map((g) => [g.id, g]));
  const unknown = asked.find((id) => !byId.has(id));
  if (unknown) throw new Error(`Generation ${unknown} isn't one of this workspace's`);
  const failed = asked.map((id) => byId.get(id)!).find((g) => g.status === "failed");
  if (failed) throw new Error(`A file failed: ${failed.error ?? "try again"}`);
  const ready = asked.map((id) => byId.get(id)!).filter((g) => g.status === "done" && g.media_id).map((g) => g.media_id!);
  const waiting = asked.filter((id) => byId.get(id)!.status !== "done");
  return { mediaIds: [...new Set([...(p.media_ids ?? []), ...ready])], waiting, mode: waiting.length ? "draft" : p.mode };
}
