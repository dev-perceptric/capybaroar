import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getCtx } from "@/lib/session";
import { adminClient } from "@/lib/supabase/server";
import { providerOf } from "@/lib/providers";
import { redirectFor } from "@/lib/channels";

// Start connecting a channel: remember who asked (and what they typed, like a Mastodon server), then send them
// to the network's sign-in.
export async function GET(request: NextRequest, { params }: { params: Promise<{ network: string }> }) {
  const { network } = await params;
  const p = providerOf(network);
  if (!p?.oauth?.configured()) return NextResponse.json({ error: "This network isn't set up" }, { status: 404 });
  const ctx = await getCtx();
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
  const { error } = await adminClient().from("oauth_states").insert({ state, workspace_id: ctx.workspaceId, user_id: ctx.userId, network, verifier, input });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.redirect(url);
}
