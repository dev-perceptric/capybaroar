import { NextResponse } from "next/server";
import { openPost } from "@/lib/bio";
import { isBot } from "@/lib/bioViews";

// A latest-posts tile: count the click for the page, then go to the post (or the link the team set for it).
export async function GET(req: Request, { params }: { params: Promise<{ slug: string; block: string; post: string }> }) {
  const { slug, block, post } = await params;
  const url = await openPost(slug, block, post, !isBot(req.headers.get("user-agent")));
  return NextResponse.redirect(url ?? new URL(`/b/${slug}`, req.url), url ? 302 : 307);
}
