// Renders the logo kit's PNGs, favicons and OG images from brand/svg (made by build.py), and copies what the app, the
// homepage and the emails use into place. Run from the repo root: `node brand/src/render.mjs` (or `npm run brand`).
// SVGs render with sharp (already a dependency). The OG images and guide.png are HTML pages shot with Playwright's
// Chromium; without Playwright those three are skipped and the rest still renders.

import { execSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const SRC = dirname(fileURLToPath(import.meta.url));
const BRAND = resolve(SRC, "..");
const ROOT = resolve(BRAND, "..");
const SVG = join(BRAND, "svg");
const PNG = join(BRAND, "png");
mkdirSync(PNG, { recursive: true });

const svg = (name) => readFileSync(join(SVG, `${name}.svg`));

/** An SVG at an exact pixel size (width, and height when given), rendered sharp from the vector. */
async function png(name, out, width, height) {
  const img = sharp(svg(name), { density: 1200 }).resize(width, height ?? null, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } });
  await img.png({ compressionLevel: 9 }).toFile(join(PNG, out));
  return join(PNG, out);
}

// Lockups at 1x, 2x and 4x: the wordmark is 240px wide at 1x, the stacked square 128px.
for (const tone of ["light", "dark", "ink", "white"]) {
  for (const k of [1, 2, 4]) {
    await png(`wordmark-${tone}`, `wordmark-${tone}@${k}x.png`, 240 * k);
    await png(`stacked-${tone}`, `stacked-${tone}@${k}x.png`, 128 * k);
  }
}

// App icons: the stacked tile from 180px up; below that the small icon (the yellow o and its waves), which stays
// legible at 16 and 32 where the words can't.
for (const s of [1024, 512, 192, 180]) {
  await png("icon", `icon-${s}.png`, s);
  await png("icon-yellow", `icon-yellow-${s}.png`, s);
}
for (const s of [48, 32, 16]) await png("icon-small", `icon-${s}.png`, s);

/** A .ico holding PNG images (Windows Vista and every browser read these). */
function ico(files) {
  const imgs = files.map((f) => readFileSync(f));
  const head = Buffer.alloc(6 + 16 * imgs.length);
  head.writeUInt16LE(0, 0);
  head.writeUInt16LE(1, 2);
  head.writeUInt16LE(imgs.length, 4);
  let offset = head.length;
  imgs.forEach((b, i) => {
    const size = b.readUInt32BE(16); // PNG width from the IHDR chunk
    const at = 6 + 16 * i;
    head.writeUInt8(size >= 256 ? 0 : size, at);
    head.writeUInt8(size >= 256 ? 0 : size, at + 1);
    head.writeUInt16LE(1, at + 4);
    head.writeUInt16LE(32, at + 6);
    head.writeUInt32LE(b.length, at + 8);
    head.writeUInt32LE(offset, at + 12);
    offset += b.length;
  });
  return Buffer.concat([head, ...imgs]);
}
writeFileSync(join(BRAND, "favicon.ico"), ico([16, 32, 48].map((s) => join(PNG, `icon-${s}.png`))));

// HTML pages shot in Chromium: the OG template, the homepage's OG image and the guide.
async function chromium() {
  for (const from of [ROOT, execSync("npm root -g").toString().trim()]) {
    try {
      const pw = require(require.resolve("playwright", { paths: [from] }));
      const exe = process.env.CHROMIUM_PATH || (existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined);
      return await pw.chromium.launch(exe ? { executablePath: exe } : {});
    } catch {
      /* try the next place */
    }
  }
  return null;
}

const browser = await chromium();
if (browser) {
  const shoot = async (file, out, width, height, opts = {}) => {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: opts.scale ?? 1 });
    await page.goto(pathToFileURL(file).href);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: out, fullPage: !!opts.full, type: out.endsWith(".jpg") ? "jpeg" : "png", quality: out.endsWith(".jpg") ? 88 : undefined });
    await page.close();
  };
  await shoot(join(SRC, "og.html"), join(PNG, "og.png"), 1200, 630);
  await shoot(join(SRC, "og-site.html"), join(ROOT, "site/public/img/og.jpg"), 1200, 630);
  await shoot(join(BRAND, "guide.html"), join(BRAND, "guide.png"), 1200, 800, { full: true });
  await browser.close();
} else {
  console.warn("Playwright not found: skipped og.png, site/public/img/og.jpg and guide.png");
}

// Into place: the app (Next metadata files), the homepage and the hosted copies emails link to.
const put = (from, to) => {
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(from, to);
};
put(join(BRAND, "favicon.ico"), join(ROOT, "src/app/favicon.ico"));
put(join(SVG, "icon-small.svg"), join(ROOT, "src/app/icon.svg"));
put(join(PNG, "icon-180.png"), join(ROOT, "src/app/apple-icon.png"));
put(join(BRAND, "favicon.ico"), join(ROOT, "site/public/favicon.ico"));
put(join(SVG, "icon-small.svg"), join(ROOT, "site/public/icon.svg"));
put(join(PNG, "icon-180.png"), join(ROOT, "site/public/apple-touch-icon.png"));
for (const f of ["wordmark-light@2x.png", "wordmark-dark@2x.png", "stacked-light@2x.png", "icon-192.png", "icon-512.png"]) put(join(PNG, f), join(ROOT, "site/public/brand", f));
for (const f of ["icon-192.png", "icon-512.png"]) put(join(PNG, f), join(ROOT, "public/brand", f)); // the app's manifest
// The homepage draws the wordmark inline: one <symbol id="logo"> per page, used by the nav and the footer (sized by
// .logo-mark in style.css, which keeps the symbol's shape).
const mark = readFileSync(join(SVG, "wordmark-light.svg"), "utf8");
const vb = mark.match(/viewBox="([^"]+)"/)[1];
const inner = mark.replace(/^[\s\S]*?<\/title>/, "").replace(/<\/svg>\s*$/, "");
for (const page of readdirSync(join(ROOT, "site/public")).filter((f) => f.endsWith(".html"))) {
  const file = join(ROOT, "site/public", page);
  const html = readFileSync(file, "utf8")
    .replace(/<symbol id="logo" viewBox="[^"]*">[\s\S]*?<\/symbol>/, () => `<symbol id="logo" viewBox="${vb}">${inner}</symbol>`);
  writeFileSync(file, html);
}
console.log("rendered", PNG);
