// The agent's instructions and tools. The agent has every action the REST API and the MCP server have (TOOLS in
// api/mcp.ts, run through the same Ops), so whatever people can do through them, the agent can do too, with the
// same checks. Pure, so tests check the tool list without Claude or Supabase.
import type Anthropic from "@anthropic-ai/sdk";
import { TOOLS, instructions } from "./api/mcp";

export const RULES = `You are the agent inside Capybaroar, a tool that schedules social media posts. You run this workspace for the user: plan, write, schedule, change and delete posts, manage the media library, make pictures and videos, read analytics and the posting queue, and manage webhooks.
- Use list_channels before writing posts. Only use ids that tools return.
- Respect each channel's character_limit and required settings. Write in the user's voice, plainly, without hashtags unless asked.
- Save posts as drafts unless the user clearly asks to schedule or publish them.
- Before anything that can't be undone or that people outside will see (delete_post, delete everywhere, delete_webhook, mode now), say what you'll do and wait for the user to say yes in the chat.
- After you act, say briefly what changed and when posts go out.`;

export const MEDIA_RULES = `
Pictures and videos:
- Some networks need a picture or video (needs_media in list_channels). Use one from list_media, or make one with generate_media when the user asks for it or the post needs one.
- Write generate_media prompts as a short scene: the subject, the setting, the light and the style, and for videos what moves and how the camera moves. No text or logos inside the picture unless the user asks.
- Pick the shape for where it goes: 9:16 for stories, reels, TikTok and Shorts; 1:1 for feeds; 16:9 for YouTube, X and LinkedIn link posts.
- A picture is usually done when generate_media answers: attach its media id with media_ids. A video takes a few minutes: save its post as a draft, then call attach_when_done with the post id and the generation id, and the video is added to the draft when it's done. Don't schedule a post whose file isn't done.
- Each picture and each second of video counts against the plan's monthly limit, so make one per post unless the user asks for options.`;

export function systemPrompt(ai: boolean, timezone: string, now: Date) {
  return `${RULES}\n${instructions(timezone)}${ai ? MEDIA_RULES : ""}\nNow: ${now.toISOString()}.`;
}

const MEDIA_ONLY = ["generate_media", "get_generation"];

/** Agent-only: a draft saved before its video is done gets the file when it's done (attach_generation in 022). */
export const ATTACH_TOOL: Anthropic.Tool = {
  name: "attach_when_done",
  description: "Add the files of generate_media requests to a draft or a post in review as soon as each one is done (right away for those already done). Use it for videos, which take a few minutes.",
  input_schema: {
    type: "object",
    properties: { post_id: { type: "string" }, generation_ids: { type: "array", items: { type: "string" }, minItems: 1 } },
    required: ["post_id", "generation_ids"],
  },
};

/** Every API and MCP action as an agent tool; the media ones only when AI media is set up. */
export function agentTools(ai: boolean): Anthropic.Tool[] {
  const shared = TOOLS.filter((t) => ai || !MEDIA_ONLY.includes(t.name)).map((t) => ({ name: t.name, description: t.description, input_schema: t.inputSchema as Anthropic.Tool["input_schema"] }));
  return ai ? [...shared, ATTACH_TOOL] : shared;
}

/** The short line the chat shows for an action, or null for reads. */
export function actionLabel(name: string, input: Record<string, unknown> | undefined): string | null {
  const n = Array.isArray(input?.posts) ? input.posts.length : 0;
  switch (name) {
    case "create_posts":
    case "save_posts": // chats from before the agent had every action
      return `Saved ${n} post${n === 1 ? "" : "s"}`;
    case "update_post":
      return "Changed a post";
    case "delete_post":
      return input?.everywhere ? "Deleted a post everywhere" : "Deleted a post";
    case "upload_media":
      return "Added a file";
    case "attach_when_done":
      return "Will attach when done";
    case "create_webhook":
      return "Added a webhook";
    case "set_webhook":
      return input?.enabled ? "Turned a webhook on" : "Turned a webhook off";
    case "delete_webhook":
      return "Deleted a webhook";
    case "test_webhook":
      return "Tested a webhook";
    default:
      return null;
  }
}
