// AI formats, the pure half: reading what Claude writes for a thread, a poll or slides, and drawing a slide as SVG.
// No Supabase and no network, so tests run it as it is. The calls and the rendering are in composer.ts and slides.ts.

/** The first JSON object in Claude's answer (it may wrap it in a code fence). Throws when there is none. */
export function jsonOf(text: string): Record<string, unknown> {
  const s = text.indexOf("{");
  const e = text.lastIndexOf("}");
  if (s < 0 || e <= s) throw new Error("Claude didn't send a usable answer. Try again.");
  try {
    return JSON.parse(text.slice(s, e + 1)) as Record<string, unknown>;
  } catch {
    throw new Error("Claude didn't send a usable answer. Try again.");
  }
}

const strings = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").map((x) => x.trim()).filter(Boolean) : []);
const cut = (s: string, n: number) => ([...s].length > n ? [...s].slice(0, n - 1).join("").trimEnd() + "…" : s);

/** A thread of 2 to 10 posts, each within the network's limit. */
export function parseThread(o: Record<string, unknown>, limit: number): string[] {
  const posts = strings(o.posts).map((p) => cut(p, limit)).slice(0, 10);
  if (posts.length < 2) throw new Error("Claude wrote fewer than 2 posts. Add more to the text and try again.");
  return posts;
}

/** A poll: a question within the limit and 2 to 4 options of up to 25 characters. */
export function parsePoll(o: Record<string, unknown>, limit: number): { question: string; options: string[] } {
  const question = typeof o.question === "string" ? cut(o.question.trim(), limit) : "";
  const options = strings(o.options).map((x) => cut(x, 25)).slice(0, 4);
  if (!question || options.length < 2) throw new Error("Claude didn't write a usable poll. Try again.");
  return { question, options };
}

export type Slide = { title: string; body: string };

/** Slides for a carousel or a slideshow: between `min` and `max`, a short title and a short body each. */
export function parseSlides(o: Record<string, unknown>, min: number, max: number): Slide[] {
  const raw = Array.isArray(o.slides) ? o.slides : [];
  const slides = raw
    .map((s) => (s && typeof s === "object" ? (s as Record<string, unknown>) : {}))
    .map((s) => ({ title: typeof s.title === "string" ? cut(s.title.trim(), 80) : "", body: typeof s.body === "string" ? cut(s.body.trim(), 280) : "" }))
    .filter((s) => s.title || s.body)
    .slice(0, max);
  if (slides.length < min) throw new Error(`Claude wrote fewer than ${min} slides. Add more to the text and try again.`);
  return slides;
}

/** Words into lines of at most `max` characters; a word longer than a line is split. */
export function wrap(text: string, max: number): string[] {
  const lines: string[] = [];
  for (const para of text.split(/\n+/)) {
    let line = "";
    for (let word of para.split(/\s+/).filter(Boolean)) {
      while ([...word].length > max) {
        if (line) lines.push(line);
        lines.push([...word].slice(0, max).join(""));
        word = [...word].slice(max).join("");
        line = "";
      }
      const next = line ? `${line} ${word}` : word;
      if ([...next].length > max) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    if (line) lines.push(line);
  }
  return lines;
}

const xml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Slide colors for each brand color (brands.color): the accent bar and the slide number. */
export const ACCENTS: Record<string, string> = {
  gray: "#6B7280",
  violet: "#7C5CFC",
  green: "#0C8C5E",
  amber: "#E67E22",
  red: "#E5484D",
  turquoise: "#12A594",
  sky: "#0090FF",
  pink: "#D6409F",
  yellow: "#FFD202",
};

export type SlideLook = { width: number; height: number; brand: string; accent: string };
export const CAROUSEL: Omit<SlideLook, "brand" | "accent"> = { width: 1080, height: 1350 };
export const SLIDESHOW: Omit<SlideLook, "brand" | "accent"> = { width: 1080, height: 1920 };

/** One slide as SVG: the brand's name, the slide number, a big title, the body and an accent bar. Inter, black on white. */
export function slideSvg(s: Slide, n: number, total: number, look: SlideLook): string {
  const { width: w, height: h } = look;
  const pad = 96;
  const titleSize = n === 1 ? 92 : 76;
  const bodySize = 42;
  // Inter averages about 0.55em per character; lines are kept a little shorter than the width allows.
  const titleLines = wrap(s.title, Math.floor((w - pad * 2) / (titleSize * 0.56)));
  const bodyLines = wrap(s.body, Math.floor((w - pad * 2) / (bodySize * 0.52)));
  const titleH = titleLines.length * titleSize * 1.12;
  const bodyH = bodyLines.length * bodySize * 1.45;
  const top = Math.max(pad + 120, (h - titleH - 48 - bodyH) / 2);
  const title = titleLines.map((l, i) => `<text x="${pad}" y="${top + titleSize + i * titleSize * 1.12}" font-family="Inter" font-weight="700" font-size="${titleSize}" fill="#1A1A1A">${xml(l)}</text>`).join("");
  const body = bodyLines.map((l, i) => `<text x="${pad}" y="${top + titleH + 48 + bodySize + i * bodySize * 1.45}" font-family="Inter" font-weight="400" font-size="${bodySize}" fill="#4B5563">${xml(l)}</text>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<rect width="${w}" height="${h}" fill="#FFFFFF"/>
<text x="${pad}" y="${pad + 20}" font-family="Inter" font-weight="700" font-size="32" fill="#1A1A1A">${xml(look.brand)}</text>
<text x="${w - pad}" y="${pad + 20}" text-anchor="end" font-family="Inter" font-weight="700" font-size="32" fill="${look.accent}">${n}/${total}</text>
${title}${body}
<rect x="${pad}" y="${h - pad - 12}" width="${Math.round(((w - pad * 2) * n) / total)}" height="12" rx="6" fill="${look.accent}"/>
</svg>`;
}
