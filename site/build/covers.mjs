// Blog covers: picture-only art in Capybaroar's calm style (docs/blog-covers.md has the rules). No words on the
// picture: the post's title sits on the page. Each post gets one scene from its type, drawn from fixed templates and
// filled from a small spec in covers.json, so a writer (or an agent) only picks the type, the networks, the tools
// and a photo. Everything random is seeded by the slug, so a cover only changes when its spec or this file does.
//
//   node site/build/covers.mjs            render every cover in covers.json
//   node site/build/covers.mjs <slug>     render one
//
// Writes site/public/img/blog/<slug>.webp (2400x1260, for the post and the blog list) and <slug>.jpg (1200x630,
// for og:image). Network and AI logos come from the homepage sprite; other tools from site/build/cover-logos.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const sharp = require("sharp");

const HERE = fileURLToPath(new URL(".", import.meta.url));
const PUB = join(HERE, "..", "public");
const OUT = join(PUB, "img", "blog");
const W = 1200;
const H = 630;

// ─── Brand ───────────────────────────────────────────────────────────────────────────────────────────────────────

const C = {
  canvas: "#fafafa", shell: "#f5f5f5", panel: "#ffffff", line: "#ebebeb", ink: "#171717", ink2: "#525252", gray: "#737373",
  sk: "#ececea", sk2: "#f3f3f1", skInk: "#d6d6d2",
  y: "#ffd202", yh: "#e6bd00", y1: "#fffced", y3: "#fff6c7", y6: "#fff2b1", yInk: "#262209",
  night: "#1c1b17", night2: "#2a2924", night3: "#36352f",
};

// Each network's own color, for its glow. Near-black marks get a white plate instead.
const NET = {
  instagram: "#FF0069", facebook: "#0866FF", tiktok: "#000000", linkedin: "#0A66C2", youtube: "#FF0000", x: "#000000",
  threads: "#000000", pinterest: "#E60023", bluesky: "#0085FF", mastodon: "#6364FF", discord: "#5865F2",
};
const AI = { claude: "#D97757", chatgpt: "#000000", cursor: "#000000" };
const TOOL = { "buffer.com": "#231F20", "hootsuite.com": "#143059", "sproutsocial.com": "#59CB59", "metricool.com": "#C8E000" };

// The homepage sprite carries every network and AI mark.
const index = readFileSync(join(PUB, "index.html"), "utf8");
const SPRITE = [...index.matchAll(/<symbol id="(?:n|a)-[a-z]+"[\s\S]*?<\/symbol>/g)].map((m) => m[0]).join("");
const MARK = readFileSync(join(PUB, "icon.svg"), "utf8").replace(/<title>.*?<\/title>/, "");
const dataUrl = (file, type) => `data:${type};base64,${readFileSync(file).toString("base64")}`;
const photo = (name) => dataUrl(join(PUB, "img", "food", `${name}.webp`), "image/webp");
const face = (name) => dataUrl(join(PUB, "img", "faces", `${name}.webp`), "image/webp");
const toolLogo = (dom) => dataUrl(join(HERE, "cover-logos", `${dom}.png`), "image/png");

// ─── Small helpers ───────────────────────────────────────────────────────────────────────────────────────────────

