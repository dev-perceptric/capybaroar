import { BarChart3 } from "lucide-react";
import { LinkButton, Page } from "@/components/ui";
import { ToolIntro } from "@/components/ToolIntro";
import { AnalyticsView } from "@/components/AnalyticsView";
import { listChannels } from "@/lib/channels";
import { teamCtx } from "@/lib/session";
import { getBrandCtx } from "@/lib/brands";
import { analytics } from "@/lib/analytics";

const RANGES = [7, 30, 90];

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string; channel?: string }> }) {
  await teamCtx();
  const ctx = await getBrandCtx();
  const channels = await listChannels(ctx.workspaceId, ctx.scope);
  if (!channels.length)
    return (
      <Page icon={<BarChart3 />} title="Analytics">
        <ToolIntro
          drawing="dashboards"
          title="See how your posts do"
          lead="Reach, engagement and followers for every channel, and the best times to post."
          action={<LinkButton href="/channels">Connect a channel</LinkButton>}
        />
      </Page>
    );
  const q = await searchParams;
  const days = RANGES.includes(Number(q.days)) ? Number(q.days) : 30;
  const channel = channels.some((c) => c.id === q.channel) ? q.channel! : null;
  const data = await analytics(ctx.workspaceId, ctx.timezone, days, channel ?? (ctx.scope ? channels.map((c) => c.id) : null));
  return (
    <Page icon={<BarChart3 />} title="Analytics" flush>
      <AnalyticsView data={data} channels={channels} channel={channel} timezone={ctx.timezone} />
    </Page>
  );
}
