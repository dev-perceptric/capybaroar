import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getCtx } from "@/lib/session";
import { adminClient } from "@/lib/supabase/server";
import { providerOf } from "@/lib/providers";
import { redirectFor } from "@/lib/channels";

// Start connecting a channel: remember who asked, then send them to the network's sign-in.
export async function GET(_: NextRequest, { params }: { params: Promise<{ network: string }> }) {
  const { network } = await params;
  const p = providerOf(network);
  if (!p?.oauth?.configured()) return NextResponse.json({ error: "This network isn't set up" }, { status: 404 });
  const ctx = await getCtx();
  const state = randomBytes(24).toString("base64url");
  const verifier = randomBytes(32).toString("base64url");
  const { error } = await adminClient().from("oauth_states").insert({ state, workspace_id: ctx.workspaceId, user_id: ctx.userId, network, verifier });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.redirect(p.oauth.authUrl({ state, verifier, redirect: redirectFor(network) }));
}