function hashOf(s) { let h = 2166136261; for (const ch of s) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; } return h; }
function rngFor(seed) {
  let a = hashOf(seed);
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const r1 = (n) => Math.round(n * 10) / 10;
const lum = (hex) => { const n = parseInt(hex.slice(1), 16); return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255; };
const box = (x, y, w, h, cls = "", inner = "", style = "") =>
  `<div class="${cls}" style="left:${r1(x)}px;top:${r1(y)}px;width:${r1(w)}px;height:${r1(h)}px;${style}">${inner}</div>`;

// A soft glow in a color, behind a thing. Dark colors glow white, as a quiet plate.
const glow = (cx, cy, r, color, o = 0.2) => {
  const white = lum(color) < 0.22;
  return box(cx - r, cy - r, r * 2, r * 2, "glow", "", `background:${white ? "#fff" : color};opacity:${white ? 0.9 : o}`);
};

// A logo on a raised white tile. kind: a network or AI name, a tool's domain, or "capybaroar".
function tile(cx, cy, s, kind, o = {}) {
  const x = cx - s / 2;
  const y = cy - s / 2;
  let out = "";
  if (o.glow) out += glow(cx, cy, s * 0.95, o.glowColor || colorOf(kind));
  if (kind === "capybaroar") return out + box(x, y, s, s, "tile mark", MARK, `border-radius:${r1(s * 0.27)}px`);
  if (kind.includes(".")) return out + box(x, y, s, s, "tile fill", `<img src="${toolLogo(kind)}" alt="">`, `border-radius:${r1(s * 0.24)}px`);
  const id = NET[kind] ? `n-${kind}` : `a-${kind}`;
  return out + box(x, y, s, s, "tile", `<svg viewBox="0 0 24 24" style="width:${o.pad ?? 54}%;height:${o.pad ?? 54}%"><use href="#${id}"/></svg>`, `border-radius:${r1(s * 0.24)}px`);
}
const colorOf = (kind) => (kind === "capybaroar" ? C.y : NET[kind] || AI[kind] || TOOL[kind] || "#d4d4d0");

// A small network badge, for the corner of a post or a face.
const badge = (x, y, s, net) => box(x, y, s, s, "badge", `<svg viewBox="0 0 24 24"><use href="#n-${net}"/></svg>`);

// The yellow check: a yellow fill with ink on it, never yellow on white alone.
const check = (cx, cy, r = 15) =>
  box(cx - r, cy - r, r * 2, r * 2, "check", `<svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>`);

// A skeleton bar (text stands in as bars: covers carry no words).
const bar = (x, y, w, h = 9, color = C.sk) => box(x, y, w, h, "sk", "", `background:${color};border-radius:${h / 2}px`);

// A number pill: numbers are allowed on a cover, words are not.
const pill = (x, y, text, o = {}) => box(x, y, o.w || 0, o.h || 34, `pill${o.y ? " on" : ""}`, (o.icon ? ICON[o.icon] : "") + `<b>${text}</b>`, o.w ? "" : "width:auto");

const ICON = {
  clock: `<svg viewBox="0 0 24 24" class="ic"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`,
  cal: `<svg viewBox="0 0 24 24" class="ic"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`,
  heart: `<svg viewBox="0 0 24 24" class="ic"><path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/></svg>`,
  swap: `<svg viewBox="0 0 24 24" class="ic"><path d="M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4"/></svg>`,
  send: `<svg viewBox="0 0 24 24" class="ic"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/></svg>`,
  spark: `<svg viewBox="0 0 24 24" class="ic"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/></svg>`,
  reply: `<svg viewBox="0 0 24 24" class="ic"><path d="M9 17 4 12l5-5"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>`,
};

// ─── The calendar field: Capybaroar's background ─────────────────────────────────────────────────────────────────
// Rounded day squares in weeks of seven, empty in the middle and filling in toward the edges, a few of them booked
// in yellow. kind: "paper" (most covers), "yolk" (soft yellow, for lists and guides) or "night" (news only).

function field(kind, rnd, o = {}) {
  const base = { paper: C.canvas, yolk: C.y1, night: C.night }[kind];
  const step = 30;
  const cell = 22;
  const gap = 12;
  const cols = 41;
  const rows = 22;
  const wide = (cols - 1) * step + Math.floor((cols - 1) / 7) * gap + cell;
  const ox = (W - wide) / 2;
  const oy = (H - ((rows - 1) * step + cell)) / 2;
  const cx = o.cx ?? W / 2;
  const cy = o.cy ?? H / 2;
  let out = `<rect width="${W}" height="${H}" fill="${base}"/>`;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const x = ox + i * step + Math.floor(i / 7) * gap;
      const y = oy + j * step;
      const dx = (x + cell / 2 - cx) / (W * (o.rx ?? 0.5));
      const dy = (y + cell / 2 - cy) / (H * (o.ry ?? 0.56));
      const e = Math.min(1, Math.max(0, (Math.sqrt(dx * dx + dy * dy) - 0.6) / 0.5));
      if (rnd() > e * 0.92) continue;
      const pick = rnd();
      let fill;
      let a;
      if (kind === "night") {
        fill = pick < 0.05 * e ? C.y : pick < 0.55 ? C.night2 : C.night3;
        a = fill === C.y ? 0.9 : 0.6 + rnd() * 0.4;
      } else if (kind === "yolk") {
        fill = pick < 0.08 * e ? C.y : pick < 0.55 ? C.y3 : C.y6;
        a = 0.45 + rnd() * 0.55 * e;
      } else {
        fill = pick < 0.06 * e ? C.y : pick < 0.2 * e ? C.y3 : "#ececea";
        a = fill === C.y ? 0.85 : 0.35 + rnd() * 0.65 * e;
      }
      out += `<rect x="${r1(x)}" y="${r1(y)}" width="${cell}" height="${cell}" rx="6" fill="${fill}" fill-opacity="${r1(a * 100) / 100}"/>`;
    }
  }
  return `<svg class="field" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${out}</svg>`;
}

// ─── Parts ───────────────────────────────────────────────────────────────────────────────────────────────────────

