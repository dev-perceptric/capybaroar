import { NextResponse } from "next/server";
import { bioMedia } from "@/lib/bio";

// A picture on a link-in-bio page: a fresh signed link each time, so a cached page never shows an expired one.
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const url = await bioMedia(slug, id);
  if (!url) return new NextResponse(null, { status: 404 });
  const res = NextResponse.redirect(url, 302);
  res.headers.set("Cache-Control", "public, max-age=1800");
  return res;
}
