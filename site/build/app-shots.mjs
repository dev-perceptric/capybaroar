// Fresh app screenshots for the docs: logs in to Capybaroar with a demo account and saves each screen to
// site/public/img/docs/<key>.webp at 1600px wide. Use a demo workspace with sample channels and posts, never a
// customer's. Run after each release, then npm run site:build.
//
//   CAPY_DEMO_EMAIL=demo@example.com CAPY_DEMO_PASSWORD=... node site/build/app-shots.mjs
//   CAPY_APP_URL=http://localhost:3000 ... to shoot a local build

import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const sharp = require("sharp");

const APP = (process.env.CAPY_APP_URL || "https://app.capybaroar.com").replace(/\/$/, "");
const EMAIL = process.env.CAPY_DEMO_EMAIL;
const PASSWORD = process.env.CAPY_DEMO_PASSWORD;
if (!EMAIL || !PASSWORD) {
  console.error("Set CAPY_DEMO_EMAIL and CAPY_DEMO_PASSWORD for the demo account.");
  process.exit(1);
}
const OUT = join(fileURLToPath(new URL(".", import.meta.url)), "..", "public", "img", "docs");
mkdirSync(OUT, { recursive: true });

// key: [path, what to do before the picture]
const SHOTS = {
  calendar: ["/calendar", null],
  composer: ["/calendar", async (p) => { await p.getByRole("button", { name: "New post" }).first().click(); await p.waitForTimeout(1500); }],
  channels: ["/channels", null],
  agent: ["/agents", null],
  inbox: ["/inbox", null],
  analytics: ["/analytics", null],
  settings: ["/settings", null],
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
await page.goto(`${APP}/login`, { waitUntil: "domcontentloaded" });
await page.fill('input[name="email"]', EMAIL);
await page.fill('input[name="password"]', PASSWORD);
await Promise.all([page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 30000 }), page.click('button[type="submit"]')]);

const only = process.argv.slice(2);
for (const [key, [path, before]] of Object.entries(SHOTS)) {
  if (only.length && !only.includes(key)) continue;
  try {
    await page.goto(APP + path, { waitUntil: "networkidle", timeout: 45000 });
    await page.waitForTimeout(1200);
    if (before) await before(page);
    const png = await page.screenshot({ type: "png" });
    await sharp(png).webp({ quality: 86 }).toFile(join(OUT, `${key}.webp`));
    console.log("ok  ", key);
  } catch (e) {
    console.log("FAIL", key, String(e.message).split("\n")[0]);
  }
}
await browser.close();
