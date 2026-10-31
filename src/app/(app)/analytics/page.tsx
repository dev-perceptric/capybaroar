import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { Page } from "@/components/ui";
import { ToolIntro } from "@/components/ToolIntro";
import { NetworkLogo } from "@/components/NetworkLogo";
import { FollowerLine } from "@/components/FollowerLine";
import { listChannels } from "@/lib/channels";
import { getCtx } from "@/lib/session";
import { last30 } from "@/lib/analytics";
import { networkOf } from "@/lib/networks";

const num = (n: number) => n.toLocaleString("en-US");

export default async function AnalyticsPage() {
  const ctx = await getCtx();
  const channels = await listChannels(ctx.workspaceId);
  if (!channels.length)
    return (
      <Page icon={<BarChart3 />} title="Analytics">
        <ToolIntro
          drawing="dashboards"
          title="See how your channels grow"
          lead="Followers for every channel and what you posted, in one place."
          action={
            <Link href="/channels" className="inline-flex h-8 items-center border border-frame bg-yolk px-3 text-[12px] font-medium text-on-yolk hover:bg-yolk-hover">
              Connect a channel
            </Link>
          }
        />
      </Page>
    );
  const { metrics, targets } = await last30(ctx.workspaceId);
  const published = targets.filter((t) => t.status === "published");
  const failed = targets.length - published.length;
  return (
    <Page icon={<BarChart3 />} title="Analytics">
      <div className="mx-auto w-full max-w-[1100px]">
        <div className="grid grid-cols-2 border border-frame md:grid-cols-3">
          <Tile label="Channels" value={num(channels.length)} />
          <Tile label="Posts out, last 30 days" value={num(published.length)} />
          <Tile label="Failed, last 30 days" value={num(failed)} />
        </div>
        <p className="label-mono mt-8 mb-2">
          <span className="bracket">Followers, last 30 days</span>
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          {channels.map((c) => {
            const points = metrics.filter((m) => m.channel_id === c.id && m.followers != null).map((m) => ({ day: m.day, value: m.followers as number }));
            const last = points.at(-1)?.value;
            const first = points[0]?.value;
            const posts = published.filter((t) => t.channel_id === c.id).length;
            return (
              <section key={c.id} className="border border-frame p-3">
                <header className="flex items-center gap-2">
                  <NetworkLogo id={c.network} size={16} />
                  <h3 className="min-w-0 flex-1 truncate text-[13px] font-medium">{c.name}</h3>
                  <span className="text-[12px] text-muted">{num(posts)} posts</span>
                </header>
                <p className="mt-2 flex items-baseline gap-2">
                  <span className="text-[24px] font-[350] tabular-nums">{last != null ? num(last) : "None yet"}</span>
                  {last != null && first != null && points.length > 1 ? (
                    <span className="text-[12px] text-muted tabular-nums">
                      {last - first >= 0 ? "+" : ""}
                      {num(last - first)} in {points.length} days
                    </span>
                  ) : null}
                </p>
                {points.length > 1 ? <FollowerLine points={points} label={`${c.name} followers`} /> : <p className="mt-2 text-[12px] text-faint">{networkOf(c.network).name} followers are recorded once a day.</p>}
              </section>
            );
          })}
        </div>
      </div>
    </Page>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-line p-4 not-last:border-r">
      <p className="text-[12px] text-muted">{label}</p>
      <p className="mt-1 text-[24px] font-[350] tabular-nums">{value}</p>
    </div>
  );
}
