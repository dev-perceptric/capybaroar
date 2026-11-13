import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getBrandCtx, homeBrand } from "@/lib/brands";
import { adminClient } from "@/lib/supabase/server";
import { providerOf } from "@/lib/providers";
import { appUrl, redirectFor } from "@/lib/channels";
import { STATE_COOKIE, STATE_PATH, STATE_TTL_MS, fromAnotherSite } from "@/lib/oauthState";
import { isPaused } from "@/lib/networks";

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
  const state = randomBytes(24).toString("base64url");
  const verifier = randomBytes(32).toString("base64url");
  let url: string;
  try {
    const r = await p.oauth.authUrl({ state, verifier, redirect: redirectFor(network), input });
    if (typeof r === "string") url = r;
    else {
      url = r.url;
      Object.assign(input, r.keep);
    }
  } catch (e) {
    return NextResponse.redirect(new URL(`/channels?error=${encodeURIComponent(e instanceof Error ? e.message : String(e))}`, request.url));
  }
  const { error } = await adminClient().from("oauth_states").insert({ state, workspace_id: ctx.workspaceId, brand_id: homeBrand(ctx), user_id: ctx.userId, network, verifier, input });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // The callback checks this browser started it: a sign-in link sent to someone else can't finish in their browser.
  const res = NextResponse.redirect(url);
  res.cookies.set(STATE_COOKIE, state, { httpOnly: true, secure: true, sameSite: "lax", path: STATE_PATH, maxAge: STATE_TTL_MS / 1000 });
  return res;
}
