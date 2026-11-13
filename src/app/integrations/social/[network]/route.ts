import { NextResponse, type NextRequest } from "next/server";
import { adminClient } from "@/lib/supabase/server";
import { providerOf } from "@/lib/providers";
import { appUrl, redirectFor, saveAccounts } from "@/lib/channels";
import { userClient } from "@/lib/supabase/server";
import { STATE_COOKIE, STATE_PATH, callbackProblem, networkError } from "@/lib/oauthState";
import type { NetworkId } from "@/lib/networks";

// The network sends people back here after they approve. The state ties it to the workspace that asked.
export async function GET(request: NextRequest, { params }: { params: Promise<{ network: string }> }) {
  const { network } = await params;
  const q = request.nextUrl.searchParams;
  const back = (error?: string) => {
    const res = NextResponse.redirect(`${appUrl()}/channels${error ? `?error=${encodeURIComponent(error)}` : `?connected=${network}`}`);
    res.cookies.set(STATE_COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", path: STATE_PATH, maxAge: 0 });
    return res;
  };
  const state = q.get("state");
  const code = q.get("code");
  if (q.get("error")) return back(networkError(q.get("error")));
  if (!state || !code) return back("Sign-in didn't finish");
  const db = adminClient();
  const { data: claims } = await (await userClient()).auth.getClaims();
  const sessionUserId = (claims?.claims?.sub as string | undefined) ?? null;
  const cookieState = request.cookies.get(STATE_COOKIE)?.value ?? null;
  // Only the person who started it, in the browser that started it, can finish it. Checked before the state is used up.
  if (!sessionUserId || cookieState !== state) return back(callbackProblem({ state, cookieState, rowUserId: null, sessionUserId, createdAt: new Date() }) ?? "Sign-in didn't finish");
  const { data: row } = await db.from("oauth_states").delete().eq("state", state).eq("network", network).eq("user_id", sessionUserId).select("workspace_id, brand_id, user_id, verifier, input, created_at").maybeSingle();
  if (!row) return back("Sign-in expired, try again");
  const problem = callbackProblem({ state, cookieState, rowUserId: row.user_id as string | null, sessionUserId, createdAt: row.created_at as string });
  if (problem) return back(problem);
  const p = providerOf(network);
  if (!p?.oauth) return back("This network isn't set up");
  try {
    const accounts = await p.oauth.exchange({ code, verifier: row.verifier ?? "", redirect: redirectFor(network), input: (row.input ?? {}) as Record<string, string> });
    await saveAccounts(row.workspace_id, network as NetworkId, accounts, (row.brand_id as string | null) ?? null);
  } catch (e) {
    return back(e instanceof Error ? e.message : String(e));
  }
  return back();
}