// A product window with three dots and an address bar.
const win = (x, y, w, h, inner = "") =>
  box(x, y, w, h, "card big win", `<div class="bar3"><i></i><i></i><i></i><span></span></div>${inner}`);

// A phone with a post on it: avatar, name bars, the photo, actions and a caption.
function phone(x, y, w, h, o) {
  const ph = w - 20;
  const inner =
    box(16, 18, 30, 30, "av", `<img src="${face(o.face || "maya")}" alt="">`) +
    bar(54, 24, 90, 8, C.skInk) + bar(54, 37, 56, 7) +
    box(10, 60, ph, ph * (o.tall ? 1.25 : 1), "ph", `<img src="${photo(o.photo || "croissant")}" alt="">`) +
    `<div class="acts" style="top:${r1(70 + ph * (o.tall ? 1.25 : 1))}px">${ICON.heart}${ICON.reply}${ICON.send}</div>` +
    bar(16, 104 + ph * (o.tall ? 1.25 : 1), w - 70, 8, C.skInk) + bar(16, 118 + ph * (o.tall ? 1.25 : 1), w - 100, 7);
  return box(x, y, w, h, "card big phone", inner);
}

// A small post card for calendars and stacks: a photo, a network badge and a bar.
function post(x, y, w, net, img, o = {}) {
  const h = o.h || w * 1.08;
  const inner = box(6, 6, w - 12, h - 34, "ph", `<img src="${photo(img)}" alt="">`) + bar(8, h - 21, w * 0.55, 7, C.skInk) + badge(w - 26, h - 27, 20, net);
  return box(x, y, w, h, `card post${o.on ? " picked" : ""}`, inner, o.rot ? `transform:rotate(${o.rot}deg)` : "");
}

// ─── Scenes ──────────────────────────────────────────────────────────────────────────────────────────────────────

// How to post on one network: the network's mark, a phone with the post, and the time it's booked for.
function channel(s, rnd) {
  const n = s.network;
  let out = "";
  const tall = n === "instagram" || n === "tiktok" || n === "threads";
  const ph = 240 * (tall ? 1.25 : 1);
  const top = (H - (ph + 150)) / 2;
  out += phone(450, top, 260, ph + 150, { photo: s.photo, face: s.face, tall });
  out += tile(400, top + 80, 128, n, { glow: true });
  // The booking card: a week, one day picked, a time.
  const days = [12, 13, 14, 15, 16, 17, 18];
  const pickAt = 2 + Math.floor(rnd() * 3);
  let week = "";
  days.forEach((d, i) => { week += box(16 + i * 34, 16, 28, 34, `day${i === pickAt ? " on" : ""}`, `<b>${d}</b>`); });
  out += box(700, 316, 274, 128, "card big", week + pill(16, 70, "9:00", { icon: "clock" }) + pill(108, 70, "30", { icon: "cal" }));
  out += check(974, 316, 17);
  out += tile(740, 256, 64, "capybaroar");
  return { bg: "paper", html: out };
}

// The best time to post: a week of hours, warmer where people are online, one best slot.
function time(s, rnd) {
  const n = s.network;
  let cells = "";
  const cols = 7;
  const rows = 6;
  const best = [1 + Math.floor(rnd() * 4), 1 + Math.floor(rnd() * 3)];
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const peak = Math.exp(-((i - best[0]) ** 2) / 6 - ((j - best[1]) ** 2) / 4);
      const v = Math.min(1, peak * 0.9 + rnd() * 0.25);
      const fill = i === best[0] && j === best[1] ? C.y : v > 0.66 ? C.y6 : v > 0.4 ? C.y3 : v > 0.2 ? C.y1 : C.sk2;
      cells += box(28 + i * 74, 70 + j * 52, 64, 42, "hm", "", `background:${fill}`);
    }
  }
  for (let i = 0; i < cols; i++) cells += bar(28 + i * 74 + 16, 42, 32, 8, C.skInk);
  let out = win(330, 130, 572, 400, cells);
  const bx = 330 + 28 + best[0] * 74;
  const by = 130 + 70 + best[1] * 52;
  out += box(bx - 4, by - 4, 72, 50, "ring", "");
  out += pill(bx + 30, by - 52, "9:00", { icon: "clock", y: true });
  out += tile(316, 150, 116, n, { glow: true });
  out += check(bx + 64, by - 2, 13);
  return { bg: "paper", html: out };
}

