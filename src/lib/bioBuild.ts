import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { adminClient } from "./supabase/server";
import { listChannels } from "./channels";
import { networkOf } from "./networks";
import { withCredits } from "./credits";
import { BIO_CREDITS } from "./creditRules";
import { safeGet } from "./api/fetchSafe";
import { httpUrl, profileUrl } from "./bioBlocks";
import { SYSTEM, answerSchema, buildPrompt, cleanInput, cleanResult, extractSite, type BuildContext, type BuildResult, type SiteInfo } from "./bioAi";
import { socialDefaults } from "./bio";

// Build with AI, the server half: gather what's known about the brand, read its website when one is given, ask
// Claude once for a page in a fixed JSON shape, and check the answer (src/lib/bioAi.ts). Nothing is saved: the
// editor shows the result as a draft.

const MODEL = "claude-opus-5-5";
const SITE_BYTES = 512 * 1024;
const SITE_MS = 6000;

/** A home page's title, description and links, through fetchSafe (public internet only), at most 512 KB in 6 s. */
async function readSite(address: string): Promise<SiteInfo> {
  const host = new URL(address).hostname.replace(/^www\./, "");
  try {
    const res = await safeGet(new URL(address), SITE_MS);
    const type = String(res.headers["content-type"] ?? "");
    if (res.status !== 200 || !/html/i.test(type)) {
      res.body.resume();
      throw new Error(`status ${res.status} ${type}`);
    }
    const chunks: Buffer[] = [];
    let size = 0;
    const stop = setTimeout(() => res.body.destroy(new Error("Too slow")), SITE_MS);
    try {
      for await (const c of res.body as AsyncIterable<Buffer>) {
        chunks.push(c);
        size += c.length;
        if (size >= SITE_BYTES) {
          res.body.destroy();
          break;
        }
      }
    } finally {
      clearTimeout(stop);
    }
    return extractSite(Buffer.concat(chunks).subarray(0, SITE_BYTES).toString("utf8"), res.url);
  } catch (e) {
    console.error("bio build: site:", e instanceof Error ? e.message : e);
    throw new Error(`Couldn't open ${host}. Check the address or leave it empty.`);
  }
}

/** The brand's last few published posts: a short text and the post's link on its network. */
async function recentPosts(workspaceId: string, channelIds: string[], networks: Map<string, string>) {
  if (!channelIds.length) return [];
  const { data } = await adminClient()
    .from("post_targets")
    .select("post_id, channel_id, url, text, posts(text)")
    .eq("workspace_id", workspaceId)
    .eq("status", "published")
    .in("channel_id", channelIds)
    .is("deleted_at", null)
    .order("published_at", { ascending: false })
    .limit(20);
  type R = { post_id: string; channel_id: string; url: string | null; text: string | null; posts: { text: string } | { text: string }[] | null };
  const seen = new Set<string>();
  const out: BuildContext["posts"] = [];
  for (const r of (data ?? []) as unknown as R[]) {
    const p = Array.isArray(r.posts) ? r.posts[0] : r.posts;
    const text = (r.text ?? p?.text ?? "").trim();
    if (seen.has(r.post_id) || !text) continue;
    seen.add(r.post_id);
    out.push({ network: networks.get(r.channel_id) ?? "", text: text.slice(0, 200), url: httpUrl(r.url) });
    if (out.length === 5) break;
  }
  return out;
}

export type BuildAnswer = BuildResult & { tokens: { input: number; output: number } };

/** One Claude call for a page draft for this brand. Throws a message people can read. */
export async function buildBioDraft(workspaceId: string, userId: string, brand: { id: string; name: string }, rawInput: unknown): Promise<BuildAnswer> {
  const input = cleanInput(rawInput);
  return withCredits({ workspaceId, userId, brandId: brand.id }, { tool: "bio" }, BIO_CREDITS, () => draftFor(workspaceId, brand, input));
}

async function draftFor(workspaceId: string, brand: { id: string; name: string }, input: ReturnType<typeof cleanInput>): Promise<BuildAnswer> {
  const chans = await listChannels(workspaceId, [brand.id]);
  const names = new Map(chans.map((c) => [c.id, networkOf(c.network).name]));
  const [posts, social, site] = await Promise.all([recentPosts(workspaceId, chans.map((c) => c.id), names), socialDefaults(workspaceId, brand.id), input.website ? readSite(input.website) : Promise.resolve(null)]);
  const ctx: BuildContext = {
    brand: brand.name,
    input,
    channels: chans.slice(0, 15).map((c) => ({ network: networkOf(c.network).name, handle: c.username ? `@${c.username.replace(/^@/, "")}` : c.name, url: profileUrl(c)?.url ?? null })),
    posts,
    site,
  };
  const res = await new Anthropic().beta.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system: SYSTEM,
    messages: [{ role: "user", content: [{ type: "text", text: buildPrompt(ctx) }] }],
    output_config: { effort: "low", format: { type: "json_schema", schema: answerSchema() } },
    betas: ["server-side-fallback-2026-07-01"],
    // A request a safety check declines is re-run on Anthropic's recommended fallback model.
    ...({ fallbacks: "default" } as object),
  } as unknown as Anthropic.Beta.MessageCreateParamsNonStreaming);
  const tokens = { input: res.usage?.input_tokens ?? 0, output: res.usage?.output_tokens ?? 0 };
  console.info(`bio build: ${tokens.input} in, ${tokens.output} out`);
  if (res.stop_reason === "refusal") throw new Error("Claude can't build this page");
  if (res.stop_reason === "max_tokens") throw new Error("The page came back cut short, try again");
  const text = res.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("");
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("Claude's answer couldn't be read, try again");
  }
  return { ...cleanResult(raw, ctx, social), tokens };
}
