// CapyMotion, the pure half: the scene kinds our Remotion kit animates (src/motion), the limits on each, how Claude's
// plan is checked, the canvas sizes, the props the composition gets, the model and its credits. Claude only writes a
// plan (scenes, words, numbers, timing); no code from Claude ever runs. No fetch, Supabase or browser, so tests run it.

import { priceOf } from "../creditRules";
import { FONTS, accentText, type BrandStyle } from "./styleRules";

export type MotionAspect = "9:16" | "1:1" | "4:5" | "16:9";
export const MOTION_ASPECTS: MotionAspect[] = ["9:16", "1:1", "4:5", "16:9"];
export const MOTION_CANVAS: Record<MotionAspect, { w: number; h: number }> = {
  "9:16": { w: 1080, h: 1920 },
  "1:1": { w: 1080, h: 1080 },
  "4:5": { w: 1080, h: 1350 },
  "16:9": { w: 1920, h: 1080 },
};
export const FPS = 30;
export const MAX_SECONDS = 30;
export const MAX_SCENES = 8;

import { MOTION_MODEL } from "./infoModels";
export { MOTION_MODEL } from "./infoModels";
export const motionCredits = () => priceOf(MOTION_MODEL.cents);

export const SCENE_KINDS = ["title", "stat", "bars", "list", "quote", "compare", "photo", "cta"] as const;
export type SceneKind = (typeof SCENE_KINDS)[number];

export type Scene = {
  kind: SceneKind;
  seconds: number;
  kicker: string;
  headline: string;
  sub: string;
  /** stat */
  value: number;
  prefix: string;
  suffix: string;
  decimals: number;
  /** list, compare (left), bars (labels) */
  items: string[];
  /** bars (values, same order as items) */
  values: number[];
  /** compare: the right side */
  right: string[];
  leftLabel: string;
  rightLabel: string;
  /** quote */
  name: string;
  /** cta */
  button: string;
};

export const LIMITS = { kicker: 30, headline: 64, sub: 100, item: 48, label: 18, name: 40, button: 24, prefix: 3, suffix: 6, quote: 170 };

const str = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");
const num = (v: unknown) => {
  if (typeof v === "number") return Number.isFinite(v) ? v : NaN;
  const t = typeof v === "string" ? v.replace(/[^\d.-]/g, "") : "";
  return t ? Number(t) : NaN;
};
const list = (v: unknown, n: number, max: number) => (Array.isArray(v) ? v.map((x) => str(x, max)).filter(Boolean).slice(0, n) : []);

/** The default length of each kind, in seconds, when a plan doesn't say or says something odd. */
const LENGTH: Record<SceneKind, number> = { title: 3, stat: 3.5, bars: 4.5, list: 4.5, quote: 4.5, compare: 5, photo: 3.5, cta: 3 };

