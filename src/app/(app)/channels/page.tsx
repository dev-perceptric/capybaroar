import { Plug } from "lucide-react";
import { Page } from "@/components/ui";
import { ChannelsView } from "@/components/ChannelsView";
import { listChannels } from "@/lib/channels";
import { getCtx } from "@/lib/session";
import { PROVIDERS } from "@/lib/providers";
import { NETWORKS } from "@/lib/networks";

export default async function ChannelsPage({ searchParams }: { searchParams: Promise<{ error?: string; connected?: string }> }) {
  const ctx = await getCtx();
  const channels = await listChannels(ctx.workspaceId);
  const q = await searchParams;
  const ready = NETWORKS.filter((n) => {
    const p = PROVIDERS[n.id];
    return p && (!p.oauth || p.oauth.configured());
  }).map((n) => n.id);
  return (
    <Page icon={<Plug />} title="Channels" count={channels.length || undefined}>
      <ChannelsView channels={channels} ready={ready} error={q.error ?? null} />
    </Page>
  );
}
