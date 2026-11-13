import "server-only";
import { cache } from "react";
import { adminClient } from "./supabase/server";
import { appUrl, listChannels } from "./channels";
import { linkCode } from "./composer";
import { PLANS, effectivePlan, limitsOf, type Billing } from "./billing";
import { safeGet } from "./api/fetchSafe";
import {
  BLOCK_NAMES,
  DEFAULT_APPEARANCE,
  SLUG,
  blockMedia,
  buildView,
  cleanBlocks,
  countedLinks,
  httpUrl,
  liveBlocks,
  newBlockId,
  placeholderProblem,
  postItem,
  profileUrl,
  readAppearance,
  readBlocks,
  slugFrom,
  slugProblem,
  socialOf,
  storedBlocks,
  toLegacy,
  videoSource,
  withCodes,
  youtubeThumb,
  draftOf,
  type BioDraft,
  type BioPage,
  type BioView,
  type SocialId,
  type SocialItem,
} from "./bioBlocks";
import { isBot, refHost, sumStats, utcDay, visitorKey, type BioStats, type DayRow } from "./bioViews";

// A link-in-bio page per brand, public at /b/<slug>, made of blocks (src/lib/bioBlocks.ts). Links, videos and social
// icons go out through the page's own short links (public.links with page_id), so every click is counted for the
// link and for the page. Visits are counted privately (src/lib/bioViews.ts). Visitors never read the database: the
// public page is drawn by the server with the service role.

type Row = Omit<BioPage, "blocks" | "appearance"> & { workspace_id: string; blocks: unknown; appearance: unknown; links: unknown; show_posts: boolean; theme: string };

const COLS = "id, workspace_id, brand_id, slug, title, bio, avatar_media_id, links, show_posts, theme, blocks, appearance, seo_title, seo_description, share_media_id, badge";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DAY = 86400000;

const toPage = (r: Row): BioPage => ({
  id: r.id,
  brand_id: r.brand_id,
  slug: r.slug,
  title: r.title ?? "",
  bio: r.bio ?? "",
  avatar_media_id: r.avatar_media_id ?? null,
  blocks: readBlocks(r),
  appearance: readAppearance(r.appearance, r.theme),
  seo_title: r.seo_title ?? "",
  seo_description: r.seo_description ?? "",
  share_media_id: r.share_media_id ?? null,
  badge: r.badge ?? true,
});

export async function getBioPage(workspaceId: string, brandId: string): Promise<BioPage | null> {
  const { data, error } = await adminClient().from("bio_pages").select(COLS).eq("workspace_id", workspaceId).eq("brand_id", brandId).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toPage(data as unknown as Row) : null;
}

/** A social icons row from the brand's connected channels, one icon per network. */
export async function socialDefaults(workspaceId: string, brandId: string): Promise<SocialItem[]> {
  const out = new Map<SocialId, SocialItem>();
  for (const c of await listChannels(workspaceId, [brandId])) {
    const p = profileUrl(c);
    if (p && !out.has(p.network)) out.set(p.network, { network: p.network, url: p.url });
  }
  return [...out.values()];
}

/** Address choices for a new page: the brand's name, then with a number after it, then with a random ending. */
function slugChoices(name: string) {
  const base = slugFrom(name);
  const ending = (s: string) => `${base.slice(0, 39 - s.length).replace(/-$/, "")}-${s}`;
  const rand = () => Math.random().toString(36).slice(2, 6);
  return [base, ...[2, 3, 4, 5].map((n) => ending(String(n))), ending(rand()), ending(rand()), ending(rand())].filter((s) => !slugProblem(s));
}

