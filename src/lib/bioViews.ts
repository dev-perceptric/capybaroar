// Counting visits to link-in-bio pages, privately. Pure (no Supabase), so tests/bio.test.ts runs the same rules.
// - A visitor is a keyed hash of their IP, browser and the day (UTC) with a secret salt. The raw IP is never stored,
//   and the key changes every day, so one person can't be followed from one day to the next.
// - One view per visitor per page per 30 minutes: a view counts when the visitor has none counted in the last 30
//   minutes. bio_view() in 014_bio.sql applies the same rule in the database, so two servers agree.
// - Link previews, crawlers and scripts aren't visitors: their views and clicks aren't counted.
// - Referrers are kept by host only ("instagram.com"), never the full address.
import { createHmac } from "node:crypto";
import { trustedIp } from "./clientIp";

export const VIEW_GAP_MS = 30 * 60 * 1000;

const BOT =
  /(?<!cu)bot\b|bot\/|crawl|spider|slurp|facebookexternalhit|facebookcatalog|meta-externalagent|embedly|quora link preview|outbrain|vkshare|w3c_validator|whatsapp|skypeuripreview|preview|headless|lighthouse|pagespeed|prerender|mediapartners|curl\/|wget\/|python-|httpclient|go-http-client|node-fetch|undici|axios\/|okhttp|java\/|libwww|scrapy|feedfetcher|monitor|uptime|pingdom/i;

/** A crawler, a link preview or a script, by its user agent. No user agent counts as a script. */
export const isBot = (ua: string | null | undefined) => !ua || ua.length < 12 || BOT.test(ua);

export const utcDay = (d: Date) => d.toISOString().slice(0, 10);

/** The visitor's key for one page and one day: a salted HMAC, never the IP itself. */
export function visitorKey(salt: string, pageId: string, ip: string, ua: string, day: string) {
  return createHmac("sha256", salt).update(`${pageId}\n${ip}\n${ua}\n${day}`).digest("base64url").slice(0, 32);
}

/** Whether a visit counts as a view: the visitor's last counted view on this page is 30 minutes old or more. */
export const countsAsView = (lastCounted: Date | null, now: Date) => !lastCounted || now.getTime() - lastCounted.getTime() >= VIEW_GAP_MS;

/** The client's IP, from X-Real-IP only: Caddy on the VPS drops whatever the visitor sent and sets it from the
 *  connection (ops/vps/Caddyfile.example), and the homepage's nginx passes it on. X-Forwarded-For and Fly-Client-IP
 *  can be written by the visitor, so they are never read; with no X-Real-IP the answer is "". */
export function clientIp(h: { get(name: string): string | null }) {
  return trustedIp(h);
}

/** The host a visitor came from, without "www.", or "" for a direct visit or one from our own site. */
export function refHost(referer: string | null | undefined, ownHost: string) {
  if (!referer) return "";
  try {
    const u = new URL(referer);
    if (u.protocol !== "http:" && u.protocol !== "https:") return "";
    const host = u.hostname.toLowerCase().replace(/^www\./, "").slice(0, 100);
    if (!host || host === ownHost.toLowerCase().replace(/^www\./, "")) return "";
    // Instagram, Facebook and others send visitors through their own link shim; name the network instead.
    return host.replace(/^(l|lm|m)\.(instagram|facebook)\.com$/, "$2.com").replace(/^t\.co$/, "x.com");
  } catch {
    return "";
  }
}

export type DayRow = { day: string; views: number; clicks: number; referrers: Record<string, number> | null; items: Record<string, number> | null };
export type BioStats = {
  days: number;
  daily: { day: string; views: number; clicks: number }[];
  views: number;
  clicks: number;
  /** Clicks over views, or null with no views. */
  rate: number | null;
  items: { item: string; clicks: number }[];
  referrers: { host: string; views: number }[];
};

/** The period's numbers from its day rows, with every day present (0 when nothing happened). `today` is UTC. */
export function sumStats(rows: DayRow[], days: number, today: string): BioStats {
  const end = Date.parse(`${today}T00:00:00Z`);
  const daily = Array.from({ length: days }, (_, i) => ({ day: utcDay(new Date(end - (days - 1 - i) * 86400000)), views: 0, clicks: 0 }));
  const at = new Map(daily.map((d, i) => [d.day, i]));
  const items = new Map<string, number>();
  const refs = new Map<string, number>();
  let views = 0;
  let clicks = 0;
  for (const r of rows) {
    const i = at.get(r.day);
    if (i == null) continue;
    daily[i].views += r.views;
    daily[i].clicks += r.clicks;
    views += r.views;
    clicks += r.clicks;
    for (const [k, n] of Object.entries(r.items ?? {})) items.set(k, (items.get(k) ?? 0) + Number(n));
    for (const [k, n] of Object.entries(r.referrers ?? {})) refs.set(k, (refs.get(k) ?? 0) + Number(n));
  }
  const named = [...refs.values()].reduce((a, n) => a + n, 0);
  if (views > named) refs.set("", views - named);
  return {
    days,
    daily,
    views,
    clicks,
    rate: views ? clicks / views : null,
    items: [...items].map(([item, n]) => ({ item, clicks: n })).sort((a, b) => b.clicks - a.clicks),
    referrers: [...refs].map(([host, n]) => ({ host, views: n })).sort((a, b) => b.views - a.views),
  };
}
