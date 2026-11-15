import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Browser } from "playwright-core";
import { HOST } from "./styleRules";

// (No server-only marker: it holds no secrets, and tests/capy.test.ts renders with it.)
// Renders a CapyInfographic page to a PNG with Chromium: JavaScript off, and every request refused except the fonts,
// the logo and the photo this worker serves itself (HOST). One browser is shared and closed after a quiet minute;
// two renders run at once at most, the rest wait their turn. CHROMIUM_PATH points at the browser (the Docker image
// installs Debian's chromium at /usr/bin/chromium).

const AT_ONCE = 2;
const RENDER_MS = 20000;
const IDLE_MS = 60000;
const FONTS_DIR = join(process.cwd(), "public", "capy-fonts");

let browser: Promise<Browser> | null = null;
let idle: ReturnType<typeof setTimeout> | null = null;
let running = 0;
const waiting: (() => void)[] = [];

const executable = () => process.env.CHROMIUM_PATH || "/usr/bin/chromium";

async function getBrowser(): Promise<Browser> {
  if (idle) clearTimeout(idle);
  if (!browser) {
    const { chromium } = await import("playwright-core");
    browser = chromium
      .launch({ executablePath: executable(), headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--font-render-hinting=none"] })
      .catch((e) => {
        browser = null;
        throw e;
      });
  }
  return browser;
}

function release() {
  running--;
  waiting.shift()?.();
  if (running === 0 && !waiting.length) {
    idle = setTimeout(() => {
      const b = browser;
      browser = null;
      void b?.then((x) => x.close()).catch(() => undefined);
    }, IDLE_MS);
  }
}

export type Assets = { logo: string | null; photo: { bytes: Buffer; mime: string } | null };
export type Rendered = { png: Buffer; spills: string[] };

const dataUrl = (u: string) => {
  const m = /^data:([^;]+);base64,(.*)$/.exec(u);
  return m ? { mime: m[1], bytes: Buffer.from(m[2], "base64") } : null;
};

/** One page to a PNG of exactly w by h, with what spilled off the canvas or out of its box. */
export async function renderPng(html: string, w: number, h: number, assets: Assets): Promise<Rendered> {
  if (running >= AT_ONCE) await new Promise<void>((r) => waiting.push(r));
  running++;
  try {
    const b = await getBrowser();
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, javaScriptEnabled: false, offline: false });
    try {
      await ctx.route("**/*", async (route) => {
        const url = route.request().url();
        if (!url.startsWith(`${HOST}/`)) return route.abort();
        const path = url.slice(HOST.length);
        const font = /^\/fonts\/([a-z0-9-]+-latin-\d{3}-normal\.woff2)$/.exec(path);
        if (font) {
          const body = await readFile(join(FONTS_DIR, font[1])).catch(() => null);
          return body ? route.fulfill({ status: 200, contentType: "font/woff2", body }) : route.abort();
        }
        if (path === "/logo" && assets.logo) {
          const d = dataUrl(assets.logo);
          return d ? route.fulfill({ status: 200, contentType: d.mime, body: d.bytes }) : route.abort();
        }
        if (path === "/photo" && assets.photo) return route.fulfill({ status: 200, contentType: assets.photo.mime, body: assets.photo.bytes });
        if (path === "/page") return route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: html });
        return route.abort();
      });
      const page = await ctx.newPage();
      page.setDefaultTimeout(RENDER_MS);
      // Served from our host, so the page's own relative and font addresses resolve to it.
      await page.goto(`${HOST}/page`, { waitUntil: "load", timeout: RENDER_MS });
      await page.evaluate(() => document.fonts.ready.then(() => true)).catch(() => true);
      const spills = await page
        .evaluate(([W, H]) => {
          const bad: string[] = [];
          // The text itself (a Range around each text node), so words that run out of their box are caught too.
          const walk = document.createTreeWalker(document.querySelector("main") ?? document.body, NodeFilter.SHOW_TEXT);
          for (let n = walk.nextNode(); n; n = walk.nextNode()) {
            const words = (n.textContent ?? "").trim();
            if (!words) continue;
            const range = document.createRange();
            range.selectNodeContents(n);
            const r = range.getBoundingClientRect();
            if (r.width === 0 && r.height === 0) continue;
            const el = n.parentElement as HTMLElement;
            if (r.right > W + 2 || r.bottom > H + 2 || r.left < -2 || r.top < -2) bad.push(`off the canvas: "${words.slice(0, 40)}"`);
            else if (getComputedStyle(el).overflow !== "visible" && (el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2)) bad.push(`cut off: "${words.slice(0, 40)}"`);
          }
          return bad.slice(0, 12);
        }, [w, h] as const)
        .catch(() => [] as string[]);
      const png = await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: w, height: h }, timeout: RENDER_MS });
      return { png, spills };
    } finally {
      await ctx.close().catch(() => undefined);
    }
  } finally {
    release();
  }
}
