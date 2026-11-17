import type { Metadata } from "next";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { LinkMessage, StartCard } from "@/components/ConnectCard";
import { brandName, linkByToken, linkSession } from "@/lib/partner";
import { CONNECT_COOKIE, LINK_MESSAGES, linkProblem, readConnectCookie } from "@/lib/partnerRules";

export const metadata: Metadata = { title: "Connect your accounts", robots: { index: false, follow: false }, referrer: "no-referrer" };

// A partner's connect link, opened signed out. Opening it changes nothing (link previews open links too): pressing
// Start claims it for this browser.
export default async function ConnectLinkPage({ params }: { params: Promise<{ token: string }> }) {
  await connection();
  const { token } = await params;
  const link = await linkByToken(token);
  const mine = readConnectCookie((await cookies()).get(CONNECT_COOKIE)?.value);
  if (link && mine?.linkId === link.id && "link" in (await linkSession(mine))) redirect("/connect");
  const problem = linkProblem(link, null);
  if (problem) return <LinkMessage {...LINK_MESSAGES[problem]} />;
  return <StartCard token={token} brand={(await brandName(link!.brand_id)) ?? "your brand"} />;
}
