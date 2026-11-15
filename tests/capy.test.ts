// CapyInfographic: the brand style (checks, contrast fixes, what a website's CSS says), the design cleaner, the page
// it renders in, the request checks and credits, the examples, and real renders when a Chromium is on the machine
// (CHROMIUM_PATH, or Playwright's at /opt/pw-browsers/chromium): a design that spills is caught, outside requests are
// refused, and the PNG is the exact canvas size.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { DEFAULT_STYLE, accentText, cleanStyle, contrast, cssColors, cssFonts, cssTokens, hex, pageAssets, styleCss } from "../src/lib/capy/styleRules";
import { CANVAS, cleanDesign, infoCredits, pageHtml, pickExamples, systemPrompt, designPrompt } from "../src/lib/capy/infographicRules";
import { EXAMPLES } from "../src/lib/capy/examples";
import { MODELS, capyPick, genRequest } from "../src/lib/genRules";
import { MARKUP } from "../src/lib/creditRules";

test("a style from anywhere is checked and never throws", () => {
  assert.deepEqual(cleanStyle(null), DEFAULT_STYLE);
  assert.deepEqual(cleanStyle("nope"), DEFAULT_STYLE);
  const s = cleanStyle({ bg: "#fff", accent: "ffd202", headFont: "comic-sans", headWeight: 950, radius: 400, logo: "javascript:alert(1)", source: "ftp://x" });
  assert.equal(s.bg, "#FFFFFF");
  assert.equal(s.accent, "#FFD202");
  assert.equal(s.headFont, "inter");
  assert.equal(s.headWeight, 800);
  assert.equal(s.radius, 48);
  assert.equal(s.logo, null);
  assert.equal(s.source, null);
  assert.equal(hex("#abc"), "#AABBCC");
  assert.equal(hex("red"), null);
});

