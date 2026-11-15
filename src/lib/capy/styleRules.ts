// A brand's visual style for CapyInfographic, the pure half: what it holds, how a scan's answer is checked, the
// contrast fixes, and the CSS variables every design uses. Read from the brand's website (styleScan.ts), saved on
// brands.style (041), editable in the brand kit. No Supabase or fetch, so tests run it as it is.

export type FontId = keyof typeof FONTS;

/** The fonts we serve ourselves (public/capy-fonts, all OFL). A website's font is matched to the closest one. */
export const FONTS = {
  inter: { family: "Inter", file: "inter", weights: [400, 500, 600, 700, 800], kind: "sans", ls: "-0.035em", look: "neutral modern sans (Inter, Helvetica, Arial, SF, system fonts)" },
  poppins: { family: "Poppins", file: "poppins", weights: [400, 600, 700, 800], kind: "sans", ls: "-0.03em", look: "round geometric sans (Poppins, Circular, Gilroy, Avenir)" },
  montserrat: { family: "Montserrat", file: "montserrat", weights: [400, 600, 700, 800], kind: "sans", ls: "-0.025em", look: "wide geometric sans (Montserrat, Gotham, Proxima Nova)" },
  "dm-sans": { family: "DM Sans", file: "dm-sans", weights: [400, 500, 700], kind: "sans", ls: "-0.03em", look: "soft low-contrast sans (DM Sans, Roboto, Open Sans, Lato, Nunito)" },
  manrope: { family: "Manrope", file: "manrope", weights: [400, 600, 800], kind: "sans", ls: "-0.03em", look: "techy rounded sans (Manrope, Satoshi, General Sans, Plus Jakarta Sans)" },
  "space-grotesk": { family: "Space Grotesk", file: "space-grotesk", weights: [400, 500, 700], kind: "sans", ls: "-0.03em", look: "quirky grotesk for tech and finance (Space Grotesk, Neue Montreal, Suisse)" },
  "bricolage-grotesque": { family: "Bricolage Grotesque", file: "bricolage-grotesque", weights: [400, 600, 800], kind: "display", ls: "-0.035em", look: "playful chunky grotesk for food and lifestyle" },
  "archivo-black": { family: "Archivo Black", file: "archivo-black", weights: [400], kind: "display", ls: "-0.01em", look: "heavy condensed display for sport and loud brands (Anton, Bebas, Archivo Black)" },
  fraunces: { family: "Fraunces", file: "fraunces", weights: [400, 600, 700], kind: "serif", ls: "-0.02em", look: "warm soft serif for food, coffee and craft (Fraunces, Recoleta, Cooper)" },
  "dm-serif-display": { family: "DM Serif Display", file: "dm-serif-display", weights: [400], kind: "serif", ls: "-0.01em", look: "high-contrast editorial serif (DM Serif, Didot, Bodoni, Canela)" },
  "playfair-display": { family: "Playfair Display", file: "playfair-display", weights: [400, 700], kind: "serif", ls: "-0.015em", look: "classic elegant serif for luxury, fashion and beauty (Playfair, Cormorant)" },
  lora: { family: "Lora", file: "lora", weights: [400, 600, 700], kind: "serif", ls: "-0.01em", look: "calm book serif (Lora, Georgia, Merriweather, Source Serif)" },
} as const;
export const FONT_IDS = Object.keys(FONTS) as FontId[];

export type BrandStyle = {
  bg: string;
  surface: string;
  ink: string;
  muted: string;
  line: string;
  accent: string;
  accentInk: string;
  accent2: string;
  headFont: FontId;
  headWeight: number;
  bodyFont: FontId;
  /** Corner size in px, 0 for square brands. */
  radius: number;
  /** The logo as a data: URL (PNG, JPEG, WebP or SVG), drawn as a picture so nothing in it runs. */
  logo: string | null;
  /** A short description of the look, for Claude: "calm editorial, lots of white, thin lines". */
  look: string;
  /** The website it was read from. */
  source: string | null;
};

