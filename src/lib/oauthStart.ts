import "server-only";
import { randomBytes } from "node:crypto";
import type { NextResponse } from "next/server";
import { adminClient } from "./supabase/server";
import { redirectFor } from "./channels";
import { seal } from "./crypto";
import { STATE_COOKIE, STATE_PATH, STATE_TTL_MS } from "./oauthState";
import type { Provider } from "./providers/types";

// Starting a network's sign-in, shared by the Channels page (a signed-in member) and connect links (a partner's
// customer, no account). Both finish in the same callback (src/app/integrations/social/[network]).

type OAuth = NonNullable<Provider["oauth"]>;

/**
 * Remember who asked (and what they typed, like a Mastodon server) and return the network's sign-in address. The
 * values kept until the callback (a Mastodon app's client secret) are sealed, bound to the state.
 */
export async function beginSignIn(o: { oauth: OAuth; network: string; workspaceId: string; brandId: string | null; userId: string; connectLinkId?: string | null; input: Record<string, string> }): Promise<{ url: string; state: string }> {
  const input = { ...o.input };
  const state = randomBytes(24).toString("base64url");
  const verifier = randomBytes(32).toString("base64url");
  const r = await o.oauth.authUrl({ state, verifier, redirect: redirectFor(o.network), input });
  let url: string;
  if (typeof r === "string") url = r;
  else {
    url = r.url;
    Object.assign(input, r.keep);
  }
  const { error } = await adminClient()
    .from("oauth_states")
    .insert({ state, workspace_id: o.workspaceId, brand_id: o.brandId, user_id: o.userId, network: o.network, verifier, input: { sealed: seal(JSON.stringify(input), `oauth:${state}`) }, ...(o.connectLinkId ? { connect_link_id: o.connectLinkId } : {}) });
  if (error) throw new Error(error.message);
  return { url, state };
}

/** The callback checks this browser started it: a sign-in link sent to someone else can't finish in their browser. */
export function setStateCookie(res: NextResponse, state: string) {
  res.cookies.set(STATE_COOKIE, state, { httpOnly: true, secure: true, sameSite: "lax", path: STATE_PATH, maxAge: STATE_TTL_MS / 1000 });
  return res;
}