test("colors that can't be read are fixed: text on the page and on the accent", () => {
  const s = cleanStyle({ bg: "#FFFFFF", ink: "#EEEEEE", accent: "#FFD202", accentInk: "#FFFFFF", muted: "#FAFAFA" });
  assert.ok(contrast(s.ink, s.bg) >= 4.5);
  assert.ok(contrast(s.accentInk, s.accent) >= 4.5);
  assert.ok(contrast(s.muted, s.bg) >= 3);
  // Yellow on white can't be words: the ink is, and the yellow becomes the mark.
  assert.equal(accentText(s), s.ink);
  assert.match(styleCss(s, 1080, 1080), /--mark:#FFD202/);
  const blue = cleanStyle({ bg: "#FFFFFF", accent: "#2F54EB" });
  assert.equal(accentText(blue), "#2F54EB");
  assert.match(styleCss(blue, 1080, 1080), /--mark:transparent/);
});

test("a logo is kept only as a picture data URL", () => {
  const png = "data:image/png;base64,iVBORw0KGgo=";
  assert.equal(cleanStyle({ logo: png }).logo, png);
  assert.equal(cleanStyle({ logo: "data:text/html;base64,PHNjcmlwdD4=" }).logo, null);
  assert.equal(cleanStyle({ logo: "https://evil.example/logo.png" }).logo, null);
});

test("a website's CSS is counted: colors, fonts, tokens, stylesheets, logos and pages", () => {
  const css = `:root{--brand-primary:#0E7C66;--font-heading:"Recoleta"} a{color:#0E7C66} .b{background:#0e7c66;color:rgba(255,255,255,1)} .x{color:rgba(0,0,0,.2)} h1{font-family:"Recoleta",serif} p{font-family:Inter,sans-serif} body{font-family:system-ui}`;
  assert.equal(cssColors(css)[0].color, "#0E7C66");
  assert.ok(!cssColors(css).some((c) => c.color === "#000000"), "faint colors are skipped");
  assert.deepEqual(cssFonts(css).slice(0, 2), ["Recoleta", "Inter"]);
  assert.ok(cssTokens(css).some((t) => t.startsWith("--brand-primary")));
  const html = `<link rel="stylesheet" href="/a.css"><link rel=stylesheet href="https://cdn.example/b.css"><img class="site-logo" src="/logo.svg"><link rel="icon" href="/fav.png"><a href="/about">About</a><a href="https://other.example/about">x</a><a href="/blog/post">b</a><style>h2{color:#123456}</style>`;
  const a = pageAssets(html, "https://shop.example/");
  assert.deepEqual(a.sheets, ["https://shop.example/a.css", "https://cdn.example/b.css"]);
  assert.deepEqual(a.logos, ["https://shop.example/logo.svg", "https://shop.example/fav.png"]);
  assert.deepEqual(a.pages, ["https://shop.example/about"]);
  assert.match(a.inline, /#123456/);
});

test("Claude's design is cleaned: nothing runs and nothing loads from outside", () => {
  const d = cleanDesign(
    `@import url(https://evil.example/x.css); .a{background:url(https://evil.example/t.png)} .b{background:url("data:image/svg+xml,%3Csvg%3E")} .c{background:url(https://capy.local/photo)}`,
    `<h1 onclick="steal()">Hi</h1><script>alert(1)</script><img src="https://evil.example/p.png"><img src="https://capy.local/logo" alt=""><iframe src="https://x"></iframe><a href="javascript:alert(1)">x</a><svg><use href="#i"/></svg><style>body{display:none}</style>`,
  );
  assert.doesNotMatch(d.css, /evil|@import/);
  assert.match(d.css, /data:image\/svg/);
  assert.match(d.css, /capy\.local\/photo/);
  assert.doesNotMatch(d.body, /onclick|<script|alert|evil|<iframe|<style|javascript/);
  assert.match(d.body, /src="https:\/\/capy\.local\/logo"/);
  assert.match(d.body, /href="#i"/);
});

test("the page fixes the canvas size last and carries the brand", () => {
  const html = pageHtml(DEFAULT_STYLE, "4:5", { css: "html,body{width:5000px}", body: "<p>x</p>" });
  assert.ok(html.lastIndexOf("width:1080px!important") > html.indexOf("width:5000px"));
  assert.match(html, /height:1350px!important/);
  assert.match(html, /--accent:#2563EB/);
  assert.match(html, /capy\.local\/fonts\/inter-latin-800-normal\.woff2/);
});

test("infographic requests: shapes, website, photo, credits and Capy's pick", () => {
  const r = genRequest({ kind: "infographic", prompt: "3 tips to sleep better", aspect: "4:5", website: "lumen.example" });
  assert.equal(r.model, "capy-infographic");
  assert.equal(r.credits, 14);
  assert.equal(r.website, "lumen.example");
  assert.equal(genRequest({ kind: "infographic", prompt: "A detailed report of our year" }).model, "capy-infographic-best");
  assert.throws(() => genRequest({ kind: "image", prompt: "x", aspect: "4:5" }), /aspect/);
  assert.throws(() => genRequest({ kind: "image", prompt: "x", website: "a.com" }), /website is for CapyInfographic and CapyMotion/);
  assert.throws(() => genRequest({ kind: "infographic", prompt: "x", website: "not a site" }), /website/);
  assert.equal(genRequest({ kind: "infographic", prompt: "x", source_media_id: "11111111-1111-4111-8111-111111111111" }).sourceMediaId, "11111111-1111-4111-8111-111111111111");
  assert.equal(infoCredits("capy-infographic-best"), 24);
  for (const m of MODELS.filter((x) => x.kind === "infographic")) assert.ok(m.credits({ prompt: "x", seconds: 5 }) >= MARKUP * m.cost({ prompt: "x", seconds: 5 }));
  assert.equal(capyPick("infographic", "anything", false).model.id, "capy-infographic");
});

test("Claude sees the two closest examples, and photo layouts only with a photo", () => {
  assert.equal(pickExamples("5 tips for better coffee", "4:5", false)[0].slug, "checklist");
  assert.equal(pickExamples("Spreadsheets vs a posting queue", "1:1", false)[0].slug, "compare");
  assert.ok(pickExamples("our new menu", "4:5", false).every((e) => !e.photo));
  assert.equal(pickExamples("our new menu", "4:5", true)[0].slug, "menu");
  assert.equal(pickExamples("anything", "9:16", false).length, 2);
  const p = designPrompt({ prompt: "73% of owners check cash flow weekly", aspect: "1:1", brandName: "Ledgerly", style: DEFAULT_STYLE, photo: false });
  assert.match(p, /Example: big-stat/);
  assert.match(p, /No logo/);
  assert.match(systemPrompt(), /Never invent a statistic/);
});

test("every example in the library is clean and points only at our host", () => {
  assert.equal(EXAMPLES.length, 23);
  for (const e of EXAMPLES) {
    const d = cleanDesign(e.css, e.body);
    assert.equal(d.body, e.body, `${e.slug} body`);
    assert.doesNotMatch(e.body + e.css, /#[0-9a-f]{6}\b(?![^"]*%3E)/i, `${e.slug} uses a hex color`);
  }
});

const chrome = process.env.CHROMIUM_PATH || (existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : "");

test("real renders: exact size, spills caught, outside requests refused", { skip: !chrome && "no Chromium on this machine" }, async () => {
  process.env.CHROMIUM_PATH = chrome;
  const { renderPng } = await import("../src/lib/capy/render");
  const { w, h } = CANVAS["1:1"];
  const big = EXAMPLES.find((e) => e.slug === "big-stat")!;
  const ok = await renderPng(pageHtml(DEFAULT_STYLE, "1:1", { css: big.css, body: big.body }), w, h, { logo: null, photo: null });
  assert.equal(ok.png.readUInt32BE(16), w);
  assert.equal(ok.png.readUInt32BE(20), h);
  assert.deepEqual(ok.spills, []);
  // A headline far too big for the canvas: the renderer says so.
  const spill = await renderPng(pageHtml(DEFAULT_STYLE, "1:1", { css: ".x{font-size:400px;white-space:nowrap}", body: '<h1 class="x">This headline is far too long</h1>' }), w, h, { logo: null, photo: null });
  assert.ok(spill.spills.some((s) => /off the canvas/.test(s)), spill.spills.join());
  // A picture from outside never loads, even if it got past the cleaner: it has no size.
  const out = await renderPng(
    `<!doctype html><html><body style="margin:0"><img id="p" src="https://example.com/x.png" style="display:block"><p>${"ok"}</p></body></html>`,
    200,
    200,
    { logo: null, photo: null },
  );
  assert.equal(out.png.readUInt32BE(16), 200);
});
