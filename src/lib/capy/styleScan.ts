import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { safeGet } from "../api/fetchSafe";
import { sniffMime } from "../api/net";
import { adminClient } from "../supabase/server";
import { FONTS, FONT_IDS, MAX_LOGO, cleanStyle, cssColors, cssFonts, cssTokens, pageAssets, themeColor, type BrandStyle } from "./styleRules";

// Reads a brand's look from its website: the home page, up to 3 more pages and up to 10 stylesheets, all through
// fetchSafe (public internet only, checked on the address it connects to). The colors, fonts and tokens found are
// counted here; Claude turns them into a style (cleanStyle checks it). The logo is downloaded and kept as a data URL.

const MODEL = "claude-sonnet-5-5";
const PAGE_BYTES = 768 * 1024;
const CSS_BYTES = 1024 * 1024;
const MS = 8000;

async function read(url: string, max: number, want: RegExp): Promise<{ text: string; url: string } | null> {
  try {
    const res = await safeGet(new URL(url), MS);
    const type = String(res.headers["content-type"] ?? "");
    if (res.status !== 200 || !want.test(type)) {
      res.body.resume();
      return null;
    }
    const chunks: Buffer[] = [];
    let size = 0;
    const stop = setTimeout(() => res.body.destroy(new Error("Too slow")), MS);
    try {
      for await (const c of res.body as AsyncIterable<Buffer>) {
        chunks.push(c);
        size += c.length;
        if (size >= max) {
          res.body.destroy();
          break;
        }
      }
    } finally {
      clearTimeout(stop);
    }
    return { text: Buffer.concat(chunks).subarray(0, max).toString("utf8"), url: res.url.href };
  } catch {
    return null;
  }
}

