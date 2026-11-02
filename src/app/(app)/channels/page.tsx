import { Plug } from "lucide-react";
import { Page } from "@/components/ui";
import { ChannelsView } from "@/components/ChannelsView";
import { listChannels } from "@/lib/channels";
import { getBrandCtx } from "@/lib/brands";
import { canManage } from "@/lib/session";
import { redirect } from "next/navigation";
import { PROVIDERS, isReady } from "@/lib/providers";
import { NETWORKS } from "@/lib/networks";

export default async function ChannelsPage({ searchParams }: { searchParams: Promise<{ error?: string; connected?: string }> }) {
  const b = await getBrandCtx();
  if (b.role === "client") redirect("/calendar");
  const channels = await listChannels(b.workspaceId, b.scope);
  const q = await searchParams;
  const ready = NETWORKS.filter((n) => isReady(PROVIDERS[n.id])).map((n) => n.id);
  // What each network asks before connecting: a form (Bluesky, Telegram, Discord) or a field before sign-in (Mastodon).
  const asks = Object.fromEntries(
    NETWORKS.map((n) => {
      const p = PROVIDERS[n.id];
      return [n.id, p.form ? { kind: "form" as const, fields: p.form.fields } : p.oauth?.asks?.length ? { kind: "oauth" as const, fields: p.oauth.asks } : null];
    }),
  );
  return (
    <Page icon={<Plug />} title="Channels" count={channels.length || undefined}>
      <ChannelsView channels={channels} ready={ready} asks={asks} error={q.error ?? null} brands={canManage(b.role) && b.brands.length > 1 ? b.brands.map((x) => ({ id: x.id, name: x.name })) : []} />
    </Page>
  );
}
