import { NextResponse } from "next/server";
import { videoThumb } from "@/lib/bio";

// A video block's picture: a redirect to it (the one picked from Media, YouTube's or TikTok's), or a plain frame
// when the network gives none, so the page never shows a broken image.
const FRAME = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9" width="640" height="360"><rect width="16" height="9" fill="currentColor" fill-opacity=".06"/></svg>`;

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string; block: string }> }) {
  const { slug, block } = await params;
  const url = await videoThumb(slug, block);
  if (url) {
    const res = NextResponse.redirect(url, 302);
    res.headers.set("Cache-Control", "public, max-age=600");
    return res;
  }
  return new NextResponse(FRAME, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=600" } });
}
