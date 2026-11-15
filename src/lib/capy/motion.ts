import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { adminClient } from "../supabase/server";
import { MOTION_MODEL, MOTION_SKILL, cleanPlan, motionPrompt, motionProps, planSchema, type MotionAspect, type Scene } from "./motionRules";
import { DEFAULT_STYLE } from "./styleRules";
import { brandStyleOf, readBrandStyle, scanStyle } from "./styleScan";

// CapyMotion, the server half: Claude plans the scenes (checked by cleanPlan), and Remotion renders our own scene kit
// (motion-bundle/, built from src/motion at build time) with that plan as props, in the system Chromium. No code from
// Claude runs. One video renders at a time per server, two frames at once; the rest wait their turn.

export type MotionJob = { workspaceId: string; brandId: string | null; prompt: string; aspect: MotionAspect; sourceMediaId: string | null; website: string | null };
export type MotionResult = { mp4: Buffer; alt: string; missing: string[]; scenes: Scene[]; tokens: { input: number; output: number } };

const RENDER_MS = 6 * 60000;
let busy: Promise<unknown> = Promise.resolve();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const hiccup = (e: unknown) => {
  const s = (e as { status?: number }).status ?? 0;
  return s === 0 || s === 408 || s === 409 || s === 429 || s >= 500;
};

async function plan(prompt: string, used: { input: number; output: number }): Promise<{ scenes: unknown; alt: string; missing: string[] }> {
  for (let i = 0; ; i++) {
    try {
      const res = await new Anthropic().beta.messages.create({
        model: MOTION_MODEL.claude,
        max_tokens: 4000,
        system: [{ type: "text", text: MOTION_SKILL, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: [{ type: "text", text: prompt }] }],
        output_config: { format: { type: "json_schema", schema: planSchema() } },
      } as unknown as Anthropic.Beta.MessageCreateParamsNonStreaming);
      used.input += (res.usage?.input_tokens ?? 0) + (res.usage?.cache_read_input_tokens ?? 0) + (res.usage?.cache_creation_input_tokens ?? 0);
      used.output += res.usage?.output_tokens ?? 0;
      if (res.stop_reason === "refusal") throw new Error("Claude can't plan this one. Try other words.");
      const text = res.content
        .filter((b) => b.type === "text")
        .map((b) => (b as { text: string }).text)
        .join("");
      return JSON.parse(text);
    } catch (e) {
      if (i < 2 && (hiccup(e) || e instanceof SyntaxError)) {
        await sleep(2000 * 3 ** i);
        continue;
      }
      throw e instanceof SyntaxError ? new Error("The video plan couldn't be read. Try again.") : e;
    }
  }
}

/** The library photo, made small enough to travel in the props (longest side 1600 px, JPEG). */
async function photoOf(workspaceId: string, id: string | null): Promise<string | null> {
  if (!id) return null;
  const db = adminClient();
  const { data: m } = await db.from("media").select("path, mime").eq("id", id).eq("workspace_id", workspaceId).maybeSingle();
  if (!m || !/^image\/(jpeg|png|webp|gif)$/.test(m.mime as string)) throw new Error("Use a JPG, PNG or WebP picture from the library");
  const { data, error } = await db.storage.from("media").download(m.path as string);
  if (error || !data) throw new Error("Couldn't open the picture. Try again.");
  const sharp = (await import("sharp")).default;
  const jpg = await sharp(Buffer.from(await data.arrayBuffer())).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer();
  return `data:image/jpeg;base64,${jpg.toString("base64")}`;
}

/** Renders a plan to an MP4 with our scene kit. Exported for tests and the sample render. */
export async function renderMotion(props: ReturnType<typeof motionProps>): Promise<Buffer> {
  const run = busy.then(async () => {
    const { renderMedia, selectComposition, makeCancelSignal } = await import("@remotion/renderer");
    const serveUrl = join(process.cwd(), "motion-bundle");
    const opts = { serveUrl, browserExecutable: process.env.CHROMIUM_PATH || "/usr/bin/chromium", chromeMode: "chrome-for-testing" as const, chromiumOptions: { gl: "swangle" as const }, logLevel: "error" as const, timeoutInMilliseconds: 60000 };
    const dir = await mkdtemp(join(tmpdir(), "motion-"));
    const stop = new AbortController();
    const timer = setTimeout(() => stop.abort(), RENDER_MS);
    try {
      const cancel = makeCancelSignal();
      stop.signal.addEventListener("abort", () => cancel.cancel());
      const composition = await selectComposition({ ...opts, id: "CapyMotion", inputProps: props });
      const out = join(dir, "video.mp4");
      await renderMedia({ ...opts, composition, inputProps: props, codec: "h264", crf: 20, pixelFormat: "yuv420p", outputLocation: out, concurrency: 2, cancelSignal: cancel.cancelSignal });
      return await readFile(out);
    } catch (e) {
      if (stop.signal.aborted) throw new Error("The video took too long to render. Try fewer scenes.");
      throw e;
    } finally {
      clearTimeout(timer);
      await rm(dir, { recursive: true, force: true });
    }
  });
  busy = run.catch(() => undefined);
  return run;
}

export async function makeMotion(job: MotionJob): Promise<MotionResult> {
  const used = { input: 0, output: 0 };
  const brand = await brandStyleOf(job.workspaceId, job.brandId);
  let style = brand.style;
  if (job.website && (!style || !brand.website || new URL(/^https?:/.test(job.website) ? job.website : `https://${job.website}`).hostname !== new URL(brand.website).hostname)) {
    style = job.brandId ? await readBrandStyle(job.workspaceId, job.brandId, job.website) : (await scanStyle(job.website)).style;
  }
  style ??= DEFAULT_STYLE;
  const photo = await photoOf(job.workspaceId, job.sourceMediaId);
  const handle = style.source ? new URL(style.source).hostname.replace(/^www\./, "") : "";
  const raw = await plan(motionPrompt({ prompt: job.prompt, aspect: job.aspect, brandName: brand.name, look: style.look, photo: !!photo, handle }), used);
  const scenes = cleanPlan(raw, !!photo);
  const mp4 = await renderMotion(motionProps(style, job.aspect, scenes, brand.name, handle, photo));
  console.info(`motion: ${scenes.length} scenes, ${used.input} in, ${used.output} out, ${Math.round(mp4.length / 1024)} KB`);
  return { mp4, alt: (typeof raw.alt === "string" && raw.alt ? raw.alt : job.prompt).slice(0, 500), missing: Array.isArray(raw.missing) ? raw.missing.slice(0, 10) : [], scenes, tokens: used };
}
