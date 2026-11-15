// CapyInfographic, the pure half: canvas sizes, the two models and their credits, which worked examples Claude sees,
// the prompt, the answer's shape, how Claude's HTML is cleaned before it renders, and the page it renders in. No fetch,
// Supabase or browser, so tests run it as it is (tests/capy.test.ts).

import { priceOf } from "../creditRules";
import { BASE_CSS, EXAMPLES, type Example } from "./examples";
import { HOST, styleCss, stylePrompt, type BrandStyle } from "./styleRules";
import { CHECK_SKILL, DESIGN_SKILL } from "./skills";

export type InfoAspect = "1:1" | "4:5" | "9:16" | "16:9";
export const INFO_ASPECTS: InfoAspect[] = ["1:1", "4:5", "9:16", "16:9"];
export const CANVAS: Record<InfoAspect, { w: number; h: number }> = {
  "1:1": { w: 1080, h: 1080 },
  "4:5": { w: 1080, h: 1350 },
  "9:16": { w: 1080, h: 1920 },
  "16:9": { w: 1280, h: 720 },
};

import { INFO_MODELS, type InfoModel } from "./infoModels";
export { INFO_MODELS, isInfoModel, type InfoModel } from "./infoModels";

export const infoCredits = (id: InfoModel) => priceOf(INFO_MODELS[id].cents);

// Which examples Claude sees: the two closest to the request (plus the list of every layout).
const HINTS: [RegExp, string[]][] = [
  [/\bcarousel|slides?\b|swipe/i, ["carousel-1-cover", "carousel-2-point"]],
  [/\bmyth/i, ["myth-fact"]],
  [/\bvs\.?\b|versus|compar|better than|instead of|before and after/i, ["compare"]],
  [/quote|review|testimonial|said|feedback|stars?\b/i, ["quote"]],
  [/hiring|job|vacanc|join (our|the) team|careers?/i, ["hiring"]],
  [/\b(sale|discount|offer|promo|deal|coupon|code)\b|% off|\boff\b/i, ["sale"]],
  [/webinar|workshop|event|live\b|meetup|conference|class\b/i, ["event-story"]],
  [/menu|price list|prices|services list/i, ["menu"]],
  [/launch|announc|introduc|new\b|drop\b|coming soon/i, ["launch-story"]],
  [/poll|vote|which (one|is)|this or that/i, ["vote-story"]],
  [/thumbnail|youtube/i, ["thumbnail"]],
  [/article|blog|link post|read more/i, ["link-banner"]],
  [/timeline|roadmap|history|milestone|week \d|plan for/i, ["timeline"]],
  [/matrix|priorit|effort|impact|quadrant/i, ["matrix"]],
  [/trend|over time|growth|monthly|per month|last \d+ (months|weeks|years)|revenue/i, ["line-chart"]],
  [/by day|by week|per day|ranking|chart|bar/i, ["bar-chart"]],
  [/share|split|breakdown|pie|donut|part of|out of every/i, ["donut"]],
  [/how to|steps?\b|guide|process|recipe/i, ["steps"]],
  [/tips|checklist|things to|ways to|mistakes|rules/i, ["checklist"]],
  [/in numbers|year in review|results|stats\b|key figures/i, ["stat-grid"]],
  [/\d+\s?%|\bpercent|statistic|\bstat\b|number/i, ["big-stat"]],
];

export function pickExamples(prompt: string, aspect: InfoAspect, photo: boolean, n = 2): Example[] {
  const want: string[] = [];
  for (const [re, slugs] of HINTS) if (re.test(prompt)) for (const s of slugs) if (!want.includes(s)) want.push(s);
  const size = `${CANVAS[aspect].w}x${CANVAS[aspect].h}`;
  const ok = (e: Example) => photo || !e.photo;
  const chosen = want.map((s) => EXAMPLES.find((e) => e.slug === s)).filter((e): e is Example => !!e && ok(e));
  // Fill up with layouts made for this size, then any.
  for (const e of [...EXAMPLES.filter((x) => x.size === size), ...EXAMPLES]) {
    if (chosen.length >= n) break;
    if (ok(e) && !chosen.includes(e)) chosen.push(e);
  }
  return chosen.slice(0, n);
}

/** The system prompt: the skill, the base CSS and every layout's name. The same for every request (cached). */
export function systemPrompt() {
  const list = EXAMPLES.map((e) => `- ${e.slug} (${e.size}${e.photo ? ", with a photo" : ""}): ${e.use}`).join("\n");
  return `${DESIGN_SKILL}\n\n# The base CSS (already on the page)\n${BASE_CSS}\n\n# Layouts in the library\n${list}`;
}

export type DesignAsk = { prompt: string; aspect: InfoAspect; brandName: string; style: BrandStyle; photo: boolean; handle?: string | null };

