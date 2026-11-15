import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { adminClient } from "../supabase/server";
import { CANVAS, INFO_MODELS, answerSchema, checkSchema, checkSystem, cleanDesign, designPrompt, pageHtml, systemPrompt, type InfoAspect, type InfoModel } from "./infographicRules";
import { renderPng, type Assets } from "./render";
import { DEFAULT_STYLE, type BrandStyle } from "./styleRules";
import { brandStyleOf, readBrandStyle, scanStyle } from "./styleScan";

// CapyInfographic, the server half: Claude designs the picture as HTML and CSS, Chromium renders it, Claude looks at
// the PNG (with the problems the renderer measured) and fixes it once if needed. No image model is used.

export type InfoJob = { workspaceId: string; brandId: string | null; model: InfoModel; prompt: string; aspect: InfoAspect; sourceMediaId: string | null; website: string | null };
export type InfoResult = { png: Buffer; alt: string; missing: string[]; style: BrandStyle; tokens: { input: number; output: number } };

type Design = { layout: string; alt: string; css: string; body: string; missing: string[] };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const hiccup = (e: unknown) => {
  const s = (e as { status?: number }).status ?? 0;
  return s === 0 || s === 408 || s === 409 || s === 429 || s >= 500;
};

/** One Claude answer in a fixed JSON shape, tried again on hiccups with growing waits. */
async function ask<T>(model: string, system: string, content: Anthropic.Beta.BetaContentBlockParam[], schema: object, maxTokens: number, used: { input: number; output: number }): Promise<T> {
  for (let i = 0; ; i++) {
    try {
      const res = await new Anthropic().beta.messages.create({
        model,
        max_tokens: maxTokens,
        system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content }],
        output_config: { format: { type: "json_schema", schema } },
      } as unknown as Anthropic.Beta.MessageCreateParamsNonStreaming);
      used.input += (res.usage?.input_tokens ?? 0) + (res.usage?.cache_read_input_tokens ?? 0) + (res.usage?.cache_creation_input_tokens ?? 0);
      used.output += res.usage?.output_tokens ?? 0;
      if (res.stop_reason === "refusal") throw new Error("Claude can't design this one. Try other words.");
      if (res.stop_reason === "max_tokens") throw new Error("The design came back cut short. Try a shorter request.");
      const text = res.content
        .filter((b) => b.type === "text")
        .map((b) => (b as { text: string }).text)
        .join("");
      return JSON.parse(text) as T;
    } catch (e) {
      if (i < 2 && (hiccup(e) || e instanceof SyntaxError)) {
        await sleep(2000 * 3 ** i);
        continue;
      }
      throw e instanceof SyntaxError ? new Error("The design couldn't be read. Try again.") : e;
    }
  }
}

async function photoOf(workspaceId: string, id: string | null): Promise<Assets["photo"]> {
  if (!id) return null;
  const db = adminClient();
  const { data: m } = await db.from("media").select("path, mime").eq("id", id).eq("workspace_id", workspaceId).maybeSingle();
  if (!m || !/^image\/(jpeg|png|webp|gif)$/.test(m.mime as string)) throw new Error("Use a JPG, PNG or WebP picture from the library");
  const { data, error } = await db.storage.from("media").download(m.path as string);
  if (error || !data) throw new Error("Couldn't open the picture. Try again.");
  return { bytes: Buffer.from(await data.arrayBuffer()), mime: m.mime as string };
}

export async function makeInfographic(job: InfoJob): Promise<InfoResult> {
  const used = { input: 0, output: 0 };
  // The brand's look: saved, read now from the website given, or a clean default.
  const brand = await brandStyleOf(job.workspaceId, job.brandId);
  let style = brand.style;
  if (job.website && (!style || !brand.website || new URL(/^https?:/.test(job.website) ? job.website : `https://${job.website}`).hostname !== new URL(brand.website).hostname)) {
    style = job.brandId ? await readBrandStyle(job.workspaceId, job.brandId, job.website) : (await scanStyle(job.website)).style;
  }
  style ??= DEFAULT_STYLE;
  const photo = await photoOf(job.workspaceId, job.sourceMediaId);
  const assets: Assets = { logo: style.logo, photo };
  const { w, h } = CANVAS[job.aspect];
  const claude = INFO_MODELS[job.model].claude;
  const handle = style.source ? new URL(style.source).hostname.replace(/^www\./, "") : null;

  const first = await ask<Design>(claude, systemPrompt(), [{ type: "text", text: designPrompt({ prompt: job.prompt, aspect: job.aspect, brandName: brand.name, style, photo: !!photo, handle }) }], answerSchema(), 12000, used);
  let design = cleanDesign(first.css, first.body);
  let out = await renderPng(pageHtml(style, job.aspect, design), w, h, assets);

  // Claude looks at what it made, with what the renderer measured, and fixes it once.
  const check = await ask<{ ok: boolean; problems: string[]; css: string; body: string }>(
    claude,
    checkSystem(),
    [
      { type: "image", source: { type: "base64", media_type: "image/png", data: out.png.toString("base64") } },
      { type: "text", text: `Canvas ${w} by ${h}. The request: ${job.prompt}\nMeasured problems: ${out.spills.length ? out.spills.join("; ") : "none"}\nThe design:\ncss:\n${design.css}\nbody:\n${design.body}` },
    ],
    checkSchema(),
    12000,
    used,
  ).catch(() => null);
  if (check && !check.ok && check.css.trim() && check.body.trim()) {
    const fixed = cleanDesign(check.css, check.body);
    const again = await renderPng(pageHtml(style, job.aspect, fixed), w, h, assets).catch(() => null);
    // The fix is kept only when it spills no more than the first try.
    if (again && again.spills.length <= out.spills.length) {
      design = fixed;
      out = again;
    }
  }
  console.info(`infographic: ${job.model} ${used.input} in, ${used.output} out, ${out.spills.length} spills`);
  return { png: out.png, alt: (first.alt || job.prompt).slice(0, 500), missing: Array.isArray(first.missing) ? first.missing.slice(0, 10) : [], style, tokens: used };
}