// Sizes: the formats a network takes, side by side, the best one picked, with their pixel sizes.
function size(s) {
  const n = s.network;
  const fmts = s.formats || [["1080", "1080"], ["1080", "1350"], ["1080", "1920"]];
  const hMax = 330;
  const ws = fmts.map(([w, h]) => (hMax * Number(w)) / Number(h));
  const gap = 46;
  const total = ws.reduce((a, b) => a + b, 0) + gap * (fmts.length - 1);
  let x = 600 - total / 2;
  const pick = s.pick ?? 1;
  const pics = s.photos || ["loaf", "croissant", "coffee"];
  let out = "";
  fmts.forEach(([w, h], i) => {
    const fh = (ws[i] * Number(h)) / Number(w);
    const y = 140 + (hMax - fh);
    out += box(x, y, ws[i], fh, `card frame${i === pick ? " picked" : ""}`, `<img src="${photo(pics[i % pics.length])}" alt="">`);
    // Rulers: one across the top, one down the side.
    out += box(x, y - 22, ws[i], 10, "rule h", "");
    out += box(x - 22, y, 10, fh, "rule v", "");
    const label = `${w} × ${h}`;
    out += pill(x + ws[i] / 2 - 58, 140 + hMax + 24, label, { w: 116, y: i === pick });
    if (i === pick) out += check(x + ws[i], y, 16);
    x += ws[i] + gap;
  });
  out += tile(Math.max(150, 600 - total / 2 - 40), 112, 96, n, { glow: true });
  return { bg: "paper", html: out };
}

// A plan for the week: a calendar window with posts in it, one being dragged into place.
function calendar(s, rnd) {
  const nets = s.networks || ["instagram", "linkedin", "tiktok", "youtube", "facebook"];
  const pics = ["croissant", "loaf", "coffee", "rack", "shelf", "shape"];
  let inner = "";
  for (let i = 0; i < 7; i++) {
    inner += bar(24 + i * 104 + 30, 62, 40, 8, C.skInk);
    inner += box(24 + i * 104, 82, 96, 300, "col", "");
  }
  const slots = [[0, 0], [1, 1], [2, 0], [3, 1], [4, 0], [5, 1], [6, 0], [1, 0], [4, 1]].slice(0, 7 + Math.floor(rnd() * 2));
  const empty = 2 + Math.floor(rnd() * 3);
  slots.forEach(([d, r], k) => {
    if (d === empty && r === 1) return;
    inner += post(24 + d * 104 + 8, 92 + r * 146, 80, nets[k % nets.length], pics[(k * 5) % pics.length], { h: 132 });
  });
  let out = win(222, 96, 756, 420, inner);
  // The post on its way in, picked.
  const dx = 222 + 24 + empty * 104 + 8;
  out += box(dx - 2, 96 + 92 + 146 - 2, 84, 136, "slot", "");
  out += post(dx + 46, 96 + 92 + 146 + 66, 96, nets[0], "rack", { h: 150, on: true, rot: -6 });
  out += box(dx + 132, 96 + 92 + 146 + 186, 26, 26, "cursor", `<svg viewBox="0 0 24 24"><path d="M5 3.5 19 11l-6.2 1.6L10 19z"/></svg>`);
  out += tile(222 + 756 - 6, 96 + 6, 76, "capybaroar");
  return { bg: "paper", html: out };
}

// Write from your AI: a chat in Claude or ChatGPT on the left, booked posts on the right.
function agent(s) {
  const ai = s.ai || "claude";
  const nets = s.networks || ["instagram", "linkedin", "tiktok"];
  let chat = "";
  chat += box(150, 70, 230, 64, "bub me", bar(18, 18, 170, 8, "#cfcfca") + bar(18, 34, 120, 8, "#cfcfca"));
  chat += box(24, 156, 34, 34, "tile sm", `<svg viewBox="0 0 24 24"><use href="#a-${ai}"/></svg>`);
  chat += box(70, 156, 300, 120, "bub", bar(18, 20, 240, 8, C.skInk) + bar(18, 38, 200, 8) + bar(18, 56, 226, 8) + bar(18, 74, 150, 8) + box(18, 92, 70, 14, "chip", ""));
  chat += box(24, 300, 356, 50, "input", bar(18, 20, 140, 8) + box(312, 9, 32, 32, "send", ICON.send));
  let out = win(150, 120, 404, 380, chat);
  out += tile(150 + 6, 120 + 6, 88, ai, { glow: true });
  // The flow from the chat to the calendar.
  out += `<svg class="flow" width="${W}" height="${H}"><path d="M560 315 C 620 315, 640 230, 700 230 M560 315 C 630 315, 630 330, 700 330 M560 315 C 620 315, 640 430, 700 430" /></svg>`;
  out += box(548, 303, 24, 24, "node", "");
  const pics = ["croissant", "coffee", "loaf"];
  nets.slice(0, 3).forEach((n, i) => {
    const y = 186 + i * 100;
    out += box(700, y, 330, 88, "card row", box(10, 10, 68, 68, "ph", `<img src="${photo(pics[i])}" alt="">`) + bar(94, 22, 150, 9, C.skInk) + bar(94, 40, 110, 8) + pill(94, 54, ["9:00", "12:30", "18:00"][i], { icon: "clock", h: 24 }) + badge(290, 14, 26, n));
    out += check(1030, y + 2, 13);
  });
  out += tile(736, 140, 64, "capybaroar");
  return { bg: "paper", html: out };
}