/** Checks one scene: fields cut to their limits, numbers made real, a scene missing what it needs dropped. */
export function cleanScene(raw: unknown, photo: boolean): Scene | null {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const kind = SCENE_KINDS.includes(r.kind as SceneKind) ? (r.kind as SceneKind) : null;
  if (!kind) return null;
  const secs = num(r.seconds);
  const s: Scene = {
    kind,
    seconds: Number.isFinite(secs) && secs >= 1.5 && secs <= 8 ? Math.round(secs * 2) / 2 : LENGTH[kind],
    kicker: str(r.kicker, LIMITS.kicker),
    headline: str(r.headline, kind === "quote" ? LIMITS.quote : LIMITS.headline),
    sub: str(r.sub, LIMITS.sub),
    value: Number.isFinite(num(r.value)) ? num(r.value) : 0,
    prefix: str(r.prefix, LIMITS.prefix),
    suffix: str(r.suffix, LIMITS.suffix),
    decimals: Math.max(0, Math.min(2, Math.round(num(r.decimals) || 0))),
    items: list(r.items, kind === "bars" ? 6 : 5, kind === "bars" ? LIMITS.label : LIMITS.item),
    values: Array.isArray(r.values) ? r.values.map(num).filter((x) => Number.isFinite(x) && x >= 0).slice(0, 6) : [],
    right: list(r.right, 5, LIMITS.item),
    leftLabel: str(r.leftLabel, LIMITS.label),
    rightLabel: str(r.rightLabel, LIMITS.label),
    name: str(r.name, LIMITS.name),
    button: str(r.button, LIMITS.button),
  };
  if (kind === "stat" && !Number.isFinite(num(r.value))) return null;
  if (kind === "bars") {
    const n = Math.min(s.items.length, s.values.length);
    if (n < 2) return null;
    s.items = s.items.slice(0, n);
    s.values = s.values.slice(0, n);
  }
  if ((kind === "list" && s.items.length < 2) || (kind === "compare" && (s.items.length < 1 || s.right.length < 1))) return null;
  if ((kind === "title" || kind === "quote" || kind === "cta") && !s.headline) return null;
  if (kind === "photo" && !photo) return null;
  return s;
}

/** Checks Claude's whole plan: at most MAX_SCENES scenes and MAX_SECONDS seconds, at least one scene. */
export function cleanPlan(raw: unknown, photo: boolean): Scene[] {
  const r = (raw && typeof raw === "object" ? raw : {}) as { scenes?: unknown };
  const out: Scene[] = [];
  let total = 0;
  for (const x of Array.isArray(r.scenes) ? r.scenes : []) {
    const s = cleanScene(x, photo);
    if (!s) continue;
    if (out.length >= MAX_SCENES || total + s.seconds > MAX_SECONDS) break;
    out.push(s);
    total += s.seconds;
  }
  if (!out.length) throw new Error("The video plan came back empty. Try other words.");
  return out;
}

export const totalFrames = (scenes: Pick<Scene, "seconds">[]) => scenes.reduce((n, s) => n + Math.round(s.seconds * FPS), 0);

/** What the composition gets: the plan, the brand's colors and fonts, and the logo and photo as data URLs. */
export type MotionProps = {
  aspect: MotionAspect;
  scenes: Scene[];
  brandName: string;
  handle: string;
  logo: string | null;
  photo: string | null;
  colors: { bg: string; surface: string; ink: string; muted: string; line: string; accent: string; accentInk: string; accent2: string; accentText: string };
  fonts: { head: string; headFile: string; headWeight: number; headLs: string; body: string; bodyFile: string; bodyWeights: number[] };
  radius: number;
};

export function motionProps(style: BrandStyle, aspect: MotionAspect, scenes: Scene[], brandName: string, handle: string, photo: string | null): MotionProps {
  const head = FONTS[style.headFont];
  const body = FONTS[style.bodyFont];
  return {
    aspect,
    scenes,
    brandName,
    handle,
    logo: style.logo,
    photo,
    colors: { bg: style.bg, surface: style.surface, ink: style.ink, muted: style.muted, line: style.line, accent: style.accent, accentInk: style.accentInk, accent2: style.accent2, accentText: accentText(style) },
    fonts: { head: head.family, headFile: head.file, headWeight: style.headWeight, headLs: head.ls, body: body.family, bodyFile: body.file, bodyWeights: [...body.weights].filter((w) => w === 400 || w === 500 || w === 600 || w === 700).slice(0, 3) },
    radius: style.radius,
  };
}

// What Claude is told and the shape it answers in.