/** The brand's page, made now with an address from its name and a social icons row from its channels. */
export async function createBioPage(workspaceId: string, brand: { id: string; name: string }): Promise<BioPage> {
  const found = await getBioPage(workspaceId, brand.id);
  if (found) return found;
  const db = adminClient();
  let made: Row | null = null;
  for (const slug of slugChoices(brand.name)) {
    const { data, error } = await db
      .from("bio_pages")
      .insert({ workspace_id: workspaceId, brand_id: brand.id, slug, title: brand.name.slice(0, 80), blocks: storedBlocks([]), appearance: DEFAULT_APPEARANCE })
      .select(COLS)
      .single();
    if (!error) {
      made = data as unknown as Row;
      break;
    }
    if (error.code !== "23505") throw new Error(error.message);
    // Someone made this brand's page at the same moment: use theirs.
    if (/brand_id/.test(error.message)) return (await getBioPage(workspaceId, brand.id))!;
  }
  if (!made) throw new Error("Couldn't find a free address, try again");
  const page = toPage(made);
  // A first block of social icons from the brand's channels. The page is made either way.
  try {
    const items = await socialDefaults(workspaceId, brand.id);
    return items.length ? await saveBioPage(workspaceId, brand.id, { ...draftOf(page), blocks: [{ id: newBlockId(), type: "social", items }] }) : page;
  } catch (e) {
    console.error("bio: first block:", e instanceof Error ? e.message : e);
    return page;
  }
}

/** Which of these ids are pictures in the workspace's media library. */
async function pictures(workspaceId: string, ids: string[]): Promise<Set<string>> {
  const want = [...new Set(ids.filter((id) => UUID.test(id)))];
  if (!want.length) return new Set();
  const { data, error } = await adminClient().from("media").select("id, mime").eq("workspace_id", workspaceId).in("id", want);
  if (error) throw new Error(error.message);
  return new Set((data ?? []).filter((m) => String(m.mime).startsWith("image/")).map((m) => m.id as string));
}

/**
 * The page's own short-link code for each counted link, by item. A link keeps its code when its address changes (the
 * row is pointed at the new address); a new link gets a new code. Codes the page doesn't own (an old page's links,
 * shared with posts) are never reused.
 */
async function pageCodes(workspaceId: string, pageId: string, targets: { item: string; url: string }[]): Promise<Map<string, string>> {
  const db = adminClient();
  const { data, error } = await db.from("links").select("code, item, url").eq("workspace_id", workspaceId).eq("page_id", pageId);
  if (error) throw new Error(error.message);
  const have = new Map((data ?? []).map((r) => [r.item as string, r as { code: string; url: string }]));
  const codes = new Map<string, string>();
  const missing: { item: string; url: string }[] = [];
  for (const t of targets) {
    const h = have.get(t.item);
    if (!h) {
      missing.push(t);
      continue;
    }
    if (h.url !== t.url) {
      const { error: e } = await db.from("links").update({ url: t.url }).eq("code", h.code).eq("page_id", pageId);
      if (e) throw new Error(e.message);
    }
    codes.set(t.item, h.code);
  }
  for (let tries = 0; missing.length && tries < 4; tries++) {
    const rows = missing.map((t) => ({ code: linkCode(), workspace_id: workspaceId, url: t.url, page_id: pageId, item: t.item }));
    const { error: e } = await db.from("links").insert(rows);
    if (!e) {
      rows.forEach((r) => codes.set(r.item, r.code));
      missing.length = 0;
    } else if (e.code !== "23505") throw new Error(e.message);
  }
  if (missing.length) throw new Error("Couldn't make short links, try again");
  return codes;
}

