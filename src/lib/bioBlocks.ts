// Link-in-bio pages are a list of blocks. This file holds what a block is, the checks every save goes through, the
// address rules, how pages from before blocks (011's `links`) read as blocks, and how a saved page turns into what a
// visitor sees. Pure, so the server, the editor and tests/bio.test.ts all run the same code.
// - Links go out as http or https only: a link, a thumbnail or a custom post link can never be javascript: or data:.
// - A link with a start or end time shows only inside that window, decided on every visit (the page is never cached).
// - Hidden blocks, links outside their window and blocks with nothing to show are left out of the view, so they are
//   never sent to a visitor at all.

import type { NetworkId } from "./networks";
import { BIO_FONTS, BIO_THEMES, type BioFontId, type BioThemeId } from "./bioThemes";

export const BLOCKS_VERSION = 1;
export const MAX_BLOCKS = 50;

export type BlockType = "link" | "header" | "text" | "social" | "posts" | "video" | "email";
export const BLOCK_NAMES: Record<BlockType, string> = { link: "Link", header: "Header", text: "Text", social: "Social icons", posts: "Latest posts", video: "Video", email: "Email" };

export type SocialId =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "x"
  | "facebook"
  | "linkedin"
  | "threads"
  | "pinterest"
  | "bluesky"
  | "mastodon"
  | "telegram"
  | "reddit"
  | "whatsapp"
  | "spotify"
  | "twitch"
  | "snapchat"
  | "github";

const HANDLE = /^[A-Za-z0-9._-]{1,60}$/;
/** The networks a social icons row can show, and how a handle becomes a profile link (null: a link is needed). */
export const SOCIALS: { id: SocialId; name: string; from: (h: string) => string | null }[] = [
  { id: "instagram", name: "Instagram", from: (h) => (HANDLE.test(h) ? `https://www.instagram.com/${h}` : null) },
  { id: "tiktok", name: "TikTok", from: (h) => (HANDLE.test(h) ? `https://www.tiktok.com/@${h}` : null) },
  { id: "youtube", name: "YouTube", from: (h) => (HANDLE.test(h) ? `https://www.youtube.com/@${h}` : null) },
  { id: "x", name: "X", from: (h) => (HANDLE.test(h) ? `https://x.com/${h}` : null) },
  { id: "facebook", name: "Facebook", from: (h) => (HANDLE.test(h) ? `https://www.facebook.com/${h}` : null) },
  { id: "linkedin", name: "LinkedIn", from: (h) => (HANDLE.test(h) ? `https://www.linkedin.com/in/${h}` : null) },
  { id: "threads", name: "Threads", from: (h) => (HANDLE.test(h) ? `https://www.threads.net/@${h}` : null) },
  { id: "pinterest", name: "Pinterest", from: (h) => (HANDLE.test(h) ? `https://www.pinterest.com/${h}` : null) },
  { id: "bluesky", name: "Bluesky", from: (h) => (HANDLE.test(h) ? `https://bsky.app/profile/${h}` : null) },
  {
    id: "mastodon",
    name: "Mastodon",
    from: (h) => {
      const m = h.match(/^([A-Za-z0-9_]{1,30})@([a-z0-9.-]+\.[a-z]{2,})$/i);
      return m ? `https://${m[2].toLowerCase()}/@${m[1]}` : null;
    },
  },
  { id: "telegram", name: "Telegram", from: (h) => (HANDLE.test(h) ? `https://t.me/${h}` : null) },
  { id: "reddit", name: "Reddit", from: (h) => (HANDLE.test(h) ? `https://www.reddit.com/user/${h}` : null) },
  {
    id: "whatsapp",
    name: "WhatsApp",
    from: (h) => {
      const digits = h.replace(/[\s()+-]/g, "");
      return /^\d{6,15}$/.test(digits) ? `https://wa.me/${digits}` : null;
    },
  },
  { id: "spotify", name: "Spotify", from: () => null },
  { id: "twitch", name: "Twitch", from: (h) => (HANDLE.test(h) ? `https://www.twitch.tv/${h}` : null) },
  { id: "snapchat", name: "Snapchat", from: (h) => (HANDLE.test(h) ? `https://www.snapchat.com/add/${h}` : null) },
  { id: "github", name: "GitHub", from: (h) => (HANDLE.test(h) ? `https://github.com/${h}` : null) },
];
export const socialOf = (id: string) => SOCIALS.find((s) => s.id === id) ?? null;

