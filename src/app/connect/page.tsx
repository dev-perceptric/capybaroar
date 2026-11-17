import type { Metadata } from "next";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { ConnectCard, LinkMessage } from "@/components/ConnectCard";
import { listChannels } from "@/lib/channels";
import { brandName, linkNetworks, linkSession } from "@/lib/partner";
import { CONNECT_COOKIE, LINK_MESSAGES, readConnectCookie } from "@/lib/partnerRules";

export const metadata: Metadata = { title: "Connect your accounts", robots: { index: false, follow: false } };

// The claimed connect link in this browser: its brand's channels and the networks to sign in to. Nothing else of the
// workspace is shown or reachable from here.
export default async function ConnectPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await connection();
  const s = await linkSession(readConnectCookie((await cookies()).get(CONNECT_COOKIE)?.value));
  if ("problem" in s) return <LinkMessage {...LINK_MESSAGES[s.problem]} />;
  const [brand, channels] = await Promise.all([brandName(s.link.brand_id), listChannels(s.link.workspace_id, [s.link.brand_id])]);
  const q = await searchParams;
  return (
    <ConnectCard
      brand={brand ?? ""}
      channels={channels.map((c) => ({ id: c.id, name: c.name, avatar: c.avatar, network: c.network }))}
      networks={linkNetworks()}
      error={typeof q.error === "string" ? q.error.slice(0, 200) : null}
    />
  );
}