/** Save the editor's draft over the brand's page. Throws a message for the first problem found. */
export async function saveBioPage(workspaceId: string, brandId: string, draft: BioDraft): Promise<BioPage> {
  const page = await getBioPage(workspaceId, brandId);
  if (!page) throw new Error("This page was deleted");
  const slug = String(draft.slug ?? "").trim().toLowerCase();
  const bad = slugProblem(slug, page.slug);
  if (bad) throw new Error(bad);
  const title = String(draft.title ?? "").trim();
  const bio = String(draft.bio ?? "").trim();
  const seoTitle = String(draft.seoTitle ?? "").trim();
  const seoDescription = String(draft.seoDescription ?? "").trim();
  if (title.length > 80) throw new Error("Titles are up to 80 characters");
  if (bio.length > 300) throw new Error("Bios are up to 300 characters");
  if (seoTitle.length > 70) throw new Error("Search titles are up to 70 characters");
  if (seoDescription.length > 200) throw new Error("Descriptions are up to 200 characters");
  let blocks = cleanBlocks(draft.blocks);
  const waiting = placeholderProblem(blocks);
  if (waiting) throw new Error(waiting);
  const appearance = readAppearance(draft.appearance);
  const avatar = draft.avatarMediaId || null;
  const share = draft.shareMediaId || null;
  const used = [avatar, share, ...blockMedia(blocks)].filter((m): m is string => !!m);
  const ok = await pictures(workspaceId, used);
  if (used.some((id) => !ok.has(id))) throw new Error("Pick pictures from Media");
  blocks = withCodes(blocks, await pageCodes(workspaceId, page.id, countedLinks(blocks)));
  const badge = (await limitsOf(workspaceId)).bioBadgeOff ? !!draft.badge : true;
  const row = {
    slug,
    title,
    bio,
    avatar_media_id: avatar,
    blocks: storedBlocks(blocks),
    appearance,
    seo_title: seoTitle,
    seo_description: seoDescription,
    share_media_id: share,
    badge,
    ...toLegacy(blocks, appearance),
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await adminClient().from("bio_pages").update(row).eq("id", page.id).eq("workspace_id", workspaceId).select(COLS).single();
  if (error) throw new Error(error.code === "23505" ? "That address is taken" : error.message);
  return toPage(data as unknown as Row);
}

export async function deleteBioPage(workspaceId: string, brandId: string) {
  const { error } = await adminClient().from("bio_pages").delete().eq("workspace_id", workspaceId).eq("brand_id", brandId);
  if (error) throw new Error(error.message);
}

/** Why this address can't be the brand's page's, or null when it can. */
export async function slugTaken(workspaceId: string, brandId: string, slug: string): Promise<string | null> {
  const page = await getBioPage(workspaceId, brandId);
  const bad = slugProblem(slug, page?.slug);
  if (bad) return bad;
  const { data, error } = await adminClient().from("bio_pages").select("brand_id").eq("slug", slug).maybeSingle();
  if (error) throw new Error(error.message);
  return data && data.brand_id !== brandId ? "That address is taken" : null;
}

export type LatestPost = { id: string; text: string; url: string; mediaId: string };

/** The brand's newest published posts that have a picture and a link on their network, newest first. */
export async function latestPosts(workspaceId: string, brandId: string, n = 12): Promise<LatestPost[]> {
  const db = adminClient();
  const { data: chans } = await db.from("channels").select("id").eq("workspace_id", workspaceId).eq("brand_id", brandId);
  const ids = (chans ?? []).map((c) => c.id as string);
  if (!ids.length) return [];
  const { data } = await db
    .from("post_targets")
    .select("post_id, url, text, posts(text, media_ids)")
    .eq("workspace_id", workspaceId)
    .eq("status", "published")
    .in("channel_id", ids)
    .not("url", "is", null)
    .is("deleted_at", null)
    .order("published_at", { ascending: false })
    .limit(80);
  type Post = { text: string; media_ids: string[] };
  type R = { post_id: string; url: string; text: string | null; posts: Post | Post[] | null };
  const seen = new Set<string>();
  const rows: { id: string; text: string; url: string; media: string[] }[] = [];
  for (const r of (data ?? []) as unknown as R[]) {
    const p = Array.isArray(r.posts) ? r.posts[0] : r.posts;
    if (seen.has(r.post_id) || !p?.media_ids?.length || !httpUrl(r.url)) continue;
    seen.add(r.post_id);
    rows.push({ id: r.post_id, text: (r.text ?? p.text ?? "").slice(0, 280), url: r.url, media: p.media_ids });
  }
  // Pictures only: a video's first frame needs the player.
  const pics = await pictures(workspaceId, rows.flatMap((r) => r.media));
  const out: LatestPost[] = [];
  for (const r of rows) {
    const m = r.media.find((id) => pics.has(id));
    if (m) out.push({ id: r.id, text: r.text, url: r.url, mediaId: m });
    if (out.length === n) break;
  }
  return out;
}

type Ws = Pick<Billing, "plan" | "trial_ends_at">;
const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? (v[0] ?? null) : (v ?? null));