type Base = { id: string; hidden?: boolean };
export type LinkBlock = Base & { type: "link"; label: string; url: string; thumb?: string | null; start?: string | null; end?: string | null; code?: string };
export type HeaderBlock = Base & { type: "header"; text: string };
export type TextBlock = Base & { type: "text"; text: string };
export type SocialItem = { network: SocialId; url: string; code?: string };
export type SocialBlock = Base & { type: "social"; items: SocialItem[] };
/** `links`: a post's own link replaced by one the team picks (post id to link), like Later's linkin.bio. */
export type PostsBlock = Base & { type: "posts"; count: number; links: Record<string, string> };
export type VideoBlock = Base & { type: "video"; url: string; title: string; thumb?: string | null; code?: string };
export type EmailBlock = Base & { type: "email"; label: string; email: string; subject?: string };
export type Block = LinkBlock | HeaderBlock | TextBlock | SocialBlock | PostsBlock | VideoBlock | EmailBlock;

export type ButtonShape = "pill" | "rounded" | "square";
/** hard: a thick ring with a hard offset shadow; glass: frosted. */
export type ButtonFill = "solid" | "outline" | "hard" | "glass";
export const FILLS: ButtonFill[] = ["solid", "outline", "hard", "glass"];
export type TextSize = "normal" | "large";
export type Appearance = { theme: BioThemeId; shape: ButtonShape; fill: ButtonFill; size: TextSize; font: BioFontId };
export const DEFAULT_APPEARANCE: Appearance = { theme: "light", shape: "pill", fill: "solid", size: "normal", font: "inter" };
export const POST_COUNTS = [3, 6, 9, 12];

/** A page as the editor and the server pass it around (bio_pages, with blocks and the look read). */
export type BioPage = {
  id: string;
  brand_id: string;
  slug: string;
  title: string;
  bio: string;
  avatar_media_id: string | null;
  blocks: Block[];
  appearance: Appearance;
  seo_title: string;
  seo_description: string;
  share_media_id: string | null;
  badge: boolean;
};

/** What the editor saves. The server checks all of it again, whatever the browser sent. */
export type BioDraft = {
  slug: string;
  title: string;
  bio: string;
  avatarMediaId: string | null;
  blocks: Block[];
  appearance: Appearance;
  seoTitle: string;
  seoDescription: string;
  shareMediaId: string | null;
  badge: boolean;
};

export const draftOf = (p: BioPage): BioDraft => ({
  slug: p.slug,
  title: p.title,
  bio: p.bio,
  avatarMediaId: p.avatar_media_id,
  blocks: p.blocks,
  appearance: p.appearance,
  seoTitle: p.seo_title,
  seoDescription: p.seo_description,
  shareMediaId: p.share_media_id,
  badge: p.badge,
});

// Checks

