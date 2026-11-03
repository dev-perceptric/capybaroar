import "server-only";
import { adminClient } from "./supabase/server";
import { appUrl } from "./channels";
import { shorten } from "./composer";
import { mediaThumbs } from "./media";

// A link-in-bio page per brand, public at /b/<slug>. Every link goes through a short link (public.links), so the
// page's clicks are counted with the rest.

export type BioLink = { label: string; url: string; code: string };
export type BioTheme = "light" | "dark";
export type BioPage = { id: string; brand_id: string; slug: string; title: string; bio: string; avatar_media_id: string | null; links: BioLink[]; show_posts: boolean; theme: BioTheme };
export type BioInput = { slug: string; title: string; bio: string; avatarMediaId: string | null; links: { label: string; url: string }[]; showPosts: boolean; theme: BioTheme };
/** What the page shows: the same for the public page and the editor's preview. */
export type BioView = { title: string; bio: string; avatar: string | null; links: { label: string; href: string }[]; posts: { text: string; url: string; thumb: string | null }[]; theme: BioTheme };

const COLS = "id, brand_id, slug, title, bio, avatar_media_id, links, show_posts, theme";
export const SLUG = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;

export const slugFrom = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40)
    .padEnd(3, "0");

export async function getBioPage(workspaceId: string, brandId: string): Promise<BioPage | null> {
  const { data, error } = await adminClient().from("bio_pages").select(COLS).eq("workspace_id", workspaceId).eq("brand_id", brandId).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as BioPage | null) ?? null;
}

const codeOf = (short: string) => short.slice(short.lastIndexOf("/") + 1);

export async function saveBioPage(workspaceId: string, brandId: string, input: BioInput): Promise<BioPage> {
  const slug = input.slug.trim().toLowerCase();
  if (!SLUG.test(slug)) throw new Error("Addresses are 3 to 40 lowercase letters, numbers and dashes");
  const title = input.title.trim();
  const bio = input.bio.trim();
  if (title.length > 80) throw new Error("Titles are up to 80 characters");
  if (bio.length > 300) throw new Error("Bios are up to 300 characters");
  if (input.links.length > 20) throw new Error("Up to 20 links");
  const db = adminClient();
  if (input.avatarMediaId) {
    const { data: m } = await db.from("media").select("mime").eq("id", input.avatarMediaId).eq("workspace_id", workspaceId).maybeSingle();
    if (!m || !String(m.mime).startsWith("image/")) throw new Error("Pick a picture for the avatar");
  }
  const links: BioLink[] = [];
  for (const l of input.links) {
    const label = l.label.trim();
    const url = l.url.trim();
    if (!label && !url) continue;
    if (!label) throw new Error("Give every link a label");
    if (label.length > 60) throw new Error("Labels are up to 60 characters");
    if (!/^https?:\/\/\S+$/i.test(url) || url.length > 2000) throw new Error(`${label}: use an http or https link`);
    links.push({ label, url, code: codeOf(await shorten(workspaceId, url)) });
  }
  const row = { workspace_id: workspaceId, brand_id: brandId, slug, title, bio, avatar_media_id: input.avatarMediaId, links, show_posts: input.showPosts, theme: input.theme === "dark" ? "dark" : "light", updated_at: new Date().toISOString() };
  const { data, error } = await db.from("bio_pages").upsert(row, { onConflict: "brand_id" }).select(COLS).single();
  if (error) throw new Error(error.code === "23505" ? "That address is taken" : error.message);
  return data as BioPage;
}

export async function deleteBioPage(workspaceId: string, brandId: string) {
  const { error } = await adminClient().from("bio_pages").delete().eq("workspace_id", workspaceId).eq("brand_id", brandId);
  if (error) throw new Error(error.message);
}

/** Clicks on each of the page's links, by short-link code. */
export async function bioClicks(workspaceId: string, codes: string[]): Promise<Record<string, number>> {
  if (!codes.length) return {};
  const { data } = await adminClient().from("links").select("code, clicks").eq("workspace_id", workspaceId).in("code", codes);
  return Object.fromEntries((data ?? []).map((r) => [r.code as string, r.clicks as number]));
}

/** A brand's newest published posts that have a link on their network, one per post, with their first picture. */
export async function latestPosts(workspaceId: string, brandId: string): Promise<{ text: string; url: string; mediaId: string | null }[]> {
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
    .order("published_at", { ascending: false })
    .limit(24);
  type Post = { text: string; media_ids: string[] };
  type Row = { post_id: string; url: string; text: string | null; posts: Post | Post[] | null };
  const seen = new Set<string>();
  const rows: { text: string; url: string; mediaId: string | null }[] = [];
  for (const r of (data ?? []) as unknown as Row[]) {
    if (seen.has(r.post_id)) continue;
    seen.add(r.post_id);
    const p = Array.isArray(r.posts) ? r.posts[0] : r.posts;
    rows.push({ text: (r.text ?? p?.text ?? "").slice(0, 280), url: r.url, mediaId: p?.media_ids?.[0] ?? null });
    if (rows.length === 6) break;
  }
  // Pictures only: a video's first frame needs the player.
  const kinds = await mediaThumbs(workspaceId, rows.map((r) => r.mediaId).filter((m): m is string => !!m));
  return rows.map((r) => ({ ...r, mediaId: kinds.some((k) => k.id === r.mediaId && k.mime.startsWith("image/")) ? r.mediaId : null }));
}

/**
 * The public page for an address, or null. Pictures go through /b/<slug>/media/<id>, which hands out a fresh signed
 * link each time, so a cached page never shows an expired one.
 */
export async function publicBio(slug: string): Promise<BioView | null> {
  if (!SLUG.test(slug)) return null;
  const { data } = await adminClient().from("bio_pages").select(`${COLS}, workspace_id`).eq("slug", slug).maybeSingle();
  if (!data) return null;
  const page = data as unknown as BioPage & { workspace_id: string };
  const media = (id: string) => `/b/${slug}/media/${id}`;
  const posts = page.show_posts ? await latestPosts(page.workspace_id, page.brand_id) : [];
  return {
    title: page.title,
    bio: page.bio,
    avatar: page.avatar_media_id ? media(page.avatar_media_id) : null,
    links: page.links.map((l) => ({ label: l.label, href: `/l/${l.code}` })),
    posts: posts.map((p) => ({ text: p.text, url: p.url, thumb: p.mediaId ? media(p.mediaId) : null })),
    theme: page.theme,
  };
}

/** A signed link to a picture the page at this address shows (its avatar or a picture in its brand's published posts). */
export async function bioMedia(slug: string, mediaId: string): Promise<string | null> {
  if (!SLUG.test(slug) || !/^[0-9a-f-]{36}$/i.test(mediaId)) return null;
  const db = adminClient();
  const { data: page } = await db.from("bio_pages").select("workspace_id, brand_id, avatar_media_id, show_posts").eq("slug", slug).maybeSingle();
  if (!page) return null;
  if (page.avatar_media_id !== mediaId) {
    if (!page.show_posts) return null;
    const { data: used } = await db.from("posts").select("id").eq("workspace_id", page.workspace_id).eq("brand_id", page.brand_id).in("status", ["published", "partial"]).contains("media_ids", [mediaId]).limit(1);
    if (!used?.length) return null;
  }
  const [m] = await mediaThumbs(page.workspace_id as string, [mediaId]);
  return m && m.mime.startsWith("image/") ? m.thumb : null;
}

export const bioUrl = (slug: string) => `${appUrl()}/b/${slug}`;
