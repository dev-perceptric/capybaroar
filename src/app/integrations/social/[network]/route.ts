import { NextResponse, type NextRequest } from "next/server";
import { adminClient } from "@/lib/supabase/server";
import { providerOf } from "@/lib/providers";
import { appUrl, redirectFor, saveAccounts } from "@/lib/channels";
import type { NetworkId } from "@/lib/networks";

// The network sends people back here after they approve. The state ties it to the workspace that asked.
export async function GET(request: NextRequest, { params }: { params: Promise<{ network: string }> }) {
  const { network } = await params;
  const q = request.nextUrl.searchParams;
  const back = (error?: string) => NextResponse.redirect(`${appUrl()}/channels${error ? `?error=${encodeURIComponent(error)}` : `?connected=${network}`}`);
  const state = q.get("state");
  const code = q.get("code");
  if (q.get("error")) return back(q.get("error_description") || q.get("error") || "Sign-in was cancelled");
  if (!state || !code) return back("Sign-in didn't finish");
  const db = adminClient();
  const { data: row } = await db.from("oauth_states").delete().eq("state", state).eq("network", network).select("workspace_id, verifier, created_at").maybeSingle();
  if (!row || Date.now() - new Date(row.created_at).getTime() > 15 * 60 * 1000) return back("Sign-in expired, try again");
  const p = providerOf(network);
  if (!p?.oauth) return back("This network isn't set up");
  try {
    const accounts = await p.oauth.exchange({ code, verifier: row.verifier ?? "", redirect: redirectFor(network) });
    await saveAccounts(row.workspace_id, network as NetworkId, accounts);
  } catch (e) {
    return back(e instanceof Error ? e.message : String(e));
  }
  return back();
}