const ID = /^[A-Za-z0-9]{4,16}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CODE = /^[A-Za-z0-9]{6,12}$/;
const EMAIL = /^[^\s@<>()[\]"',;:?&#%\\/]{1,64}@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i;

/** A new block id: 8 letters and numbers. */
export function newBlockId() {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  return Array.from(globalThis.crypto.getRandomValues(new Uint8Array(8)), (b) => abc[b % abc.length]).join("");
}

/**
 * A web address people can open, or null. Only http and https; no spaces, no user:password@ (it hides the real
 * site), at most 2000 characters. "example.com/shop" gets https:// in front.
 */
export function httpUrl(raw: string | null | undefined): string | null {
  let s = String(raw ?? "").trim();
  if (!s || s.length > 2000 || /[\s\u0000-\u001f]/.test(s)) return null;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) {
    if (!/^[\w-]+(\.[\w-]+)+([/?#]|$)/.test(s)) return null;
    s = `https://${s}`;
  }
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    return null;
  }
  if ((u.protocol !== "http:" && u.protocol !== "https:") || !u.hostname || u.username || u.password) return null;
  const out = u.toString();
  return out.length <= 2000 ? out : null;
}

/** A profile link from what someone typed: a link, or a handle ("@acme") for networks that have one. */
export function socialHref(network: string, raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(s) || /^[\w-]+(\.[\w-]+)+\//.test(s)) return httpUrl(s);
  return socialOf(network)?.from(s.replace(/^@/, "")) ?? null;
}

/** A connected channel's public profile, for the icons a new social row starts with. */
export function profileUrl(c: { network: NetworkId; username: string | null; account_id: string }): { network: SocialId; url: string } | null {
  const u = c.username?.trim() || null;
  const pick = (network: SocialId, url: string | null) => (url ? { network, url } : null);
  switch (c.network) {
    case "instagram":
    case "tiktok":
    case "x":
    case "threads":
    case "pinterest":
    case "bluesky":
    case "mastodon":
    case "telegram":
    case "reddit":
      return u ? pick(c.network, socialHref(c.network, u)) : null;
    case "youtube":
      return pick("youtube", u ? httpUrl(`https://www.youtube.com/${u.startsWith("@") ? u : `@${u}`}`) : /^UC[\w-]{22}$/.test(c.account_id) ? `https://www.youtube.com/channel/${c.account_id}` : null);
    case "facebook":
      return pick("facebook", httpUrl(`https://www.facebook.com/${u ?? c.account_id}`));
    case "linkedin-page":
      return u && HANDLE.test(u) ? pick("linkedin", `https://www.linkedin.com/company/${u}`) : null;
    default:
      return null;
  }
}

/** Where a video link points: a YouTube video (with its id, for the thumbnail) or a TikTok video. */
export type VideoSource = { kind: "youtube"; id: string } | { kind: "tiktok" };
export function videoSource(url: string): VideoSource | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const host = u.hostname.toLowerCase().replace(/^(www|m|music)\./, "");
  const yt = /^[A-Za-z0-9_-]{11}$/;
  if (host === "youtu.be") {
    const id = u.pathname.split("/")[1] ?? "";
    return yt.test(id) ? { kind: "youtube", id } : null;
  }
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const v = u.searchParams.get("v");
    if (v && yt.test(v)) return { kind: "youtube", id: v };
    const m = u.pathname.match(/^\/(?:shorts|live|embed|v)\/([A-Za-z0-9_-]{11})(?:[/?#]|$)/);
    return m ? { kind: "youtube", id: m[1] } : null;
  }
  if (host === "tiktok.com" && /^\/@[^/]+\/video\/\d+/.test(u.pathname)) return { kind: "tiktok" };
  if ((host === "vm.tiktok.com" || host === "vt.tiktok.com") && /^\/[A-Za-z0-9]+\/?$/.test(u.pathname)) return { kind: "tiktok" };
  if (host === "tiktok.com" && /^\/t\/[A-Za-z0-9]+\/?$/.test(u.pathname)) return { kind: "tiktok" };
  return null;
}

export const youtubeThumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

const text = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max + 1);
const when = (v: unknown): string | null => {
  if (v == null || v === "") return null;
  const t = Date.parse(String(v));
  if (!Number.isFinite(t)) throw new Error("Pick a valid date and time");
  return new Date(t).toISOString();
};
const media = (v: unknown): string | null => {
  if (v == null || v === "") return null;
  if (typeof v !== "string" || !UUID.test(v)) throw new Error("Pick a picture from Media");
  return v;
};
const code = (v: unknown) => (typeof v === "string" && CODE.test(v) ? { code: v } : {});

/**
 * One block, checked and trimmed to what is stored. Throws a message that names the block. `n` is its place in the
 * list, from 1.
 */
export function cleanBlock(raw: unknown, n: number): Block {
  if (!raw || typeof raw !== "object") throw new Error(`Block ${n} is empty`);
  const b = raw as Record<string, unknown>;
  const type = b.type as BlockType;
  if (!(type in BLOCK_NAMES)) throw new Error(`Block ${n} has an unknown type`);
  const id = String(b.id ?? "");
  if (!ID.test(id)) throw new Error(`${BLOCK_NAMES[type]} ${n} has a bad id`);
  const base = { id, ...(b.hidden ? { hidden: true } : {}) };
  const name = (label?: string) => (label ? `"${label}"` : `${BLOCK_NAMES[type]} ${n}`);
  switch (type) {
    case "link": {
      const label = text(b.label, 80);
      if (!label) throw new Error(`${name()}: add a label`);
      if (label.length > 80) throw new Error(`${name(label.slice(0, 30))}: labels are up to 80 characters`);
      const url = httpUrl(b.url as string);
      if (!url) throw new Error(`${name(label)}: use an http or https link`);
      let start: string | null, end: string | null, thumb: string | null;
      try {
        start = when(b.start);
        end = when(b.end);
        thumb = media(b.thumb);
      } catch (e) {
        throw new Error(`${name(label)}: ${(e as Error).message.toLowerCase()}`);
      }
      if (start && end && end <= start) throw new Error(`${name(label)}: the end comes after the start`);
      return { ...base, type, label, url, thumb, start, end, ...code(b.code) };
    }
    case "header":
    case "text": {
      const max = type === "header" ? 80 : 500;
      const t = text(b.text, max);
      if (!t) throw new Error(`${name()}: add some text`);
      if (t.length > max) throw new Error(`${name()}: up to ${max} characters`);
      return { ...base, type, text: t };
    }
    case "social": {
      const list = Array.isArray(b.items) ? b.items : [];
      if (!list.length) throw new Error(`${name()}: add a network`);
      const seen = new Set<string>();
      const items: SocialItem[] = [];
      for (const it of list as Record<string, unknown>[]) {
        const s = socialOf(String(it?.network ?? ""));
        if (!s) throw new Error(`${name()}: unknown network`);
        if (seen.has(s.id)) throw new Error(`${name()}: ${s.name} is in the row twice`);
        seen.add(s.id);
        const url = socialHref(s.id, String(it.url ?? ""));
        if (!url) throw new Error(`${name()}: ${s.name} needs ${s.id === "spotify" ? "a link" : "a handle or link"}`);
        items.push({ network: s.id, url, ...code(it.code) });
      }
      return { ...base, type, items };
    }
    case "posts": {
      const count = POST_COUNTS.includes(Number(b.count)) ? Number(b.count) : 6;
      const links: Record<string, string> = {};
      const given = b.links && typeof b.links === "object" ? Object.entries(b.links as Record<string, unknown>) : [];
      for (const [post, v] of given) {
        if (!String(v ?? "").trim()) continue;
        if (!UUID.test(post)) throw new Error(`${name()}: unknown post`);
        const url = httpUrl(v as string);
        if (!url) throw new Error(`${name()}: post links use http or https`);
        links[post] = url;
      }
      if (Object.keys(links).length > 24) throw new Error(`${name()}: up to 24 post links`);
      return { ...base, type, count, links };
    }
    case "video": {
      const title = text(b.title, 80);
      if (title.length > 80) throw new Error(`${name()}: titles are up to 80 characters`);
      const url = httpUrl(b.url as string);
      if (!url || !videoSource(url)) throw new Error(`${name(title)}: use a YouTube or TikTok video link`);
      let thumb: string | null;
      try {
        thumb = media(b.thumb);
      } catch (e) {
        throw new Error(`${name(title)}: ${(e as Error).message.toLowerCase()}`);
      }
      return { ...base, type, url, title, thumb, ...code(b.code) };
    }
    case "email": {
      const label = text(b.label, 80) || "Email";
      if (label.length > 80) throw new Error(`${name()}: labels are up to 80 characters`);
      const email = text(b.email, 254);
      if (!EMAIL.test(email) || email.length > 254) throw new Error(`${name(label)}: use an email address`);
      const subject = text(b.subject, 120);
      if (subject.length > 120) throw new Error(`${name(label)}: subjects are up to 120 characters`);
      return { ...base, type, label, email, ...(subject ? { subject } : {}) };
    }
  }
}

/** Every block, checked, for a save. Throws on the first problem. */
export function cleanBlocks(raw: unknown): Block[] {
  if (!Array.isArray(raw)) throw new Error("Blocks are missing");
  if (raw.length > MAX_BLOCKS) throw new Error(`Up to ${MAX_BLOCKS} blocks`);
  const out = raw.map((b, i) => cleanBlock(b, i + 1));
  const ids = new Set(out.map((b) => b.id));
  if (ids.size !== out.length) throw new Error("Two blocks share an id");
  return out;
}

/**
 * The blocks a stored page holds. Never throws: a block that doesn't pass today's checks is left out instead of
 * breaking the page. Pages saved before blocks existed (011) read their `links` and `show_posts` instead.
 */
export function readBlocks(row: { blocks?: unknown; links?: unknown; show_posts?: boolean | null }): Block[] {
  const stored = row.blocks && typeof row.blocks === "object" ? (row.blocks as { items?: unknown }).items : undefined;
  if (!Array.isArray(stored)) return fromLegacy(row.links, !!row.show_posts);
  const out: Block[] = [];
  const ids = new Set<string>();
  for (const [i, b] of stored.slice(0, MAX_BLOCKS).entries()) {
    try {
      const c = cleanBlock(b, i + 1);
      if (ids.has(c.id)) continue;
      ids.add(c.id);
      out.push(c);
    } catch {
      // left out
    }
  }
  return out;
}

export const storedBlocks = (blocks: Block[]) => ({ v: BLOCKS_VERSION, items: blocks });

/**
 * A page from before blocks: each link becomes a link block that keeps its short-link code (so the page reads the
 * same and old clicks stay counted), and "show latest posts" becomes a posts block at the end. 014_bio.sql does the
 * same in SQL; ids match, `m001`, `m002`... and `mposts`.
 */
export function fromLegacy(links: unknown, showPosts: boolean): Block[] {
  const out: Block[] = [];
  const list = Array.isArray(links) ? (links as Record<string, unknown>[]) : [];
  list.forEach((l, i) => {
    const url = httpUrl(l?.url as string);
    const label = String(l?.label ?? "").trim().slice(0, 80);
    if (!url || !label) return;
    out.push({ id: `m${String(i + 1).padStart(3, "0")}`, type: "link", label, url, thumb: null, start: null, end: null, ...code(l.code) });
  });
  if (showPosts) out.push({ id: "mposts", type: "posts", count: 6, links: {} });
  return out;
}

/** What an older server reads (011's columns), kept in step so a rollback still shows the page. */
export function toLegacy(blocks: Block[], a: Appearance, now = new Date()) {
  const live = liveBlocks(blocks, now);
  return {
    links: live.filter((b): b is LinkBlock => b.type === "link" && !!b.code).slice(0, 20).map((b) => ({ label: b.label, url: b.url, code: b.code })),
    show_posts: live.some((b) => b.type === "posts"),
    theme: themeIsDark(a.theme) ? "dark" : "light",
  };
}

const themeIsDark = (id: string) => BIO_THEMES.find((t) => t.id === id)?.dark ?? false;

export function readAppearance(raw: unknown, legacyTheme?: string | null): Appearance {
  const a = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const pick = <T extends string>(v: unknown, ok: readonly T[], d: T): T => (ok.includes(v as T) ? (v as T) : d);
  return {
    theme: pick(a.theme ?? legacyTheme, BIO_THEMES.map((t) => t.id), DEFAULT_APPEARANCE.theme),
    shape: pick(a.shape, ["pill", "rounded", "square"] as const, DEFAULT_APPEARANCE.shape),
    fill: pick(a.fill, FILLS, DEFAULT_APPEARANCE.fill),
    size: pick(a.size, ["normal", "large"] as const, DEFAULT_APPEARANCE.size),
    font: pick(a.font, BIO_FONTS.map((f) => f.id), DEFAULT_APPEARANCE.font),
  };
}

// Scheduled links

/** A link with a start or end shows only from its start until its end. */
export function inWindow(b: { start?: string | null; end?: string | null }, now: Date) {
  const t = now.getTime();
  if (b.start && t < Date.parse(b.start)) return false;
  if (b.end && t >= Date.parse(b.end)) return false;
  return true;
}

export function scheduleState(b: Block, now: Date): "waiting" | "live" | "ended" | null {
  if (b.type !== "link" || (!b.start && !b.end)) return null;
  if (b.start && now.getTime() < Date.parse(b.start)) return "waiting";
  if (b.end && now.getTime() >= Date.parse(b.end)) return "ended";
  return "live";
}

/** The blocks a visitor gets now: not hidden, and links only inside their window. */
export const liveBlocks = (blocks: Block[], now: Date) => blocks.filter((b) => !b.hidden && (b.type !== "link" || inWindow(b, now)));

// Addresses

export const SLUG = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;
/** Addresses nobody gets: ours, and words that would read as Capybaroar or as an official page. */
export const RESERVED = new Set([
  "about", "account", "admin", "administrator", "api", "app", "apps", "auth", "billing", "bio", "blog", "contact", "dashboard", "docs",
  "help", "home", "invite", "login", "logout", "mail", "me", "media", "null", "official", "page", "pages", "privacy", "review", "root",
  "security", "settings", "signin", "signup", "static", "status", "support", "system", "team", "terms", "undefined", "verify", "www",
  // Pages on capybaroar.com, where link-in-bio pages live too, now or soon.
  "affiliates", "brand", "careers", "changelog", "compare", "cookies", "customers", "data-deletion", "features", "guides", "img",
  "index", "integrations", "learn", "legal", "partners", "press", "pricing", "robots", "sitemap", "templates", "tools",
]);

/** Why an address can't be used, or null. The page's current address always stays usable. */
export function slugProblem(slug: string, current?: string | null): string | null {
  if (current && slug === current && SLUG.test(slug)) return null;
  if (slug.length < 3 || slug.length > 40) return "Addresses are 3 to 40 characters";
  if (!SLUG.test(slug)) return "Use lowercase letters, numbers and dashes, starting and ending with a letter or number";
  if (slug.includes("--")) return "Use one dash at a time";
  if (RESERVED.has(slug) || slug.startsWith("capybaroar")) return "That address is reserved";
  return null;
}

/** An address from a brand's name: "Acme & Co." becomes "acme-co". */
export const slugFrom = (name: string) => {
  const s = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40)
    .replace(/-$/, "");
  return s.length >= 3 ? s : `${s || "page"}-bio`.replace(/^-/, "");
};

// Counted links

/** Each click a page counts through a short link: links, videos and each social icon, by item (block id, or block
 *  id and network). */
export function countedLinks(blocks: Block[]): { item: string; url: string }[] {
  const out: { item: string; url: string }[] = [];
  for (const b of blocks) {
    if (b.type === "link" || b.type === "video") out.push({ item: b.id, url: b.url });
    if (b.type === "social") for (const it of b.items) out.push({ item: socialItem(b.id, it.network), url: it.url });
  }
  return out;
}

/** The blocks with each counted link's short-link code set (and stale ones dropped). */
export function withCodes(blocks: Block[], codes: Map<string, string>): Block[] {
  const set = <T extends { code?: string }>(x: T, item: string): T => {
    const c = codes.get(item);
    const { code: _old, ...rest } = x;
    void _old;
    return (c ? { ...rest, code: c } : rest) as T;
  };
  return blocks.map((b) => (b.type === "link" || b.type === "video" ? set(b, b.id) : b.type === "social" ? { ...b, items: b.items.map((it) => set(it, socialItem(b.id, it.network))) } : b));
}

export const socialItem = (blockId: string, network: string) => `${blockId}.${network}`;
export const postItem = (blockId: string, postId: string) => `${blockId}.p.${postId}`;

// What a visitor sees

export type ViewPost = { href: string; thumb: string | null; alt: string };
export type ViewBlock =
  | { id: string; type: "link"; label: string; href: string; thumb: string | null }
  | { id: string; type: "header"; text: string }
  | { id: string; type: "text"; text: string }
  | { id: string; type: "social"; items: { network: SocialId; name: string; href: string }[] }
  | { id: string; type: "posts"; posts: ViewPost[] }
  | { id: string; type: "video"; label: string; href: string; thumb: string | null; source: "youtube" | "tiktok" }
  | { id: string; type: "email"; label: string; href: string };

export type BioView = { title: string; bio: string; avatar: string | null; appearance: Appearance; blocks: ViewBlock[]; badge: boolean };

/** How the public page and the editor's preview each turn ids into addresses. */
export type Resolver = {
  /** A picture from the media library, or null when it can't be shown. */
  media: (id: string) => string | null;
  /** Where a counted link goes: its short link, or the link itself. */
  link: (url: string, code?: string) => string;
  posts: (b: PostsBlock) => ViewPost[];
  /** A video's picture when none was picked (YouTube's own, or the page's TikTok route). */
  video: (b: VideoBlock, source: VideoSource) => string | null;
};

export const mailto = (b: Pick<EmailBlock, "email" | "subject">) => `mailto:${b.email}${b.subject ? `?subject=${encodeURIComponent(b.subject)}` : ""}`;

export function buildView(p: { title: string; bio: string; avatar: string | null; appearance: Appearance; badge: boolean; blocks: Block[] }, now: Date, r: Resolver): BioView {
  const blocks: ViewBlock[] = [];
  for (const b of liveBlocks(p.blocks, now)) {
    switch (b.type) {
      case "link":
        blocks.push({ id: b.id, type: "link", label: b.label, href: r.link(b.url, b.code), thumb: b.thumb ? r.media(b.thumb) : null });
        break;
      case "header":
      case "text":
        blocks.push({ id: b.id, type: b.type, text: b.text });
        break;
      case "social":
        if (b.items.length) blocks.push({ id: b.id, type: "social", items: b.items.map((it) => ({ network: it.network, name: socialOf(it.network)?.name ?? it.network, href: r.link(it.url, it.code) })) });
        break;
      case "posts": {
        const posts = r.posts(b);
        if (posts.length) blocks.push({ id: b.id, type: "posts", posts: posts.slice(0, b.count) });
        break;
      }
      case "video": {
        const src = videoSource(b.url);
        if (!src) break;
        blocks.push({ id: b.id, type: "video", label: b.title || (src.kind === "youtube" ? "Watch on YouTube" : "Watch on TikTok"), href: r.link(b.url, b.code), thumb: (b.thumb ? r.media(b.thumb) : null) ?? r.video(b, src), source: src.kind });
        break;
      }
      case "email":
        blocks.push({ id: b.id, type: "email", label: b.label, href: mailto(b) });
        break;
    }
  }
  return { title: p.title, bio: p.bio, avatar: p.avatar, appearance: p.appearance, blocks, badge: p.badge };
}

// Placeholders: what templates (src/lib/bioTemplates.ts) and the AI builder leave for people to fill in. example.com
// is reserved for examples (RFC 2606), so no real link points there; a video waits on YouTube's empty id. They pass
// the block checks, so a draft draws, but a page holding one can't be saved.

export const PLACEHOLDER_VIDEO = "https://www.youtube.com/watch?v=00000000000";
export const PLACEHOLDER_EMAIL = "hello@example.com";

/** A link to fill in, named after its label: "Book a table" becomes https://example.com/book-a-table. */
export const placeholderUrl = (label: string) => {
  const s = label.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40).replace(/-+$/, "");
  return `https://example.com/${s || "link"}`;
};

