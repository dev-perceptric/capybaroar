import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { Page } from "@/components/ui";
import { ToolIntro } from "@/components/ToolIntro";
import { AnalyticsView } from "@/components/AnalyticsView";
import { listChannels } from "@/lib/channels";
import { getCtx } from "@/lib/session";
import { analytics } from "@/lib/analytics";

const RANGES = [7, 30, 90];

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string; channel?: string }> }) {
  const ctx = await getCtx();
  const q = await searchParams;
  const days = RANGES.includes(Number(q.days)) ? Number(q.days) : 30;
  const asked = q.channel ?? null;
  // The numbers load alongside the channels. A channel that isn't this workspace's loads again for all channels.
  const [channels, first] = await Promise.all([listChannels(ctx.workspaceId), analytics(ctx.workspaceId, ctx.timezone, days, asked).catch(() => null)]);
  if (!channels.length)
    return (
      <Page icon={<BarChart3 />} title="Analytics">
        <ToolIntro
          drawing="dashboards"
          title="See how your posts do"
          lead="Reach, engagement and followers for every channel, and the best times to post."
          action={
            <Link href="/channels" className="inline-flex h-8 items-center border border-frame bg-yolk px-3 text-[12px] font-medium text-on-yolk hover:bg-yolk-hover">
              Connect a channel
            </Link>
          }
        />
      </Page>
    );
  const channel = channels.some((c) => c.id === asked) ? asked : null;
  const data = first && channel === asked ? first : await analytics(ctx.workspaceId, ctx.timezone, days, channel);
  return (
    <Page icon={<BarChart3 />} title="Analytics" flush>
      <AnalyticsView data={data} channels={channels} channel={channel} timezone={ctx.timezone} />
    </Page>
  );
}
