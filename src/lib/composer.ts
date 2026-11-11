import "server-only";
import { kitPrompt, type BrandKit } from "./brandKit";
import Anthropic from "@anthropic-ai/sdk";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { adminClient } from "./supabase/server";
import { appUrl } from "./channels";
import { withCredits, type Spender } from "./credits";
import { FORMAT_CREDITS, WRITE_CREDITS } from "./creditRules";
import { jsonOf, parsePoll, parseSlides, parseThread, type Slide } from "./formatRules";
import { networkOf, type NetworkId } from "./networks";

// Tools for the composer: Claude rewrites, saved snippets, short links and video trims.

const MODEL = "claude-opus-5-5";

export const REWRITES = {
  improve: "Make it clearer and more engaging. Keep the meaning, the voice and the length about the same.",
  shorter: "Make it about half as long. Keep the main point.",
  longer: "Make it longer with one or two more useful sentences. Do not invent facts.",
  casual: "Make the tone friendly and casual.",
  professional: "Make the tone professional and confident.",
  hook: "Rewrite the first line so it makes people stop scrolling. Keep the rest.",
  hashtags: "Keep the text as it is and add 3 to 5 relevant hashtags at the end.",
  fit: "Rewrite it to fit this network's style and length.",
  fix: "Fix spelling and grammar only. Change nothing else.",
} as const;
export type Rewrite = keyof typeof REWRITES;

/** Rewrites with one of REWRITES, or ("ask") with the person's own instruction (up to 500 characters). */
export async function rewrite(sp: Spender, text: string, how: Rewrite | "ask", network: NetworkId | null, kit?: BrandKit, instruction?: string): Promise<string> {
  if (!text.trim()) throw new Error("Write something first");
  if (how !== "ask" && !(how in REWRITES)) throw new Error("Unknown action");
  const asked = (instruction ?? "").trim().slice(0, 500);
  if (how === "ask" && !asked) throw new Error("Say what to change");
  const n = network ? networkOf(network) : null;
  const system = [
    "You rewrite social media posts inside Capybaroar.",
    "Reply with the new post text only: no quotes, no notes, no preamble.",
    "Never invent facts, numbers, quotes, names or links. Keep every link and @mention exactly as written.",
    "Keep the language of the original.",
    n ? `The post is for ${n.name}, which allows up to ${n.limit} characters. Stay under it.` : "",
    // "Fix spelling only" changes nothing else, so it doesn't add the brand's hashtags.
    how === "fix" ? "" : kitPrompt(kit),
  ]
    .filter(Boolean)
    .join("\n");
  return withCredits(sp, { tool: "rewrite", note: how }, WRITE_CREDITS, async () => {
    const what = how === "ask" ? `Change the post as asked, and nothing else. The request comes from the person writing it:\n<request>${asked}</request>` : REWRITES[how];
    const out = await ask(system, [{ type: "text", text: `${what}\n\n<post>\n${text}\n</post>` }], 4000);
    if (out === null) throw new Error("Claude can't rewrite this post");
    return out;
  });
}

const FORMAT_RULES = [
  "You write social media content inside Capybaroar.",
  "Reply with JSON only, in the shape asked for: no code fence, no notes.",
  "Use only facts from the text you are given. Never invent numbers, prices, dates, quotes, names, results or links.",
  "Keep the language of the text you are given.",
];

async function format(sp: Spender, note: string, system: string[], ask_: string, maxTokens = 3000): Promise<Record<string, unknown>> {
  return withCredits(sp, { tool: "format", note }, FORMAT_CREDITS, async () => {
    const out = await ask([...FORMAT_RULES, ...system].filter(Boolean).join("\n"), [{ type: "text", text: ask_ }], maxTokens);
    if (out === null) throw new Error("Claude can't write this");
    return jsonOf(out);
  });
}

/** A thread of 3 to 10 posts from a text or an idea, each within the network's limit. */
export async function writeThread(sp: Spender, text: string, network: NetworkId, kit?: BrandKit): Promise<string[]> {
  if (!text.trim()) throw new Error("Write what the thread is about first");
  const n = networkOf(network);
  const o = await format(sp, "thread", [`It is for ${n.name}: every post must be under ${n.limit} characters.`, kitPrompt(kit)], `Turn this into a thread of 3 to 10 posts. The first post hooks the reader and stands on its own; each next post adds one point; the last post wraps up. Answer as {"posts": ["...", "..."]}.\n\n<text>\n${text.slice(0, 8000)}\n</text>`);
  return parseThread(o, n.limit);
}