// Two tools face to face, Capybaroar on the left, with their channels lined up below.
function versus(s, rnd) {
  const a = "capybaroar";
  const b = s.vs;
  let out = "";
  out += `<svg class="flow dim" width="${W}" height="${H}"><path d="M600 70 V 560"/></svg>`;
  out += tile(360, 225, 172, a, { glow: true });
  out += tile(840, 225, 172, b, { glow: true });
  out += box(564, 189, 72, 72, "swap", ICON.swap);
  const nets = ["instagram", "tiktok", "linkedin", "youtube", "threads"];
  for (let i = 0; i < 5; i++) {
    const y = 382 + i * 34;
    const la = 120 + rnd() * 160;
    const lb = 80 + rnd() * 150;
    out += bar(600 - 34 - la, y, la, 14, C.y);
    out += bar(634, y, lb, 14, colorOf(b));
    out += box(588, y - 5, 24, 24, "badge sm", `<svg viewBox="0 0 24 24"><use href="#n-${nets[i]}"/></svg>`);
  }
  return { bg: "paper", html: out };
}

// Alternatives: the tool sits in the middle, the others circle it, and a yellow path leads to Capybaroar.
function alternatives(s, rnd) {
  const cx = 600;
  const cy = 315;
  const R = [150, 236, 322];
  let out = `<svg class="rings" width="${W}" height="${H}"><circle cx="${cx}" cy="${cy}" r="${R[0]}"/><circle cx="${cx}" cy="${cy}" r="${R[1]}" class="dash"/><circle cx="${cx}" cy="${cy}" r="${R[2]}"/>`;
  const at = -40 + Math.floor(rnd() * 16);
  const p = (r, d) => [cx + r * Math.cos((d * Math.PI) / 180), cy + r * Math.sin((d * Math.PI) / 180)];
  const [sx, sy] = p(R[0], at - 75);
  const [ex, ey] = p(R[0], at);
  out += `<path class="path" d="M${r1(sx)} ${r1(sy)} A${R[0]} ${R[0]} 0 0 1 ${r1(ex)} ${r1(ey)}"/></svg>`;
  out += box(sx - 7, sy - 7, 14, 14, "node sm", "");
  const others = (s.others || []).concat(["instagram", "tiktok", "linkedin", "youtube", "pinterest", "bluesky"]);
  const slots = [[R[0], at + 110, 78], [R[0], at + 200, 78], [R[1], at + 30, 70], [R[1], at + 155, 70], [R[1], at + 250, 70], [R[2], 192, 62], [R[2], -12, 62], [R[2], 168, 62], [R[2], 12, 62]];
  slots.forEach(([r, d, sz], i) => {
    const k = others[i];
    if (!k) return;
    const [x, y] = p(r, d);
    if (y < 30 || y > H - 30) return;
    out += tile(x, y, sz, k);
  });
  out += tile(cx, cy, 150, s.subject, { glow: true });
  out += tile(ex, ey, 104, "capybaroar", { glow: true });
  out += check(ex + 44, ey - 44, 15);
  return { bg: "paper", html: out };
}

// The best tools: a ranked list in a window, Capybaroar on top, picked.
function list(s) {
  const tools = ["capybaroar"].concat(s.tools || []);
  let inner = "";
  tools.slice(0, 6).forEach((t, i) => {
    const y = 60 + i * 62;
    if (i === 0) inner += box(12, y - 6, 556, 56, "rowon", "");
    inner += box(26, y + 15, 22, 22, `rank${i === 0 ? " on" : ""}`, `<b>${i + 1}</b>`);
    inner += tile(86, y + 22, 40, t);
    inner += bar(122, y + 12, 150 + ((i * 37) % 70), 9, C.skInk) + bar(122, y + 28, 100 + ((i * 53) % 60), 7);
    const stars = [5, 4, 4, 4, 3, 3][i];
    for (let k = 0; k < 5; k++) inner += box(430 + k * 22, y + 15, 16, 16, `star${k < stars ? " on" : ""}`, "");
  });
  let out = win(170, 125, 580, 400, inner);
  out += check(170 + 568, 125 + 60 + 22, 14);
  if (s.network) out += tile(176, 128, 92, s.network, { glow: true });
  // Two cards on the right: a booked week and a reach chart.
  let wk = "";
  for (let i = 0; i < 7; i++) wk += box(16 + i * 30, 46, 24, 24, `day sm${[1, 3, 4].includes(i) ? " on" : ""}`, "");
  out += box(800, 165, 240, 92, "card big", bar(16, 20, 110, 9, C.skInk) + wk);
  let ch = "";
  [38, 54, 46, 72, 64, 96].forEach((v, i) => { ch += box(20 + i * 34, 140 - v, 22, v, `col2${i === 5 ? " on" : ""}`, ""); });
  out += box(800, 285, 240, 160, "card big", bar(16, 20, 90, 9, C.skInk) + ch);
  return { bg: s.bg || "yolk", html: out };
}