export const DEFAULT_STYLE: BrandStyle = {
  bg: "#FFFFFF",
  surface: "#F4F4F5",
  ink: "#18181B",
  muted: "#71717A",
  line: "#E4E4E7",
  accent: "#2563EB",
  accentInk: "#FFFFFF",
  accent2: "#F59E0B",
  headFont: "inter",
  headWeight: 800,
  bodyFont: "inter",
  radius: 20,
  logo: null,
  look: "Clean and modern, lots of white space.",
  source: null,
};

export const MAX_LOGO = 400 * 1024;
const LOGO = /^data:image\/(png|jpeg|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/;

/** #rgb or #rrggbb to #RRGGBB, or null. */
export function hex(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s);
  if (!m) return null;
  const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join("") : m[1];
  return `#${h.toUpperCase()}`;
}

const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
export const luminance = (h: string) => {
  const [r, g, b] = rgb(h).map(lin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
/** WCAG contrast ratio, 1 to 21. */
export function contrast(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
const best = (on: string, a = "#111111", b = "#FFFFFF") => (contrast(a, on) >= contrast(b, on) ? a : b);
/** Mixes two colors, t from 0 (a) to 1 (b). */
export function mix(a: string, b: string, t: number) {
  const [x, y] = [rgb(a), rgb(b)];
  return `#${x.map((c, i) => Math.round((c + (y[i] - c) * t) * 255).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

const fontOf = (v: unknown, fallback: FontId): FontId => (typeof v === "string" && v in FONTS ? (v as FontId) : fallback);
const nearest = (ws: readonly number[], w: number) => ws.reduce((p, c) => (Math.abs(c - w) < Math.abs(p - w) ? c : p), ws[0]);
const text = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

/** Checks a style from a scan, an edit or the database, and fixes what can't be read. Never throws. */
export function cleanStyle(raw: unknown): BrandStyle {
  const r = (raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {}) as Record<string, unknown>;
  const d = DEFAULT_STYLE;
  const bg = hex(r.bg) ?? d.bg;
  // A missing color comes from the default on the default background, and is worked out from the others otherwise.
  const same = bg === d.bg;
  let ink = hex(r.ink) ?? (same ? d.ink : best(bg));
  if (contrast(ink, bg) < 4.5) ink = best(bg);
  const surface = hex(r.surface) ?? (same ? d.surface : mix(bg, ink, 0.05));
  let muted = hex(r.muted) ?? (same ? d.muted : mix(ink, bg, 0.45));
  if (contrast(muted, bg) < 3) muted = mix(ink, bg, 0.4);
  const line = hex(r.line) ?? (same ? d.line : mix(bg, ink, 0.12));
  const accent = hex(r.accent) ?? d.accent;
  let accentInk = hex(r.accentInk) ?? (accent === d.accent ? d.accentInk : best(accent));
  if (contrast(accentInk, accent) < 4.5) accentInk = best(accent);
  const accent2 = hex(r.accent2) ?? (accent === d.accent ? d.accent2 : mix(accent, ink, 0.5));
  const headFont = fontOf(r.headFont, d.headFont);
  const bodyFont = fontOf(r.bodyFont, d.bodyFont);
  const headWeight = nearest(FONTS[headFont].weights, Number(r.headWeight) || d.headWeight);
  const rad = Number(r.radius);
  const radius = Number.isFinite(rad) ? Math.max(0, Math.min(48, Math.round(rad))) : d.radius;
  const logo = typeof r.logo === "string" && r.logo.length <= MAX_LOGO * 1.4 && LOGO.test(r.logo) ? r.logo : null;
  const source = typeof r.source === "string" && /^https?:\/\//.test(r.source) ? r.source.slice(0, 300) : null;
  return { bg, surface, ink, muted, line, accent, accentInk, accent2, headFont, headWeight, bodyFont, radius, logo, look: text(r.look, 300) || d.look, source };
}

/** The accent where it reads on the background as text, the ink where it doesn't (a yellow accent on white). */
export const accentText = (s: BrandStyle) => (contrast(s.accent, s.bg) >= 3 ? s.accent : s.ink);

/** The design host the render worker answers for: fonts, the logo and library pictures. Nothing else loads. */
export const HOST = "https://capy.local";

/** The CSS variables and fonts every design uses, for a canvas of w by h. */
export function styleCss(s: BrandStyle, w: number, h: number) {
  const fams = [...new Set([s.headFont, s.bodyFont, "inter" as FontId])];
  const faces = fams
    .flatMap((id) => FONTS[id].weights.map((wt) => `@font-face{font-family:'${FONTS[id].family}';font-weight:${wt};font-style:normal;font-display:block;src:url(${HOST}/fonts/${FONTS[id].file}-latin-${wt}-normal.woff2) format('woff2')}`))
    .join("\n");
  const at = accentText(s);
  const pad = Math.round(Math.min(w, h) * 0.074);
  const vars = [
    `--w:${w}px`, `--h:${h}px`, `--pad:${pad}px`,
    `--bg:${s.bg}`, `--surface:${s.surface}`, `--ink:${s.ink}`, `--muted:${s.muted}`, `--line:${s.line}`,
    `--accent:${s.accent}`, `--accent-ink:${s.accentInk}`, `--accent-2:${s.accent2}`, `--accent-text:${at}`, `--mark:${at === s.accent ? "transparent" : s.accent}`,
    `--head:'${FONTS[s.headFont].family}'`, `--head-w:${s.headWeight}`, `--head-ls:${FONTS[s.headFont].ls}`, `--body:'${FONTS[s.bodyFont].family}'`, `--radius:${s.radius}px`,
  ];
  return `:root{${vars.join(";")}}\n${faces}`;
}

/** The style for Claude in a few lines. */
export function stylePrompt(s: BrandStyle, brandName: string) {
  return [
    `Brand: ${brandName}`,
    `Look: ${s.look}`,
    `Colors: background ${s.bg}, cards ${s.surface}, text ${s.ink}, quiet text ${s.muted}, lines ${s.line}, accent ${s.accent} (text on it ${s.accentInk}), second accent ${s.accent2}.`,
    `Accent as text reads ${accentText(s) === s.accent ? "fine on the background" : "badly on the background, so --accent-text is the text color and the accent is for fills and marks"}.`,
    `Headings: ${FONTS[s.headFont].family} ${s.headWeight} (${FONTS[s.headFont].kind}). Body: ${FONTS[s.bodyFont].family}. Corners: ${s.radius}px.`,
    s.logo ? `Logo: <img class="logo" src="${HOST}/logo" alt=""> (a picture; size it with height, keep its shape).` : `No logo: write the brand name in the heading font as the brand mark.`,
  ].join("\n");
}

// What a website's page source says, before Claude reads it.

/** Colors used in CSS with how often, most used first; near-white and near-black kept, transparent ones dropped. */
export function cssColors(css: string, top = 24): { color: string; n: number }[] {
  const counts = new Map<string, number>();
  for (const m of css.matchAll(/#(?:[0-9a-f]{6}|[0-9a-f]{3})\b/gi)) {
    const h = hex(m[0]);
    if (h) counts.set(h, (counts.get(h) ?? 0) + 1);
  }
  for (const m of css.matchAll(/rgba?\(\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})(?:[\s,/]+([\d.]+%?))?\s*\)/gi)) {
    const a = m[4] ? (m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4])) : 1;
    if (a < 0.6) continue;
    const h = `#${[m[1], m[2], m[3]].map((x) => Math.min(255, +x).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
    counts.set(h, (counts.get(h) ?? 0) + 1);
  }
  return [...counts].map(([color, n]) => ({ color, n })).sort((a, b) => b.n - a.n).slice(0, top);
}

/** Font families named in CSS, most used first, without generic names. */
export function cssFonts(css: string, top = 8): string[] {
  const counts = new Map<string, number>();
  const generic = /^(sans-serif|serif|monospace|system-ui|-apple-system|blinkmacsystemfont|inherit|initial|ui-sans-serif|ui-serif|ui-monospace|segoe ui|apple color emoji|segoe ui emoji|noto color emoji|var\(.*)$/i;
  for (const m of css.matchAll(/font-family\s*:\s*([^;}]+)/gi)) {
    const first = m[1].split(",")[0].trim().replace(/^["']|["']$/g, "").replace(/!important/, "").trim();
    if (first && !generic.test(first)) counts.set(first, (counts.get(first) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1]).slice(0, top).map(([f]) => f);
}

/** CSS custom properties that look like brand colors or fonts (--primary, --brand-color, --font-heading). */
export function cssTokens(css: string, top = 30): string[] {
  const out = new Set<string>();
  for (const m of css.matchAll(/(--[\w-]*(?:primary|brand|accent|secondary|color|bg|background|text|foreground|font|heading|radius)[\w-]*)\s*:\s*([^;}]{1,80})/gi)) {
    out.add(`${m[1]}: ${m[2].trim()}`);
    if (out.size >= top) break;
  }
  return [...out];
}

/** The page's own declared theme color, if any. */
export const themeColor = (html: string) => hex(/<meta[^>]+name=["']theme-color["'][^>]*content=["']([^"']+)/i.exec(html)?.[1] ?? /<meta[^>]+content=["']([^"']+)["'][^>]*name=["']theme-color["']/i.exec(html)?.[1]);

/** Stylesheet links and logo candidates in a page, as absolute addresses on the open web. */
export function pageAssets(html: string, base: string) {
  const abs = (u: string) => {
    try {
      const x = new URL(u.replace(/&amp;/g, "&"), base);
      return /^https?:$/.test(x.protocol) ? x.href : null;
    } catch {
      return null;
    }
  };
  const sheets = [...html.matchAll(/<link[^>]+rel=["']?stylesheet["']?[^>]*>/gi)].map((m) => /href=["']([^"']+)["']/i.exec(m[0])?.[1]).filter((x): x is string => !!x).map(abs).filter((x): x is string => !!x);
  const logos: string[] = [];
  for (const m of html.matchAll(/<img[^>]+>/gi)) {
    if (/logo|brand/i.test(m[0])) {
      const src = /\ssrc=["']([^"']+)["']/i.exec(m[0])?.[1];
      const a = src && !src.startsWith("data:") ? abs(src) : null;
      if (a) logos.push(a);
    }
  }
  for (const m of html.matchAll(/<link[^>]+rel=["'](?:apple-touch-icon|icon|shortcut icon)["'][^>]*>/gi)) {
    const href = /href=["']([^"']+)["']/i.exec(m[0])?.[1];
    const a = href ? abs(href) : null;
    if (a) logos.push(a);
  }
  const og = /<meta[^>]+property=["']og:logo["'][^>]*content=["']([^"']+)/i.exec(html)?.[1];
  if (og && abs(og)) logos.unshift(abs(og)!);
  const host = (() => {
    try {
      return new URL(base).host;
    } catch {
      return "";
    }
  })();
  const pages = [...html.matchAll(/<a[^>]+href=["']([^"'#]+)["']/gi)]
    .map((m) => abs(m[1]))
    .filter((u): u is string => !!u && new URL(u).host === host && /\/(about|pricing|services|product|menu|work|features|team|story)/i.test(new URL(u).pathname));
  const inline = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join("\n") + "\n" + [...html.matchAll(/\sstyle=["']([^"']+)["']/gi)].map((m) => `x{${m[1]}}`).join("\n");
  return { sheets: [...new Set(sheets)].slice(0, 10), logos: [...new Set(logos)].slice(0, 6), pages: [...new Set(pages)].slice(0, 3), inline };
}