const exampleHost = (host: string) => /(^|\.)example\.(com|org|net)$/i.test(host);

export function isPlaceholder(url: string | null | undefined): boolean {
  let u: URL;
  try {
    u = new URL(String(url ?? ""));
  } catch {
    return false;
  }
  if (exampleHost(u.hostname)) return true;
  const v = videoSource(u.toString());
  return v?.kind === "youtube" && /^0{11}$/.test(v.id);
}

export const isPlaceholderEmail = (email: string | null | undefined) => exampleHost(String(email ?? "").split("@")[1] ?? "");

/** What in a block still waits for the person: its link, its email, or each social network left as a placeholder. */
export function placeholdersIn(b: Block): string[] {
  switch (b.type) {
    case "link":
    case "video":
      return isPlaceholder(b.url) ? ["link"] : [];
    case "email":
      return isPlaceholderEmail(b.email) ? ["email"] : [];
    case "social":
      return b.items.filter((i) => isPlaceholder(i.url)).map((i) => socialOf(i.network)?.name ?? i.network);
    default:
      return [];
  }
}

/** Why a page can't be saved yet because of placeholders, or null. Names the first few blocks. */
export function placeholderProblem(blocks: Block[]): string | null {
  const named: string[] = [];
  for (const [i, b] of blocks.entries()) {
    const left = placeholdersIn(b);
    if (!left.length) continue;
    const label = b.type === "link" || b.type === "email" ? b.label : b.type === "video" ? b.title : "";
    named.push(b.type === "social" ? `${BLOCK_NAMES.social} (${left.join(", ")})` : label ? `"${label}"` : `${BLOCK_NAMES[b.type]} ${i + 1}`);
  }
  if (!named.length) return null;
  const list = named.length > 3 ? `${named.slice(0, 3).join(", ")} and ${named.length - 3} more` : named.join(", ");
  return `Add your own links before saving: ${list}`;
}

/** Every media id a page shows (its avatar and share picture come from their own columns). */
export const blockMedia = (blocks: Block[]) => blocks.flatMap((b) => ((b.type === "link" || b.type === "video") && b.thumb ? [b.thumb] : []));