// One inbox: comments from every network, one reply drafted and ready.
function inbox(s) {
  const nets = s.networks || ["instagram", "facebook", "youtube", "tiktok"];
  const faces = ["ana", "jon", "rae", "sam", "tom"];
  let inner = "";
  nets.slice(0, 4).forEach((n, i) => {
    const y = 60 + i * 84;
    if (i === 1) inner += box(10, y - 8, 440, 78, "rowon", "");
    inner += box(24, y, 44, 44, "av", `<img src="${face(faces[i])}" alt="">`) + badge(52, y + 28, 20, n);
    inner += bar(84, y + 6, 120, 9, C.skInk) + bar(84, y + 24, 230 - i * 20, 8) + bar(84, y + 40, 170 - i * 10, 8);
  });
  let out = win(200, 115, 460, 400, inner);
  // The reply, ready to send.
  const rep = box(18, 18, 36, 36, "tile mark sm", MARK) + bar(66, 22, 190, 9, C.skInk) + bar(66, 40, 150, 8) + bar(18, 74, 300, 8) + bar(18, 92, 260, 8) + bar(18, 110, 200, 8) + box(232, 136, 112, 36, "btn", ICON.send);
  out += box(700, 210, 362, 190, "card big", rep);
  out += `<svg class="flow" width="${W}" height="${H}"><path d="M652 276 C 676 276, 676 250, 700 250"/></svg>`;
  out += check(1062, 210, 15);
  return { bg: "paper", html: out };
}

// Results: reach over time with the best post marked, and two numbers.
function analytics(s, rnd) {
  const nets = s.networks || ["instagram", "tiktok", "linkedin"];
  let inner = "";
  const n = 14;
  const best = 9 + Math.floor(rnd() * 3);
  for (let i = 0; i < n; i++) {
    const v = 60 + Math.sin(i / 2.2) * 30 + i * 9 + rnd() * 30 + (i === best ? 70 : 0);
    inner += box(28 + i * 38, 330 - v, 26, v, `col2${i === best ? " on" : ""}`, "");
  }
  inner += box(28, 334, 532, 1, "", "", `background:${C.line}`);
  let out = win(170, 110, 590, 400, inner);
  const bx = 170 + 28 + best * 38;
  out += post(bx - 30, 110 + 34, 86, nets[0], "croissant", { h: 104, on: true });
  out += box(800, 150, 230, 112, "card big", bar(18, 20, 90, 9, C.skInk) + box(18, 46, 0, 0, "num", "<b>12.4k</b>") + box(150, 50, 60, 26, "up", "<b>+38%</b>"));
  let netRow = "";
  nets.slice(0, 3).forEach((k, i) => { netRow += badge(18 + i * 34, 58, 26, k); });
  out += box(800, 290, 230, 112, "card big", bar(18, 20, 110, 9, C.skInk) + netRow + bar(130, 66, 70, 9, C.y));
  return { bg: "paper", html: out };
}

// News: Capybaroar's mark on the night field, with the new thing next to it.
function news(s) {
  let out = "";
  out += tile(600, 300, 190, "capybaroar", { glow: true, glowColor: C.y });
  if (s.network) {
    out += tile(760, 190, 92, s.network);
  }
  out += box(330, 360, 150, 190, "card post dark", box(8, 8, 134, 140, "ph", `<img src="${photo(s.photo || "coffee")}" alt="">`) + bar(12, 160, 80, 8, "#4a4943"));
  out += box(730, 380, 170, 74, "card dark", pill(14, 20, "9:00", { icon: "clock", y: true }));
  return { bg: "night", html: out };
}

const SCENES = { channel, time, size, calendar, agent, versus, alternatives, list, inbox, analytics, news };

// ─── The page ────────────────────────────────────────────────────────────────────────────────────────────────────

