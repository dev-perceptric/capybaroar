import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { after } from "next/server";
import { bioUrl, publicBio, recordView } from "@/lib/bio";
import { clientIp } from "@/lib/bioViews";
import { themeOf } from "@/lib/bioThemes";
import { BioCard } from "@/components/BioCard";

// Public link-in-bio pages, made fresh on every visit so an edit, a scheduled link or a delete shows on every server
// at once. The visit is counted after the page is sent (src/lib/bioViews.ts has the rules).
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await publicBio(slug);
  if (!data) return { title: "Not found", robots: { index: false } };
  const { page, shareImage } = data;
  const title = page.seo_title || page.title || "Links";
  const description = (page.seo_description || page.bio).slice(0, 200) || undefined;
  const url = bioUrl(slug);
  const images = shareImage ? [{ url: shareImage }] : undefined;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", url, title, description, images },
    twitter: { card: page.share_media_id && shareImage ? "summary_large_image" : "summary", title, description, images: shareImage ? [shareImage] : undefined },
  };
}

export async function generateViewport({ params }: Props): Promise<Viewport> {
  const data = await publicBio((await params).slug);
  return { themeColor: themeOf(data?.page.appearance.theme).bg };
}

export default async function BioPublicPage({ params }: Props) {
  const data = await publicBio((await params).slug);
  if (!data) notFound();
  const h = await headers();
  // Browsers that load a page ahead of a click (speculation, prefetch) haven't visited yet.
  const ahead = /prefetch|prerender/i.test(`${h.get("sec-purpose") ?? ""} ${h.get("purpose") ?? ""}`);
  if (!ahead) {
    const hit = { ip: clientIp(h), ua: h.get("user-agent"), referer: h.get("referer") };
    after(() => recordView(data.page.id, hit));
  }
  return <BioCard view={data.view} />;
}