/** The request: the brand, the canvas, two worked examples and what to make. */
export function designPrompt(a: DesignAsk) {
  const { w, h } = CANVAS[a.aspect];
  const ex = pickExamples(a.prompt, a.aspect, a.photo)
    .map((e) => `## Example: ${e.slug} (${e.size}). ${e.use}\ncss:\n${e.css}\nbody:\n${e.body}`)
    .join("\n\n");
  return [
    `# The brand\n${stylePrompt(a.style, a.brandName)}${a.handle ? `\nWebsite or handle for the footer: ${a.handle}` : ""}`,
    `# The canvas\n${w} by ${h} px (${a.aspect}). ${a.photo ? "The user gave a photo: https://capy.local/photo." : "No photo: use type, shapes and SVG only."}`,
    `# Worked examples (learn the way they're built, then design for this request; don't copy their words)\n${ex}`,
    `# Make this\n${a.prompt}`,
  ].join("\n\n");
}

export const answerSchema = () => ({
  type: "object",
  additionalProperties: false,
  required: ["layout", "alt", "css", "body", "missing"],
  properties: {
    layout: { type: "string" },
    alt: { type: "string" },
    css: { type: "string" },
    body: { type: "string" },
    missing: { type: "array", items: { type: "string" } },
  },
});

export const checkSchema = () => ({
  type: "object",
  additionalProperties: false,
  required: ["ok", "problems", "css", "body"],
  properties: {
    ok: { type: "boolean" },
    problems: { type: "array", items: { type: "string" } },
    css: { type: "string", description: "The full fixed CSS, or empty when ok" },
    body: { type: "string", description: "The full fixed markup, or empty when ok" },
  },
});

export const checkSystem = () => `${CHECK_SKILL}\n\n${systemPrompt()}`;

export const MAX_CSS = 24000;
export const MAX_BODY = 40000;

const local = (u: string) => u.startsWith(`${HOST}/logo`) || u.startsWith(`${HOST}/photo`);

/** Takes out anything that could run or reach outside: scripts, frames, forms, event attributes, outside addresses,
 *  @import and url() that isn't ours. The render worker also blocks every request it doesn't serve itself. */
export function cleanDesign(css: unknown, body: unknown): { css: string; body: string } {
  let c = typeof css === "string" ? css.slice(0, MAX_CSS) : "";
  let b = typeof body === "string" ? body.slice(0, MAX_BODY) : "";
  b = b.replace(/<\s*(script|style|iframe|object|embed|noscript|template|form|textarea|select|video|audio|canvas|frame|frameset|applet)\b[\s\S]*?<\s*\/\s*\1\s*>/gi, "");
  b = b.replace(/<\s*\/?\s*(script|style|iframe|object|embed|link|meta|base|form|input|button|textarea|select|option|video|audio|source|track|canvas|frame|frameset|applet|html|head|body|main|noscript|template|portal)\b[^>]*>/gi, "");
  b = b.replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  b = b.replace(/\s(src|href|xlink:href|srcset|action|formaction|poster|background)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, (m, attr: string, v: string) => {
    const val = v.replace(/^["']|["']$/g, "").trim();
    if ((attr === "src" || attr === "href" || attr === "xlink:href") && (local(val) || /^#[\w-]+$/.test(val) || (attr === "src" && /^data:image\/(png|jpeg|webp|gif);base64,/i.test(val)))) return m;
    return "";
  });
  b = b.replace(/javascript:/gi, "");
  c = c.replace(/@import[^;]*;?/gi, "").replace(/expression\s*\(/gi, "").replace(/behavior\s*:/gi, "").replace(/-moz-binding/gi, "");
  c = c.replace(/url\(\s*(['"]?)([^'")]*)\1\s*\)/gi, (m, _q: string, u: string) => (local(u.trim()) || /^data:image\//i.test(u.trim()) || /^#/.test(u.trim()) ? m : "none"));
  c = c.replace(/<\/?style[^>]*>/gi, "");
  return { css: c, body: b };
}

/** The whole page that renders: brand variables and fonts, the base CSS, the design. The canvas size is fixed last so
 *  a design can't change it. */
export function pageHtml(style: BrandStyle, aspect: InfoAspect, design: { css: string; body: string }) {
  const { w, h } = CANVAS[aspect];
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
${styleCss(style, w, h)}
${BASE_CSS}
${design.css}
html,body{width:${w}px!important;height:${h}px!important;overflow:hidden!important;margin:0!important}
.canvas{width:${w}px!important;height:${h}px!important}
</style></head><body><main class="canvas">
${design.body}
</main></body></html>`;
}

/** The library name of a made picture: the first words of the request. */
export function infoFileName(prompt: string) {
  const words = prompt.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim().split(" ").filter(Boolean).slice(0, 6).join("-");
  return `${(words || "infographic").slice(0, 60)}.png`;
}
