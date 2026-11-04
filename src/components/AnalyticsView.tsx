"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Chip, Segmented } from "./ui";
import { NetworkLogo } from "./NetworkLogo";
import { Bars, Followers, Formats, Heatmap, Section, Tiles, TopPosts } from "./Charts";
import type { Channel } from "@/lib/channels";
import type { Analytics } from "@/lib/analytics";
import { fmtParts } from "@/lib/format";

export function AnalyticsView({ data, channels, channel, timezone }: { data: Analytics; channels: Channel[]; channel: string | null; timezone: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const go = (k: string, v: string | null) => {
    const p = new URLSearchParams(params.toString());
    if (v) p.set(k, v);
    else p.delete(k);
    router.push(`/analytics?${p}`);
  };
  const shown = channel ? channels.filter((c) => c.id === channel) : channels;
  const noStats = data.current.posts > 0 && data.current.withStats === 0;

  return (
    <div className="mx-auto w-full max-w-[1200px] p-4 pb-10 md:p-6 md:pb-12">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-[22px] leading-none font-semibold tracking-[-0.03em]">
          Last {data.days} days <span className="text-faint">since {fmtParts(`${data.since}T12:00:00`, { month: "short", day: "numeric" })}</span>
        </h2>
        <span className="flex-1" />
        <Segmented
          label="Period"
          value={String(data.days)}
          onChange={(v) => go("days", v)}
          options={[
            { value: "7", label: "7 days" },
            { value: "30", label: "30 days" },
            { value: "90", label: "90 days" },
          ]}
        />
      </div>
      <div className="-mx-4 mt-4 flex gap-1.5 overflow-x-auto px-4 py-0.5 [scrollbar-width:none] md:mx-0 md:px-0.5">
        <Chip on={!channel} onClick={() => go("channel", null)}>
          All channels
        </Chip>
        {channels.map((c) => (
          <Chip key={c.id} on={channel === c.id} onClick={() => go("channel", c.id)}>
            <NetworkLogo id={c.network} size={14} />
            <span className="max-w-40 truncate">{c.name}</span>
          </Chip>
        ))}
      </div>

      <div className="mt-5">
        <Tiles data={data} />
      </div>
      {noStats ? <p className="mt-2 text-[12px] text-muted">Results arrive 1 hour after a post goes out.</p> : null}

      <Section title="Engagements by day">
        <Bars daily={data.daily} />
      </Section>

      <div className="grid gap-x-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Section title="Best time to post" note={timezone.replace(/_/g, " ")}>
          <Heatmap cells={data.best} />
        </Section>
        <Section title="What works">
          <Formats formats={data.formats} />
        </Section>
      </div>

      <Section title="Top posts">
        <TopPosts top={data.top} channels={channels} timezone={timezone} />
      </Section>

      <Section title="Followers">
        <Followers data={data} channels={shown} />
      </Section>
    </div>
  );
}
