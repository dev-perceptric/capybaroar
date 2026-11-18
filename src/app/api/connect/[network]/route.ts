import { NextResponse, type NextRequest } from "next/server";
import { providerOf } from "@/lib/providers";
import { appUrl } from "@/lib/channels";
import { fromAnotherSite } from "@/lib/oauthState";
import { beginSignIn, setStateCookie } from "@/lib/oauthStart";
import { linkNetworks, linkSession } from "@/lib/partner";
import { CONNECT_COOKIE, readConnectCookie } from "@/lib/partnerRules";

export const dynamic = "force-dynamic";

// Start a network's sign-in from a connect link: for that link's brand only, in the browser that claimed the link.
// The same sign-in the Channels page starts (beginSignIn) and the same callback.
export async function GET(request: NextRequest, { params }: { params: Promise<{ network: string }> }) {
  const { network } = await params;
  const back = (error?: string) => NextResponse.redirect(new URL(`/connect${error ? `?error=${encodeURIComponent(error)}` : ""}`, appUrl()));
  const p = providerOf(network);
  if (!p?.oauth || !linkNetworks().includes(network as never)) return back("This network can't be connected here");
  if (fromAnotherSite(request.headers, new URL(appUrl()).origin)) return back();
  const s = await linkSession(readConnectCookie(request.cookies.get(CONNECT_COOKIE)?.value));
  if ("problem" in s) return back();
  let started: { url: string; state: string };
  try {
    started = await beginSignIn({ oauth: p.oauth, network, workspaceId: s.link.workspace_id, brandId: s.link.brand_id, userId: s.link.created_by, connectLinkId: s.link.id, input: {} });
  } catch (e) {
    return back(e instanceof Error ? e.message : String(e));
  }
  return setStateCookie(NextResponse.redirect(started.url), started.state);
}