export const MOTION_SKILL = `You are CapyMotion, the motion designer inside Capybaroar, a social media scheduler. You plan a short animated video (6 to 30 seconds) for Reels, TikTok, Shorts, LinkedIn or X. Our Remotion scene kit animates your plan in the brand's colors and fonts: you write the scenes, the words, the numbers and the timing. You don't write code.

# Scene kinds (fields each one uses; leave the others empty)
- title: kicker (small line above), headline, sub. Opens a video or a section.
- stat: kicker, value (the number, it counts up), prefix ("$"), suffix ("%", "K", "x"), decimals, headline (what the number means), sub (the source).
- bars: headline, items (2 to 6 short labels), values (a number for each, same order). Bars grow; the biggest is picked out.
- list: headline, items (2 to 5 short points). Points appear one by one with checks.
- quote: headline (the quote, the person's own words), name (who said it, with their role).
- compare: headline, leftLabel and items (the old way), rightLabel and right (the new way).
- photo: headline (a caption) over the user's photo, slowly zooming. Only when the request says there is a photo.
- cta: headline (what to do), button (2 to 4 words like "Book a table"), sub (the website or handle).

# How to plan
- Hook in the first scene: the most surprising number or the boldest line. End with a cta when there's something to do.
- One idea per scene. Short words: a headline is 3 to 8 words, a list point 2 to 6.
- Timing: about 1 second per 3 words read, plus 1 second; title 2.5 to 3.5, stat 3 to 4, list and bars 4 to 5, cta 3. Total 8 to 20 seconds unless the user asks for more.
- 3 to 6 scenes is the sweet spot.

# Facts
- Use only facts from the request, the post or the brand: numbers, names, quotes, prices, results. Never invent a statistic, a customer, a quote or a source. When a scene needs a fact you weren't given, leave that scene out, or write a short [placeholder] and list it in "missing".
- Keep the user's own words when they give them.

# Your answer
- "scenes": the plan, in order. "alt": one plain sentence on what the video shows. "missing": the placeholders you used (empty when none).`;

export function motionPrompt(a: { prompt: string; aspect: MotionAspect; brandName: string; look: string; photo: boolean; handle: string }) {
  return [
    `# The brand\n${a.brandName}. Look: ${a.look}${a.handle ? `\nWebsite or handle: ${a.handle}` : ""}`,
    `# The video\n${a.aspect}, ${MOTION_CANVAS[a.aspect].w} by ${MOTION_CANVAS[a.aspect].h}. ${a.photo ? "The user gave a photo (a photo scene can use it)." : "No photo: don't use the photo scene."}`,
    `# Make this\n${a.prompt}`,
  ].join("\n\n");
}

export const planSchema = () => ({
  type: "object",
  additionalProperties: false,
  required: ["scenes", "alt", "missing"],
  properties: {
    alt: { type: "string" },
    missing: { type: "array", items: { type: "string" } },
    scenes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["kind", "seconds", "kicker", "headline", "sub", "value", "prefix", "suffix", "decimals", "items", "values", "right", "leftLabel", "rightLabel", "name", "button"],
        properties: {
          kind: { type: "string", enum: [...SCENE_KINDS] },
          seconds: { type: "number" },
          kicker: { type: "string" },
          headline: { type: "string" },
          sub: { type: "string" },
          value: { type: "number" },
          prefix: { type: "string" },
          suffix: { type: "string" },
          decimals: { type: "number" },
          items: { type: "array", items: { type: "string" } },
          values: { type: "array", items: { type: "number" } },
          right: { type: "array", items: { type: "string" } },
          leftLabel: { type: "string" },
          rightLabel: { type: "string" },
          name: { type: "string" },
          button: { type: "string" },
        },
      },
    },
  },
});

/** The library name of a made video: the first words of the request. */
export function motionFileName(prompt: string) {
  const words = prompt.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim().split(" ").filter(Boolean).slice(0, 6).join("-");
  return `${(words || "capymotion").slice(0, 60)}.mp4`;
}

/** A headline's font size: big when short, smaller as it grows, never under min. */
export function fitSize(text: string, ideal: number, min: number, shortLen = 12) {
  const n = Math.max(1, text.length);
  return Math.round(Math.max(min, n <= shortLen ? ideal : ideal * Math.sqrt(shortLen / n)));
}
