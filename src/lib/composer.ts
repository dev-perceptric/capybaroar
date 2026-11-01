import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { adminClient } from "./supabase/server";
import { appUrl } from "./channels";
import { assertCanUseAgent } from "./billing";
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

export async function rewrite(workspaceId: string, text: string, how: Rewrite, network: NetworkId | null): Promise<string> {
  await assertCanUseAgent(workspaceId);
  if (!text.trim()) throw new Error("Write something first");
  if (!(how in REWRITES)) throw new Error("Unknown action");
  const n = network ? networkOf(network) : null;
  const system = [
    "You rewrite social media posts inside Capybaroar.",
    "Reply with the new post text only: no quotes, no notes, no preamble.",
    "Never invent facts, numbers, quotes, names or links. Keep every link and @mention exactly as written.",
    "Keep the language of the original.",
    n ? `The post is for ${n.name}, which allows up to ${n.limit} characters. Stay under it.` : "",
  ]
    .filter(Boolean)
    .join("\n");
  const res = await new Anthropic().beta.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system,
    messages: [{ role: "user", content: `${REWRITES[how]}\n\n<post>\n${text}\n</post>` }],
    betas: ["server-side-fallback-2026-07-01"],
    ...({ fallbacks: "default" } as object),
  } as Anthropic.Beta.MessageCreateParamsNonStreaming);
  if (res.stop_reason === "refusal") throw new Error("Claude can't rewrite this post");
  const out = res.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("")
    .trim();
  if (!out) throw new Error("No text came back, try again");
  return out;
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
const code = () => Array.from(crypto.getRandomValues(new Uint8Array(7)), (b) => ALPHA[b % ALPHA.length]).join("");

/** A short link on our own domain that counts clicks. The same long link in a workspace reuses its code. */
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
  const { data: found } = await db.from("links").select("code").eq("workspace_id", workspaceId).eq("url", long).limit(1).maybeSingle();
  if (found) return `${appUrl()}/l/${found.code}`;
  for (let i = 0; i < 4; i++) {
    const c = code();
    const { error } = await db.from("links").insert({ code: c, workspace_id: workspaceId, url: long });
    if (!error) return `${appUrl()}/l/${c}`;
    if (error.code !== "23505") throw new Error(error.message);
  }
  throw new Error("Couldn't make a short link, try again");
}

export async function resolveLink(c: string): Promise<string | null> {
  if (!/^[A-Za-z0-9]{6,12}$/.test(c)) return null;
  const { data } = await adminClient().rpc("link_click", { p_code: c });
  return typeof data === "string" ? data : null;
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