/**
 * The public page at an address, or null: the page, what a visitor sees now, and its workspace. Pictures go through
 * /b/<slug>/media/<id>, which hands out a fresh signed link each time. Read once per request (generateMetadata and
 * the page share it).
 */
export const publicBio = cache(async (slug: string): Promise<{ page: BioPage; view: BioView; workspaceId: string; shareImage: string | null } | null> => {
  if (!SLUG.test(slug)) return null;
  const { data, error } = await adminClient().from("bio_pages").select(`${COLS}, workspaces(plan, trial_ends_at)`).eq("slug", slug).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const row = data as unknown as Row & { workspaces: Ws | Ws[] | null };
  const page = toPage(row);
  const ws = one(row.workspaces);
  const now = new Date();
  const live = liveBlocks(page.blocks, now);
  const [posts, pics] = await Promise.all([
    live.some((b) => b.type === "posts") ? latestPosts(row.workspace_id, row.brand_id) : Promise.resolve([]),
    pictures(row.workspace_id, [page.avatar_media_id ?? "", page.share_media_id ?? "", ...blockMedia(live)]),
  ]);
  const media = (id: string) => (pics.has(id) ? `/b/${slug}/media/${id}` : null);
  const view = buildView(
    {
      title: page.title,
      bio: page.bio,
      avatar: page.avatar_media_id ? media(page.avatar_media_id) : null,
      appearance: page.appearance,
      badge: ws && PLANS[effectivePlan(ws)].bioBadgeOff ? page.badge : true,
      blocks: page.blocks,
    },
    now,
    {
      media,
      link: (url, code) => (code ? `/l/${code}` : url),
      posts: (b) => posts.map((p) => ({ href: `/b/${slug}/p/${b.id}/${p.id}`, thumb: `/b/${slug}/media/${p.mediaId}`, alt: p.text.slice(0, 120) })),
      video: (b, src) => (src.kind === "youtube" ? youtubeThumb(src.id) : `/b/${slug}/v/${b.id}`),
    },
  );
  // The picture shown when the page is shared: the one picked for it, else the avatar.
  const share = [page.share_media_id, page.avatar_media_id].find((id): id is string => !!id && pics.has(id)) ?? null;
  return { page, view, workspaceId: row.workspace_id, shareImage: share ? `${appUrl()}/b/${slug}/media/${share}` : null };
});

/** A stored page by address, for the routes under /b/<slug>. */
async function pageAt(slug: string): Promise<(BioPage & { workspace_id: string }) | null> {
  if (!SLUG.test(slug)) return null;
  const { data } = await adminClient().from("bio_pages").select(COLS).eq("slug", slug).maybeSingle();
  return data ? { ...toPage(data as unknown as Row), workspace_id: (data as unknown as Row).workspace_id } : null;
}

/**
 * A signed link to show one picture to visitors for an hour. With SUPABASE_IMAGE_TRANSFORMS=1 (a Supabase plan with
 * image transformations) it's a copy at most 640px wide instead of the original upload, a small part of the egress.
 */
async function visitorPicture(workspaceId: string, mediaId: string): Promise<string | null> {
  const db = adminClient();
  const { data: m } = await db.from("media").select("path, mime").eq("id", mediaId).eq("workspace_id", workspaceId).maybeSingle();
  if (!m || !String(m.mime).startsWith("image/")) return null;
  const small = process.env.SUPABASE_IMAGE_TRANSFORMS === "1" ? { transform: { width: 640, quality: 75 } } : undefined;
  const { data } = await db.storage.from("media").createSignedUrl(m.path as string, 3600, small);
  return data?.signedUrl ?? null;
}

/** A signed link to a picture the page at this address shows: its avatar, share picture, a block's picture, or a
 *  picture in its brand's published posts when it shows them. */
export async function bioMedia(slug: string, mediaId: string): Promise<string | null> {
  if (!UUID.test(mediaId)) return null;
  const page = await pageAt(slug);
  if (!page) return null;
  const live = liveBlocks(page.blocks, new Date());
  const own = [page.avatar_media_id, page.share_media_id, ...blockMedia(live)].includes(mediaId);
  if (!own) {
    if (!live.some((b) => b.type === "posts")) return null;
    const { data: used } = await adminClient().from("posts").select("id").eq("workspace_id", page.workspace_id).eq("brand_id", page.brand_id).in("status", ["published", "partial"]).contains("media_ids", [mediaId]).limit(1);
    if (!used?.length) return null;
  }
  return visitorPicture(page.workspace_id, mediaId);
}