async function readLogo(url: string): Promise<string | null> {
  try {
    const res = await safeGet(new URL(url), MS);
    if (res.status !== 200) {
      res.body.resume();
      return null;
    }
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const c of res.body as AsyncIterable<Buffer>) {
      chunks.push(c);
      size += c.length;
      if (size > MAX_LOGO) {
        res.body.destroy();
        return null;
      }
    }
    const bytes = Buffer.concat(chunks);
    const head = bytes.subarray(0, 512).toString("utf8");
    const mime = /<svg[\s>]/i.test(head) ? "image/svg+xml" : sniffMime(bytes.subarray(0, 16));
    if (!mime || !/^image\/(png|jpeg|webp|svg\+xml)$/.test(mime)) return null;
    return `data:${mime};base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["bg", "surface", "ink", "muted", "line", "accent", "accentInk", "accent2", "headFont", "headWeight", "bodyFont", "radius", "look", "logo"],
  properties: {
    bg: { type: "string" },
    surface: { type: "string" },
    ink: { type: "string" },
    muted: { type: "string" },
    line: { type: "string" },
    accent: { type: "string" },
    accentInk: { type: "string" },
    accent2: { type: "string" },
    headFont: { type: "string", enum: FONT_IDS },
    headWeight: { type: "number" },
    bodyFont: { type: "string", enum: FONT_IDS },
    radius: { type: "number" },
    look: { type: "string" },
    logo: { type: "string", description: "The best logo address from the list, or empty" },
  },
};

const SYSTEM = `You read a brand's website (its colors, fonts and CSS tokens, counted from the page source and stylesheets) and write the brand's visual style for social media graphics.
- Colors as #RRGGBB. bg: the main page background. surface: cards or sections a step away from bg. ink: main text. muted: secondary text. line: borders. accent: the brand's main color (buttons, links, logo), never a gray. accentInk: text on the accent. accent2: a second brand color, or a darker or lighter take on the accent.
- Prefer what the brand really uses most on its pages over rare colors. Ignore colors from embedded widgets, cookie banners and social icons.
- headFont and bodyFont: the closest of our fonts to the site's own (each font lists the ones it stands in for). headWeight: how heavy the site's headings are (400 to 800).
- radius: the site's usual corner size on buttons and cards in px (0 for square).
- look: one short sentence on the feel (e.g. "Calm and editorial, lots of white, thin lines, serif headlines").
- logo: pick the address most likely to be the brand's logo (an SVG or a wide PNG beats a tiny favicon), or empty.`;

export async function scanStyle(website: string): Promise<{ style: BrandStyle; tokens: { input: number; output: number } }> {
  let start: URL;
  try {
    start = new URL(/^https?:\/\//i.test(website) ? website : `https://${website}`);
  } catch {
    throw new Error("That website address doesn't look right");
  }
  const home = await read(start.href, PAGE_BYTES, /html/i);
  if (!home) throw new Error(`Couldn't open ${start.hostname}. Check the address.`);
  const a = pageAssets(home.text, home.url);
  const more = await Promise.all(a.pages.map((p) => read(p, PAGE_BYTES, /html/i)));
  const pages = [home, ...more.filter((x): x is NonNullable<typeof x> => !!x)];
  const sheetUrls = [...new Set([...a.sheets, ...pages.slice(1).flatMap((p) => pageAssets(p.text, p.url).sheets)])].slice(0, 10);
  const sheets = await Promise.all(sheetUrls.map((u) => read(u, CSS_BYTES, /css|text\/plain|octet/i)));
  const css = [a.inline, ...pages.slice(1).map((p) => pageAssets(p.text, p.url).inline), ...sheets.map((s) => s?.text ?? "")].join("\n");
  const title = /<title[^>]*>([^<]{0,120})/i.exec(home.text)?.[1]?.trim() ?? "";
  const facts = [
    `Website: ${home.url}`,
    title ? `Title: ${title}` : "",
    themeColor(home.text) ? `Declared theme color: ${themeColor(home.text)}` : "",
    `Colors by use: ${cssColors(css).map((c) => `${c.color} (${c.n})`).join(", ") || "none found"}`,
    `Fonts by use: ${cssFonts(css).join(", ") || "none found"}`,
    `CSS tokens:\n${cssTokens(css).join("\n") || "none"}`,
    `Logo candidates:\n${a.logos.join("\n") || "none"}`,
    `Our fonts:\n${FONT_IDS.map((id) => `${id}: ${FONTS[id].look}`).join("\n")}`,
  ]
    .filter(Boolean)
    .join("\n\n");
  const res = await new Anthropic().beta.messages.create({
    model: MODEL,
    max_tokens: 1500,
    system: SYSTEM,
    messages: [{ role: "user", content: [{ type: "text", text: facts }] }],
    output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
  } as unknown as Anthropic.Beta.MessageCreateParamsNonStreaming);
  if (res.stop_reason === "refusal") throw new Error("Couldn't read this website's style");
  const text = res.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("");
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("Couldn't read this website's style. Try again.");
  }
  const pick = typeof raw.logo === "string" && a.logos.includes(raw.logo) ? raw.logo : a.logos[0];
  const logo = pick ? await readLogo(pick) : null;
  const style = cleanStyle({ ...raw, logo, source: home.url });
  return { style, tokens: { input: res.usage?.input_tokens ?? 0, output: res.usage?.output_tokens ?? 0 } };
}

/** A brand's saved style and website, or nulls. */
export async function brandStyleOf(workspaceId: string, brandId: string | null): Promise<{ name: string; website: string | null; style: BrandStyle | null }> {
  if (!brandId) {
    const { data } = await adminClient().from("workspaces").select("name").eq("id", workspaceId).maybeSingle();
    return { name: (data?.name as string) ?? "", website: null, style: null };
  }
  const { data } = await adminClient().from("brands").select("name, website, style").eq("id", brandId).eq("workspace_id", workspaceId).maybeSingle();
  return { name: (data?.name as string) ?? "", website: (data?.website as string | null) ?? null, style: data?.style ? cleanStyle(data.style) : null };
}

/** Reads the website and saves the style on the brand. */
export async function readBrandStyle(workspaceId: string, brandId: string, website: string): Promise<BrandStyle> {
  const { style, tokens } = await scanStyle(website);
  console.info(`brand style: ${tokens.input} in, ${tokens.output} out`);
  const { error } = await adminClient().from("brands").update({ website: style.source, style, style_read_at: new Date().toISOString() }).eq("id", brandId).eq("workspace_id", workspaceId);
  if (error) throw new Error(error.message);
  return style;
}

export async function saveBrandStyle(workspaceId: string, brandId: string, raw: unknown): Promise<BrandStyle | null> {
  const style = raw == null ? null : cleanStyle(raw);
  const { error } = await adminClient().from("brands").update({ style }).eq("id", brandId).eq("workspace_id", workspaceId);
  if (error) throw new Error(error.message);
  return style;
}
