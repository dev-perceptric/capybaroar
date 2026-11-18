import { NextResponse, type NextRequest } from "next/server";
import { getBrandCtx, homeBrand } from "@/lib/brands";
import { providerOf } from "@/lib/providers";
import { appUrl } from "@/lib/channels";
import { fromAnotherSite } from "@/lib/oauthState";
import { beginSignIn, setStateCookie } from "@/lib/oauthStart";
import { isPaused } from "@/lib/networks";
import { publicUrl } from "@/lib/publicUrl";

// Start connecting a channel: remember who asked (and what they typed, like a Mastodon server), then send them
// to the network's sign-in.
export async function GET(request: NextRequest, { params }: { params: Promise<{ network: string }> }) {
  const { network } = await params;
  const p = providerOf(network);
  if (!p?.oauth?.configured() || isPaused(network)) return NextResponse.json({ error: "This network isn't set up" }, { status: 404 });
  // A link on another site can't start a sign-in in someone's session (it could plant a channel in their workspace).
  if (fromAnotherSite(request.headers, new URL(appUrl()).origin)) return NextResponse.redirect(new URL("/channels", appUrl()));
  const ctx = await getBrandCtx();
  if (ctx.role === "client") return NextResponse.json({ error: "Clients can't connect channels" }, { status: 403 });
  const input: Record<string, string> = {};
  for (const a of p.oauth.asks ?? []) {
    const v = request.nextUrl.searchParams.get(a.key)?.trim();
    if (!v) return NextResponse.json({ error: `${a.label} is required` }, { status: 400 });
    input[a.key] = v;
  }
  let started: { url: string; state: string };
  try {
    started = await beginSignIn({ oauth: p.oauth, network, workspaceId: ctx.workspaceId, brandId: homeBrand(ctx), userId: ctx.userId, input });
  } catch (e) {
    return NextResponse.redirect(publicUrl(`/channels?error=${encodeURIComponent(e instanceof Error ? e.message : String(e))}`, request.headers));
  }
  return setStateCookie(NextResponse.redirect(started.url), started.state);
}
