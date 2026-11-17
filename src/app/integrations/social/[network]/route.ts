import { NextResponse, type NextRequest } from "next/server";
import { adminClient } from "@/lib/supabase/server";
import { providerOf } from "@/lib/providers";
import { appUrl, redirectFor, saveAccounts } from "@/lib/channels";
import { userClient } from "@/lib/supabase/server";
import { STATE_COOKIE, STATE_PATH, callbackProblem, linkCallbackProblem, networkError } from "@/lib/oauthState";
import { open } from "@/lib/crypto";
import { linkSession } from "@/lib/partner";
import { CONNECT_COOKIE, readConnectCookie } from "@/lib/partnerRules";
import type { NetworkId } from "@/lib/networks";

const ROW = "workspace_id, brand_id, user_id, verifier, input, created_at";
type Row = { workspace_id: string; brand_id: string | null; user_id: string; verifier: string | null; input: Record<string, string> | null; created_at: string };

// The network sends people back here after they approve. The state ties it to the workspace that asked. A sign-in
// started from a connect link (a partner's customer, no account) finishes here too, back to the link's page.
export async function GET(request: NextRequest, { params }: { params: Promise<{ network: string }> }) {
  const { network } = await params;
  const q = request.nextUrl.searchParams;
  const backTo = (page: string) => (error?: string) => {
    const res = NextResponse.redirect(`${appUrl()}${page}${error ? `?error=${encodeURIComponent(error)}` : `?connected=${network}`}`);
    res.cookies.set(STATE_COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", path: STATE_PATH, maxAge: 0 });
    return res;
  };
  const state = q.get("state");
  const code = q.get("code");
  const cookieState = request.cookies.get(STATE_COOKIE)?.value ?? null;
  const db = adminClient();

  // A connect link in this browser that started this sign-in.
  const linkCookie = readConnectCookie(request.cookies.get(CONNECT_COOKIE)?.value);
  const session = linkCookie && state ? await linkSession(linkCookie) : null;
  if (session && "link" in session) {
    const link = session.link;
    const { data: started } = await db.from("oauth_states").select("created_at").eq("state", state!).eq("network", network).eq("connect_link_id", link.id).maybeSingle();
    if (started) {
      const back = backTo("/connect");
      if (q.get("error")) return back(networkError(q.get("error")));
      if (!code) return back("Sign-in didn't finish");
      // Checked before the state is used up.
      const early = linkCallbackProblem({ state: state!, cookieState, createdAt: started.created_at as string });
      if (early) return back(early);
      const { data: row } = await db.from("oauth_states").delete().eq("state", state!).eq("connect_link_id", link.id).select(ROW).maybeSingle();
      if (!row) return back("Sign-in expired, try again");
      return finish(row as Row, state!, code, link.brand_id, back, true);
    }
  }

  const back = backTo("/channels");
  if (q.get("error")) return back(networkError(q.get("error")));
  if (!state || !code) return back("Sign-in didn't finish");
  const { data: claims } = await (await userClient()).auth.getClaims();
  const sessionUserId = (claims?.claims?.sub as string | undefined) ?? null;
  // Only the person who started it, in the browser that started it, can finish it. Checked before the state is used up.
  if (!sessionUserId || cookieState !== state) return back(callbackProblem({ state, cookieState, rowUserId: null, sessionUserId, createdAt: new Date() }) ?? "Sign-in didn't finish");
  const { data: row } = await db.from("oauth_states").delete().eq("state", state).eq("network", network).eq("user_id", sessionUserId).is("connect_link_id", null).select(ROW).maybeSingle();
  if (!row) return back("Sign-in expired, try again");
  const problem = callbackProblem({ state, cookieState, rowUserId: row.user_id as string | null, sessionUserId, createdAt: row.created_at as string });
  if (problem) return back(problem);
  return finish(row as Row, state, code, (row.brand_id as string | null) ?? null, back, false);

  async function finish(row: Row, st: string, c: string, brandId: string | null, done: (error?: string) => NextResponse, fromLink: boolean) {
    const p = providerOf(network);
    if (!p?.oauth) return done("This network isn't set up");
    try {
      // Sealed by the connect route; rows from before sealing hold the values as they are.
      const kept = (row.input ?? {}) as Record<string, string>;
      const input = typeof kept.sealed === "string" ? (JSON.parse(open(kept.sealed, `oauth:${st}`)) as Record<string, string>) : kept;
      const accounts = await p.oauth.exchange({ code: c, verifier: row.verifier ?? "", redirect: redirectFor(network), input });
      if (fromLink && accounts.length) {
        // A connect link only adds to its own brand: an account already in another brand of the workspace stays there.
        const { data: taken } = await db.from("channels").select("brand_id").eq("workspace_id", row.workspace_id).eq("network", network).in("account_id", accounts.map((a) => a.accountId));
        if ((taken ?? []).some((t) => t.brand_id !== brandId)) return done("This account is already connected somewhere else");
      }
      await saveAccounts(row.workspace_id, network as NetworkId, accounts, brandId);
    } catch (e) {
      return done(e instanceof Error ? e.message : String(e));
    }
    return done();
  }
}