/**
 * Where a latest-posts tile goes: the link the team set for that post, or the post on its network. Counts the click
 * for the page when a person made it. Only posts of the page's brand, from a posts block a visitor can see.
 */
export async function openPost(slug: string, blockId: string, postId: string, human: boolean): Promise<string | null> {
  if (!UUID.test(postId)) return null;
  const page = await pageAt(slug);
  const block = page ? liveBlocks(page.blocks, new Date()).find((b) => b.id === blockId && b.type === "posts") : undefined;
  if (!page || !block || block.type !== "posts") return null;
  const db = adminClient();
  const { data: chans } = await db.from("channels").select("id").eq("workspace_id", page.workspace_id).eq("brand_id", page.brand_id);
  const ids = (chans ?? []).map((c) => c.id as string);
  if (!ids.length) return null;
  const { data } = await db
    .from("post_targets")
    .select("url")
    .eq("workspace_id", page.workspace_id)
    .eq("post_id", postId)
    .eq("status", "published")
    .in("channel_id", ids)
    .not("url", "is", null)
    .is("deleted_at", null)
    .order("published_at", { ascending: false })
    .limit(1);
  const own = data?.[0]?.url as string | undefined;
  if (!own) return null;
  const url = httpUrl(block.links[postId] ?? own);
  if (!url) return null;
  if (human) {
    const { error } = await db.rpc("bio_click", { p_page: page.id, p_item: postItem(blockId, postId) });
    if (error) console.error("bio click:", error.message);
  }
  return url;
}

// TikTok gives a video's picture only through its oEmbed answer, as a link that expires: ask for it at most once an
// hour per video on each server (10 minutes after a failure).
const tiktok = new Map<string, { thumb: string | null; until: number }>();

