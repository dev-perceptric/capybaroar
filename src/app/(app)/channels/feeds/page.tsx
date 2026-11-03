import { redirect } from "next/navigation";
import { Plug } from "lucide-react";
import { Page } from "@/components/ui";
import { ChannelTabs } from "@/components/ChannelTabs";
import { FeedsView } from "@/components/FeedsView";
import { getBrandCtx, homeBrand } from "@/lib/brands";
import { listChannels } from "@/lib/channels";
import { listFeeds } from "@/lib/feeds";

export default async function FeedsPage() {
  const b = await getBrandCtx();
  if (b.role === "client") redirect("/calendar");
  const [feeds, channels] = await Promise.all([listFeeds(b.workspaceId, b.scope), listChannels(b.workspaceId, b.scope)]);
  return (
    <Page icon={<Plug />} title="Channels" tabs={<ChannelTabs />}>
      <FeedsView feeds={feeds} channels={channels} brands={b.brands.filter((x) => !b.scope || b.scope.includes(x.id)).map((x) => ({ id: x.id, name: x.name }))} brandId={homeBrand(b)} />
    </Page>
  );
}
