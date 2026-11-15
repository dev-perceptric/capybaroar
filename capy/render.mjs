// Renders every page in capy/templates (and capy/templates/themes) to a PNG at its exact size, the way the render
// worker will: JavaScript off, no outside requests, fonts and photos from the template folder. Writes capy/previews/
// and a contact sheet. Run: node capy/render.mjs
import { createRequire } from "node:module";
import { readdirSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// Playwright comes from the machine (the render worker image ships it), so it is loaded with require.
const { chromium } = createRequire(import.meta.url)("playwright");
const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, "templates");
const out = join(here, "previews");
mkdirSync(out, { recursive: true });
const files = [...readdirSync(src).filter((f) => f.endsWith(".html")).map((f) => join(src, f)), ...readdirSync(join(src, "themes")).map((f) => join(src, "themes", f))];

const browser = await chromium.launch();
const shots = [];
for (const f of files) {
  const meta = JSON.parse(readFileSync(f, "utf8").match(/<!-- capy-template (.*?) -->/)[1]);
  const [w, h] = meta.size.split("x").map(Number);
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, javaScriptEnabled: false });
  await ctx.route(/^https?:/, (r) => r.abort());
  const page = await ctx.newPage();
  await page.goto(pathToFileURL(f).href, { waitUntil: "load" });
  await page.waitForTimeout(150);
  const name = f.slice(src.length + 1).replace(/\//g, "__").replace(/\.html$/, "");
  const png = join(out, name + ".png");
  await page.screenshot({ path: png, clip: { x: 0, y: 0, width: w, height: h } });
  // A design is broken when text spills off the canvas or out of its box.
  const spills = await page.evaluate(([W, H]) => {
    const bad = [];
    for (const el of document.querySelectorAll("main *")) {
      if (!el.childNodes.length || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
      const r = el.getBoundingClientRect();
      if (r.right > W + 1 || r.bottom > H + 1 || r.left < -1 || r.top < -1) bad.push("off canvas: " + el.textContent.trim().slice(0, 40));
      else if (el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflow !== "visible") bad.push("cut off: " + el.textContent.trim().slice(0, 40));
    }
    return bad;
  }, [w, h]);
  if (spills.length) console.log("SPILL", name, spills.join(" | "));
  shots.push({ name, w, h, theme: meta.theme });
  await ctx.close();
}
// Contact sheet
const tiles = shots.filter((s) => !s.name.startsWith("themes__")).map((s) => `<figure><img src="${s.name}.png" style="aspect-ratio:${s.w}/${s.h}"><figcaption>${s.name} <span>${s.w}x${s.h}</span></figcaption></figure>`).join("");
const themes = shots.filter((s) => s.name.startsWith("themes__")).map((s) => `<figure><img src="${s.name}.png"><figcaption>${s.theme}</figcaption></figure>`).join("");
const sheet = `<!doctype html><meta charset="utf-8"><style>body{margin:0;padding:48px;background:#f5f5f5;font:14px Inter,system-ui}h2{font-size:22px;margin:8px 0 20px}.g{columns:5 260px;column-gap:20px}.t{display:grid;grid-template-columns:repeat(6,1fr);gap:16px;margin-bottom:40px}figure{break-inside:avoid;margin:0 0 20px}img{width:100%;display:block;border-radius:10px;box-shadow:0 0 0 1px rgba(0,0,0,.08)}figcaption{margin-top:6px;color:#404040}figcaption span{color:#a3a3a3}</style><h2>One layout, six brands</h2><div class="t">${themes}</div><h2>Layouts</h2><div class="g">${tiles}</div>`;
writeFileSync(join(out, "index.html"), sheet);
const p = await browser.newPage({ viewport: { width: 1600, height: 900 } });
await p.goto(pathToFileURL(join(out, "index.html")).href, { waitUntil: "load" });
await p.screenshot({ path: join(out, "contact-sheet.png"), fullPage: true });
await browser.close();
console.log("rendered", shots.length);