async function tiktokThumb(url: string): Promise<string | null> {
  const hit = tiktok.get(url);
  if (hit && hit.until > Date.now()) return hit.thumb;
  let thumb: string | null = null;
  try {
    const res = await safeGet(new URL(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`), 4000);
    if (res.status === 200) {
      const chunks: Buffer[] = [];
      let size = 0;
      for await (const c of res.body as AsyncIterable<Buffer>) {
        size += c.length;
        if (size > 256 * 1024) throw new Error("Too big");
        chunks.push(c);
      }
      // Only a picture on TikTok's own image servers.
      const found = httpUrl((JSON.parse(Buffer.concat(chunks).toString("utf8")) as { thumbnail_url?: string }).thumbnail_url);
      thumb = found && found.startsWith("https://") && /(^|\.)tiktokcdn(-[a-z]+)?\.com$/.test(new URL(found).hostname) ? found : null;
    } else res.body.resume();
  } catch (e) {
    console.error("bio tiktok:", e instanceof Error ? e.message : e);
  }
  if (tiktok.size > 500) tiktok.clear();
  tiktok.set(url, { thumb, until: Date.now() + (thumb ? 3600000 : 600000) });
  return thumb;
}

/** A video block's picture: the one picked from Media, YouTube's own, or TikTok's. Null when there is none. */
export async function videoThumb(slug: string, blockId: string): Promise<string | null> {
  const page = await pageAt(slug);
  const b = page ? liveBlocks(page.blocks, new Date()).find((x) => x.id === blockId) : undefined;
  if (!page || !b || b.type !== "video") return null;
  if (b.thumb) {
    const pic = await visitorPicture(page.workspace_id, b.thumb);
    if (pic) return pic;
  }
  const src = videoSource(b.url);
  if (!src) return null;
  return src.kind === "youtube" ? youtubeThumb(src.id) : tiktokThumb(b.url);
}

// Views

/** The secret the visitor hash is keyed with: BIO_SALT, its own random value, so rotating TOKEN_KEY never touches it.
 *  Until it is set, the old fallbacks keep counting the same way. */
const viewSalt = () => process.env.BIO_SALT || process.env.TOKEN_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

/** Count a visit to a page (after the page is sent). Never throws: a lost view never breaks the page. */
export async function recordView(pageId: string, v: { ip: string; ua: string | null; referer: string | null }) {
  try {
    if (isBot(v.ua)) return;
    const salt = viewSalt();
    if (!salt) return;
    const visitor = visitorKey(salt, pageId, v.ip, v.ua ?? "", utcDay(new Date()));
    const { error } = await adminClient().rpc("bio_view", { p_page: pageId, p_visitor: visitor, p_ref: refHost(v.referer, new URL(appUrl()).hostname) });
    if (error) console.error("bio view:", error.message);
  } catch (e) {
    console.error("bio view:", e instanceof Error ? e.message : e);
  }
}

export type TopItem = { item: string; label: string; sub: string; kind: "link" | "video" | "social" | "post"; network?: SocialId; clicks: number };
export type BioNumbers = Omit<BioStats, "items"> & { top: TopItem[] };

/** The page's views, clicks and where they came from, for the last `days` days (UTC). */
export async function bioStats(workspaceId: string, brandId: string, days: number): Promise<BioNumbers> {
  const page = await getBioPage(workspaceId, brandId);
  if (!page) throw new Error("This page was deleted");
  const today = utcDay(new Date());
  const since = utcDay(new Date(Date.parse(`${today}T00:00:00Z`) - (days - 1) * DAY));
  const db = adminClient();
  const { data, error } = await db.from("bio_views").select("day, views, clicks, referrers, items").eq("page_id", page.id).gte("day", since);
  if (error) throw new Error(error.message);
  const s = sumStats((data ?? []) as DayRow[], days, today);
  const items = s.items.slice(0, 10);
  // Names for each item: its block today, else the link it pointed at (a deleted block), else the post's text.
  const blocks = new Map(page.blocks.map((b) => [b.id, b]));
  const { data: owned } = await db.from("links").select("item, url").eq("page_id", page.id);
  const urls = new Map((owned ?? []).map((r) => [r.item as string, r.url as string]));
  const postIds = items.map((i) => i.item.split(".p.")[1]).filter((id): id is string => !!id && UUID.test(id));
  const { data: posts } = postIds.length ? await db.from("posts").select("id, text").eq("workspace_id", workspaceId).in("id", postIds) : { data: [] };
  const texts = new Map((posts ?? []).map((p) => [p.id as string, String(p.text ?? "")]));
  const host = (u: string | undefined) => {
    try {
      return u ? new URL(u).hostname.replace(/^www\./, "") : "";
    } catch {
      return "";
    }
  };
  const top: TopItem[] = items.map(({ item, clicks }) => {
    const [blockId, rest, postId] = item.split(".");
    const b = blocks.get(blockId);
    if (rest === "p" && postId) return { item, label: (texts.get(postId) || "Post").split("\n")[0].slice(0, 80), sub: BLOCK_NAMES.posts, kind: "post", clicks };
    if (rest) {
      const s = socialOf(rest);
      return { item, label: s?.name ?? rest, sub: host(urls.get(item)) || BLOCK_NAMES.social, kind: "social", network: s?.id, clicks };
    }
    if (b?.type === "link") return { item, label: b.label, sub: host(b.url), kind: "link", clicks };
    if (b?.type === "video") return { item, label: b.title || BLOCK_NAMES.video, sub: host(b.url), kind: "video", clicks };
    return { item, label: host(urls.get(item)) || "Removed link", sub: "Removed", kind: "link", clicks };
  });
  return { days: s.days, daily: s.daily, views: s.views, clicks: s.clicks, rate: s.rate, referrers: s.referrers.slice(0, 10), top };
}

/** Where a page lives: capybaroar.com/<slug> once BIO_URL is set (the site serves it), else the app's /b/<slug>. */
export const bioBase = () => (process.env.BIO_URL ? process.env.BIO_URL.replace(/\/$/, "") : `${appUrl()}/b`);
export const bioUrl = (slug: string) => `${bioBase()}/${slug}`;

export type { BioDraft, BioPage };