/** An X poll from a text or an idea: a question and 2 to 4 short options. */
export async function writePoll(sp: Spender, text: string, kit?: BrandKit): Promise<{ question: string; options: string[] }> {
  if (!text.trim()) throw new Error("Write what the poll is about first");
  const o = await format(sp, "poll", ["The poll is for X: the question is under 280 characters and each option is 25 characters or fewer.", kit ? kitPrompt({ ...kit, hashtags: [] }) : ""], `Write a poll about this. Answer as {"question": "...", "options": ["...", "..."]} with 2 to 4 options.\n\n<text>\n${text.slice(0, 4000)}\n</text>`, 800);
  return parsePoll(o, 280);
}

/** Slides for a LinkedIn carousel (4 to 12) or a TikTok slideshow (3 to 10): a short title and body each. */
export async function writeSlides(sp: Spender, text: string, kind: "carousel" | "slideshow", kit?: BrandKit): Promise<Slide[]> {
  if (!text.trim()) throw new Error("Write what the slides are about first");
  const [min, max] = kind === "carousel" ? [4, 12] : [3, 10];
  const o = await format(sp, kind, [kit ? kitPrompt({ ...kit, hashtags: [] }) : ""], `Turn this into ${min} to ${max} slides for a ${kind === "carousel" ? "LinkedIn carousel" : "TikTok photo slideshow"}. Slide 1 is a strong title that makes people swipe, with a one-line body. Each next slide makes one point: a title of at most 8 words and a body of at most 30 words. The last slide sums up. Answer as {"slides": [{"title": "...", "body": "..."}]}.\n\n<text>\n${text.slice(0, 8000)}\n</text>`);
  return parseSlides(o, min, max);
}

/** One Claude call that answers with text. Null when Claude declines. */
async function ask(system: string, content: Anthropic.Beta.BetaContentBlockParam[], maxTokens: number, effort?: "low"): Promise<string | null> {
  const res = await new Anthropic().beta.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content }],
    ...(effort ? { output_config: { effort } } : {}),
    betas: ["server-side-fallback-2026-07-01"],
    ...({ fallbacks: "default" } as object),
  } as Anthropic.Beta.MessageCreateParamsNonStreaming);
  if (res.stop_reason === "refusal") return null;
  const out = res.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("")
    .trim();
  if (!out) throw new Error("No text came back, try again");
  return out;
}

// Pictures Claude can look at: these types, up to 5 MB.
const SEES = /^image\/(jpeg|png|gif|webp)$/;
const SEE_BYTES = 5 * 1024 * 1024;

/**
 * A caption for a picture or video in the library (bulk upload). Claude looks at pictures; for videos and large
 * files it works from the file name and the notes.
 */
export async function caption(sp: Spender, mediaId: string, notes: string, network: NetworkId | null): Promise<string> {
  const workspaceId = sp.workspaceId;
  const db = adminClient();
  const { data: m } = await db.from("media").select("path, name, mime, size").eq("id", mediaId).eq("workspace_id", workspaceId).maybeSingle();
  if (!m) throw new Error("File not found");
  const n = network ? networkOf(network) : null;
  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  if (SEES.test(m.mime as string) && Number(m.size) <= SEE_BYTES) {
    const { data: blob } = await db.storage.from("media").download(m.path as string);
    if (blob) content.push({ type: "image", source: { type: "base64", media_type: m.mime as "image/jpeg", data: Buffer.from(await blob.arrayBuffer()).toString("base64") } });
  }
  const system = [
    "You write social media captions inside Capybaroar.",
    "Reply with the caption only: no quotes, no notes, no preamble.",
    "Describe only what is shown or stated in the notes. Never invent facts, numbers, prices, quotes, names or links.",
    "Write in the language of the notes, or English when there are none. One to three short sentences.",
    n ? `The post is for ${n.name}, which allows up to ${n.limit} characters. Stay well under it.` : "",
  ]
    .filter(Boolean)
    .join("\n");
  const about = notes.trim().slice(0, 1000);
  content.push({ type: "text", text: `Write a caption for this ${String(m.mime).startsWith("video/") ? "video" : "picture"}.\n<file_name>${String(m.name).slice(0, 200)}</file_name>${about ? `\n<notes>\n${about}\n</notes>` : ""}` });
  return withCredits(sp, { tool: "caption" }, WRITE_CREDITS, async () => {
    const out = await ask(system, content, 1000, "low");
    if (out === null) throw new Error("Claude can't write a caption for this file");
    return n && [...out].length > n.limit ? [...out].slice(0, n.limit).join("") : out;
  });
}

export type Snippet = { id: string; name: string; body: string };

export async function listSnippets(workspaceId: string): Promise<Snippet[]> {
  const { data, error } = await adminClient().from("snippets").select("id, name, body").eq("workspace_id", workspaceId).order("created_at", { ascending: false }).limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []) as Snippet[];
}