const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${W}px;height:${H}px;overflow:hidden;background:${C.canvas}}
body{font-family:Inter,system-ui,sans-serif;color:${C.ink};-webkit-font-smoothing:antialiased}
#c{position:relative;width:${W}px;height:${H}px;overflow:hidden}
#c div{position:absolute}
.field,.flow,.rings{position:absolute;left:0;top:0}
.glow{border-radius:50%;filter:blur(46px)}
.card{background:#fff;border-radius:12px;box-shadow:0 0 0 1px rgba(0,0,0,.06),0 1px 1px -.5px rgba(0,0,0,.04),0 6px 6px -3px rgba(0,0,0,.04),0 12px 12px -6px rgba(0,0,0,.03),0 24px 48px -20px rgba(0,0,0,.14)}
.card.big{border-radius:16px}
.card.dark{background:${C.night2};box-shadow:0 0 0 1px rgba(255,255,255,.07),0 24px 48px -20px rgba(0,0,0,.6)}
.win{overflow:hidden}
.bar3{position:absolute;left:0;top:0;right:0;height:40px;border-bottom:1px solid ${C.line};display:flex;align-items:center;gap:7px;padding:0 16px}
.bar3 i{width:10px;height:10px;border-radius:50%;background:#e2e2de}
.bar3 span{position:absolute;left:50%;top:11px;width:180px;height:18px;margin-left:-90px;border-radius:9px;background:${C.shell}}
.tile{display:grid;place-items:center;background:#fff;box-shadow:0 0 0 1px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.05),0 18px 36px -14px rgba(0,0,0,.2);overflow:hidden}
.tile.fill img{width:100%;height:100%;object-fit:cover}
.tile.mark{background:${C.yInk};box-shadow:0 0 0 1px rgba(0,0,0,.2),0 18px 36px -14px rgba(0,0,0,.35)}
.tile.mark svg{width:100%;height:100%}
.tile.sm{border-radius:10px}
.tile.sm svg,.tile.sm .ic{width:60%;height:60%}
.tile.mark.sm svg{width:100%;height:100%}
.badge{display:grid;place-items:center;border-radius:50%;background:#fff;box-shadow:0 0 0 1px rgba(0,0,0,.08),0 1px 2px rgba(0,0,0,.1)}
.badge svg{width:62%;height:62%}
.badge.sm{width:24px;height:24px}
.check{display:grid;place-items:center;border-radius:50%;background:${C.y};box-shadow:0 0 0 3px #fff,0 0 0 4px rgba(0,0,0,.06),0 6px 14px -4px rgba(0,0,0,.25)}
.check svg{width:58%;height:58%;fill:none;stroke:${C.yInk};stroke-width:3.2;stroke-linecap:round;stroke-linejoin:round}
.ic{fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
.pill{position:absolute;display:inline-flex;align-items:center;justify-content:center;gap:6px;height:34px;padding:0 14px;border-radius:999px;background:#fff;color:${C.ink};box-shadow:0 1px 2px rgba(0,0,0,.1),0 0 0 1px rgba(0,0,0,.08);font-size:15px;font-weight:600;font-variant-numeric:tabular-nums;letter-spacing:-.01em;white-space:nowrap}
.pill .ic{width:16px;height:16px;color:${C.ink2}}
.pill.on{background:${C.y};color:${C.yInk};box-shadow:0 0 0 1px ${C.yh},0 6px 14px -6px rgba(0,0,0,.3)}
.pill.on .ic{color:${C.yInk}}
.ph{overflow:hidden;border-radius:10px;background:${C.shell}}
.ph img,.frame img,.av img{width:100%;height:100%;object-fit:cover;display:block}
.av{border-radius:50%;overflow:hidden;box-shadow:0 0 0 2px #fff}
.phone{border-radius:34px;overflow:hidden}
.acts{position:absolute;left:16px;display:flex;gap:14px;color:${C.ink}}
.acts .ic{width:20px;height:20px}
.day{display:grid;place-items:center;border-radius:8px;background:${C.shell};font-size:13px;font-weight:600;color:${C.ink2};font-variant-numeric:tabular-nums}
.day.on{background:${C.y};color:${C.yInk}}
.day.sm.on{background:${C.y3}}
.post{overflow:hidden}
.post.picked{box-shadow:0 0 0 2px ${C.y},0 0 0 5px rgba(255,210,2,.3),0 30px 50px -18px rgba(0,0,0,.35)}
.post.dark{background:${C.night2}}
.col{border-radius:10px;background:${C.canvas}}
.slot{border-radius:12px;border:2px dashed #d9d9d4}
.cursor svg{width:26px;height:26px;fill:${C.ink};stroke:#fff;stroke-width:1.5;stroke-linejoin:round}
.hm{border-radius:8px}
.ring{border-radius:12px;box-shadow:0 0 0 2px ${C.yh}}
.frame{overflow:hidden;border-radius:12px}
.frame.picked{box-shadow:0 0 0 3px ${C.y},0 0 0 7px rgba(255,210,2,.28),0 30px 50px -20px rgba(0,0,0,.3)}
.rule{border-color:#cfcfca;border-style:solid;border-width:0}
.rule.h{border-left-width:1.5px;border-right-width:1.5px;background:linear-gradient(#cfcfca,#cfcfca) center/100% 1.5px no-repeat}
.rule.v{border-top-width:1.5px;border-bottom-width:1.5px;background:linear-gradient(#cfcfca,#cfcfca) center/1.5px 100% no-repeat}
.bub{border-radius:14px;background:${C.canvas};box-shadow:0 0 0 1px ${C.line}}
.bub.me{background:${C.shell};box-shadow:none}
.chip{border-radius:7px;background:${C.y3}}
.input{border-radius:14px;box-shadow:0 0 0 1px rgba(0,0,0,.1),0 1px 2px rgba(0,0,0,.06)}
.send{display:grid;place-items:center;border-radius:50%;background:#333;color:#fff}
.send .ic{width:16px;height:16px}
.flow path{fill:none;stroke:${C.yh};stroke-width:2.5;stroke-linecap:round;stroke-dasharray:1 8}
.flow.dim path{stroke:${C.ink};stroke-opacity:.12;stroke-width:1.5;stroke-dasharray:2 9}
.node{border-radius:50%;background:${C.y};box-shadow:0 0 0 4px #fff,0 0 0 5px rgba(0,0,0,.06)}
.row{overflow:hidden}
.swap{display:grid;place-items:center;border-radius:50%;background:#fff;box-shadow:0 0 0 1px rgba(0,0,0,.06),0 12px 24px -10px rgba(0,0,0,.25);color:${C.ink}}
.swap .ic{width:28px;height:28px}
.rings circle{fill:none;stroke:${C.ink};stroke-opacity:.08;stroke-width:1.5}
.rings circle.dash{stroke-dasharray:2 9;stroke-linecap:round;stroke-opacity:.12}
.rings .path{fill:none;stroke:${C.y};stroke-width:4;stroke-linecap:round}
.rowon{border-radius:10px;background:${C.y1};box-shadow:0 0 0 1px ${C.y6}}
.rank{display:grid;place-items:center;border-radius:6px;background:${C.shell};font-size:12px;font-weight:600;color:${C.ink2}}
.rank.on{background:${C.y};color:${C.yInk}}
.star{border-radius:4px;background:${C.sk}}
.star.on{background:${C.y}}
.col2{border-radius:6px 6px 3px 3px;background:#e6e6e2}
.col2.on{background:${C.y}}
.btn{display:grid;place-items:center;border-radius:999px;background:#333;color:#fff;box-shadow:0 0 0 1px rgba(0,0,0,.8),0 1px 3px rgba(0,0,0,.4)}
.btn .ic{width:18px;height:18px}
.num{font-size:34px;font-weight:600;letter-spacing:-.03em;line-height:1;white-space:nowrap}
.up{display:grid;place-items:center;border-radius:6px;background:${C.y3};color:${C.yInk};font-size:13px;font-weight:600}
`;

function pageFor(spec) {
  const scene = SCENES[spec.type];
  if (!scene) throw new Error(`${spec.slug}: unknown type "${spec.type}" (one of ${Object.keys(SCENES).join(", ")})`);
  const rnd = rngFor(spec.slug);
  const { bg, html } = scene(spec, rnd);
  return `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${SPRITE}</defs></svg>
<div id="c">${field(bg, rngFor(spec.slug + ":field"))}${html}</div></body></html>`;
}

// ─── Render ──────────────────────────────────────────────────────────────────────────────────────────────────────

export async function render(specs) {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
  for (const spec of specs) {
    await page.setContent(pageFor(spec), { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    const png = await page.locator("#c").screenshot({ type: "png" });
    await sharp(png).webp({ quality: 86 }).toFile(join(OUT, `${spec.slug}.webp`));
    await sharp(png).resize(W, H).jpeg({ quality: 86, mozjpeg: true }).toFile(join(OUT, `${spec.slug}.jpg`));
    console.log("cover", spec.slug);
  }
  await browser.close();
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const all = JSON.parse(readFileSync(join(HERE, "covers.json"), "utf8"));
  const only = process.argv[2];
  const specs = only ? all.filter((s) => s.slug === only) : all;
  if (!specs.length) throw new Error(`No cover for "${only}" in covers.json`);
  await render(specs);
}

export { pageFor, SCENES };
