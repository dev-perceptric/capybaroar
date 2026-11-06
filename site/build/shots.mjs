// Screenshots of other tools for the blog listicles: each tool's homepage and pricing page, as anyone can see them.
// Cookie banners and chat bubbles are closed first. Pictures go to site/public/img/blog/shots/<id>-home.webp and
// <id>-pricing.webp; the page's text goes next to the build (site/build/listicles/text/) so prices can be checked
// against the vendor's own page. Retake every 90 days.
//
//   node site/build/shots.mjs              every tool in listicles/tools.json
//   node site/build/shots.mjs buffer later  only these

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const sharp = require("sharp");

const HERE = fileURLToPath(new URL(".", import.meta.url));
const OUT = join(HERE, "..", "public", "img", "blog", "shots");
const TEXT = join(HERE, "listicles", "text");
mkdirSync(OUT, { recursive: true });
mkdirSync(TEXT, { recursive: true });

const TOOLS = JSON.parse(readFileSync(join(HERE, "listicles", "tools.json"), "utf8"));
const only = process.argv.slice(2);
const list = only.length ? TOOLS.filter((t) => only.includes(t.id)) : TOOLS;

const ACCEPT = [
  "#onetrust-accept-btn-handler", "#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll", "#CybotCookiebotDialogBodyButtonAccept",
  "button[data-testid='cookie-policy-manage-dialog-accept-button']", "[data-cookiebanner='accept_button']", ".cky-btn-accept", "#hs-eu-confirmation-button",
];
const WORDS = /^(accept( all)?( cookies)?|allow( all)?( cookies)?|agree|i agree|got it|ok|okay|accept and continue|allow all cookies|accept all and close)$/i;

async function tidy(page) {
  await page.addStyleTag({ content: ".osano-cm-window,.osano-cm-dialog,#onetrust-consent-sdk,#CybotCookiebotDialog,#usercentrics-root{display:none!important}" }).catch(() => {});
  for (const sel of ACCEPT) {
    const b = page.locator(sel).first();
    if (await b.isVisible().catch(() => false)) { await b.click({ timeout: 2000 }).catch(() => {}); await page.waitForTimeout(500); }
  }
  for (const b of await page.locator("button, a[role=button], [role=button]").all()) {
    const t = ((await b.innerText().catch(() => "")) || "").trim();
    if (WORDS.test(t) && (await b.isVisible().catch(() => false))) { await b.click({ timeout: 2000 }).catch(() => {}); await page.waitForTimeout(500); break; }
  }
  // Whatever still floats over the page (chat bubbles, leftover banners, promo bars stuck to the bottom) goes.
  await page.evaluate(() => {
    const kill = ["#intercom-container", ".intercom-lightweight-app", "#hubspot-messages-iframe-container", "#drift-widget-container", "#launcher", "iframe[title*='chat' i]", "iframe[id*='chat' i]", "#credential_picker_container", "#onetrust-consent-sdk", "#CybotCookiebotDialog", "[id*='cookie' i][class*='banner' i]", "[class*='cookie' i][class*='banner' i]", "#usercentrics-root", ".osano-cm-window", "#truste-consent-track"];
    kill.forEach((s) => document.querySelectorAll(s).forEach((n) => n.remove()));
    for (const n of document.querySelectorAll("body *")) {
      const cs = getComputedStyle(n);
      if (cs.position !== "fixed" && cs.position !== "sticky") continue;
      const r = n.getBoundingClientRect();
      const nav = r.top <= 1 && r.height < 140 && r.width > innerWidth * 0.8;
      // A fixed box that fills the screen is often the whole site; drop it only when it is a cookie wall.
      const big = r.width * r.height > innerWidth * innerHeight * 0.6;
      if (big && !/cookie|consent|privacy/i.test(n.innerText || "")) continue;
      if (!nav && r.width * r.height > 0) n.remove();
    }
    // Cookie notes that sit in the page itself: the smallest box with the words, grown to its own card.
    for (const n of [...document.querySelectorAll("body *")].reverse()) {
      if (!n.isConnected || !/we use cookies|cookie preferences|cookie settings|this website uses cookies/i.test(n.innerText || "")) continue;
      let box = n;
      while (box.parentElement && box.parentElement !== document.body && (box.parentElement.innerText || "").length < 900) box = box.parentElement;
      if ((box.innerText || "").length < 900) box.remove();
    }
    document.documentElement.style.overflow = "auto";
    document.body.style.overflow = "auto";
    scrollTo(0, 0);
  });
  await page.waitForTimeout(400);
}

async function shoot(ctx, tool, kind, url) {
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2500);
    // Wake up pages that only draw once scrolled.
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(800);
    await page.mouse.wheel(0, -600);
    await page.waitForTimeout(1500);
    await tidy(page);
    await page.waitForTimeout(3000);
    await tidy(page);
    const png = await page.screenshot({ type: "png" });
    await sharp(png).webp({ quality: 84 }).toFile(join(OUT, `${tool.id}-${kind}.webp`));
    const text = await page.evaluate(() => document.body.innerText);
    writeFileSync(join(TEXT, `${tool.id}-${kind}.txt`), `${url}\ncaptured ${new Date().toISOString().slice(0, 10)}\n\n${text}`);
    console.log("ok  ", tool.id, kind, (await page.title()).slice(0, 60));
  } catch (e) {
    console.log("FAIL", tool.id, kind, String(e.message).split("\n")[0]);
  } finally {
    await page.close();
  }
}

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  locale: "en-US",
  timezoneId: "America/New_York",
  userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
});
const jobs = list.flatMap((t) => [["home", t.home], ["pricing", t.pricing]].filter(([, u]) => u).map(([k, u]) => [t, k, u]));
const queue = [...jobs];
await Promise.all(Array.from({ length: 4 }, async () => { while (queue.length) { const [t, k, u] = queue.shift(); await shoot(ctx, t, k, u); } }));
await browser.close();