export async function addSnippet(workspaceId: string, name: string, body: string): Promise<Snippet> {
  const n = name.trim().slice(0, 60);
  const b = body.trim();
  if (!n) throw new Error("Give it a name");
  if (!b) throw new Error("A snippet needs text");
  if (b.length > 3000) throw new Error("Snippets are up to 3,000 characters");
  const { data, error } = await adminClient().from("snippets").insert({ workspace_id: workspaceId, name: n, body: b }).select("id, name, body").single();
  if (error) throw new Error(error.message);
  return data as Snippet;
}

export async function deleteSnippet(workspaceId: string, id: string) {
  const { error } = await adminClient().from("snippets").delete().eq("id", id).eq("workspace_id", workspaceId);
  if (error) throw new Error(error.message);
}

const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
/** A new short-link code: 7 letters and numbers, without look-alikes. */
export const linkCode = () => Array.from(crypto.getRandomValues(new Uint8Array(7)), (b) => ALPHA[b % ALPHA.length]).join("");

/**
 * A short link on our own domain that counts clicks. The same long link in a workspace reuses its code, except a
 * link-in-bio page's own links (page_id set), whose clicks count for that page only.
 */
export async function shorten(workspaceId: string, url: string): Promise<string> {
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    throw new Error("That isn't a link");
  }
  if (!/^https?:$/.test(u.protocol)) throw new Error("Use an http or https link");
  const long = u.toString();
  if (long.startsWith(`${appUrl()}/l/`)) return long;
  const db = adminClient();
  const same = () => db.from("links").select("code").eq("workspace_id", workspaceId).eq("url", long);
  const first = await same().is("page_id", null).limit(1).maybeSingle();
  // A database without 014 yet has no page links to leave out.
  const found = first.error ? (await same().limit(1).maybeSingle()).data : first.data;
  if (found) return `${appUrl()}/l/${found.code}`;
  for (let i = 0; i < 4; i++) {
    const c = linkCode();
    const { error } = await db.from("links").insert({ code: c, workspace_id: workspaceId, url: long });
    if (!error) return `${appUrl()}/l/${c}`;
    if (error.code !== "23505") throw new Error(error.message);
  }
  throw new Error("Couldn't make a short link, try again");
}

/**
 * Count a click and say where the short link goes. A click by a person on a link-in-bio page's link also counts for
 * that page and block (link_open, 014); crawlers and link previews only add to the link's own total, as before.
 */
export async function resolveLink(c: string, human = true): Promise<string | null> {
  if (!/^[A-Za-z0-9]{6,12}$/.test(c)) return null;
  const db = adminClient();
  const { data, error } = await db.rpc("link_open", { p_code: c, p_human: human });
  if (!error) return typeof data === "string" ? data : null;
  // A database without 014 yet: count the click the old way.
  const { data: old } = await db.rpc("link_click", { p_code: c });
  return typeof old === "string" ? old : null;
}

const run = promisify(execFile);

/** Cut a video to [start, end] seconds with ffmpeg and save it as a new file in the library. The original stays. */
export async function trimVideo(workspaceId: string, userId: string, id: string, start: number, end: number): Promise<string> {
  if (!(start >= 0) || !(end > start) || end - start < 0.5) throw new Error("Pick at least half a second");
  const db = adminClient();
  const { data: m } = await db.from("media").select("path, name, mime").eq("id", id).eq("workspace_id", workspaceId).single();
  if (!m || !String(m.mime).startsWith("video/")) throw new Error("Video not found");
  const { data: blob, error } = await db.storage.from("media").download(m.path as string);
  if (error || !blob) throw new Error(error?.message ?? "Couldn't read the video");
  const dir = await mkdtemp(join(tmpdir(), "trim-"));
  try {
    const src = join(dir, "in");
    const out = join(dir, "out.mp4");
    await writeFile(src, Buffer.from(await blob.arrayBuffer()));
    await run("ffmpeg", ["-y", "-ss", start.toFixed(2), "-i", src, "-t", (end - start).toFixed(2), "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", out], { timeout: 300000 });
    const bytes = await readFile(out);
    const name = `${String(m.name).replace(/\.[^.]+$/, "")}-trim.mp4`;
    const path = `${workspaceId}/${crypto.randomUUID()}-${name.replace(/[^\w.-]+/g, "-").slice(-80)}`;
    const up = await db.storage.from("media").upload(path, bytes, { contentType: "video/mp4" });
    if (up.error) throw new Error(up.error.message);
    const { data: row, error: e2 } = await db.from("media").insert({ workspace_id: workspaceId, path, name: name.slice(0, 200), mime: "video/mp4", size: bytes.length, created_by: userId }).select("id").single();
    if (e2) throw new Error(e2.message);
    return row.id as string;
  } catch (e) {
    if (e instanceof Error && /ENOENT/.test(e.message)) throw new Error("Video trimming isn't set up on this server");
    throw e;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
