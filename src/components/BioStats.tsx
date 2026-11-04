"use client";

import { useState } from "react";
import { Globe, LayoutGrid, Link2, Video } from "lucide-react";
import { ErrorNote, Loading, Rows, Segmented, StatCards, useLoad } from "./ui";
import { DayBars, NoResults, Section, num, pct } from "./Charts";
import { SocialIcon } from "./BioIcons";
import { fmtParts } from "@/lib/format";
import type { BioNumbers, TopItem } from "@/lib/bio";
import { loadBioStats } from "@/app/(app)/bio/actions";

// The Analytics tab: views and clicks by day, the links people pick and where they come from. Days are UTC.

function Lead({ t }: { t: TopItem }) {
  const icon = t.kind === "social" && t.network ? <SocialIcon id={t.network} size={14} /> : t.kind === "post" ? <LayoutGrid /> : t.kind === "video" ? <Video /> : <Link2 />;
  return <span className="flex size-7 items-center justify-center rounded-md bg-paper text-muted shadow-track [&_svg]:size-3.5">{icon}</span>;
}

export function BioStats({ brandId }: { brandId: string }) {
  const [days, setDays] = useState("30");
  const { data, error } = useLoad<BioNumbers>(async () => {
    const r = await loadBioStats(brandId, Number(days));
    if (r.error || !r.stats) throw new Error(r.error ?? "Couldn't load the numbers");
    return r.stats;
  }, `${brandId}:${days}`);
  return <BioNumbersView days={days} setDays={setDays} data={data} error={error} />;
}

/** The numbers themselves, for a period. */
export function BioNumbersView({ days, setDays, data, error }: { days: string; setDays: (d: string) => void; data: BioNumbers | null; error: string }) {
  const since = data?.daily[0]?.day;
  return (
    <div className="mx-auto w-full max-w-[1120px] pb-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-[22px] leading-none font-semibold tracking-[-0.03em]">
          Last {days} days {since ? <span className="text-faint">since {fmtParts(`${since}T12:00:00`, { month: "short", day: "numeric" })}</span> : null}
        </h2>
        <span className="flex-1" />
        <Segmented
          label="Period"
          value={days}
          onChange={setDays}
          options={[
            { value: "7", label: "7 days" },
            { value: "30", label: "30 days" },
            { value: "90", label: "90 days" },
          ]}
        />
      </div>
      <ErrorNote message={error} className="mt-4" />
      {!data ? (
        error ? null : <Loading />
      ) : (
        <>
          <StatCards
            className="mt-5"
            cards={[
              { label: "Views", value: num(data.views) },
              { label: "Clicks", value: num(data.clicks) },
              { label: "Click rate", value: data.rate != null ? pct(data.rate) : "None yet" },
            ]}
          />
          <div className="grid gap-x-6 lg:grid-cols-2">
            <Section title="Views by day">
              <DayBars label="Views by day" unit="views" days={data.daily.map((d) => ({ day: d.day, value: d.views }))} />
            </Section>
            <Section title="Clicks by day">
              <DayBars label="Clicks by day" unit="clicks" days={data.daily.map((d) => ({ day: d.day, value: d.clicks }))} />
            </Section>
          </div>
          <div className="grid gap-x-6 lg:grid-cols-2">
            <Section title="Top links">
              {data.top.length ? (
                <Rows label="Top links">
                  {data.top.map((t) => (
                    <div key={t.item} role="listitem" className="flex min-h-14 items-center gap-3 px-4 py-2.5">
                      <Lead t={t} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium">{t.label}</div>
                        {t.sub ? <div className="truncate text-[12px] text-muted">{t.sub}</div> : null}
                      </div>
                      <div className="text-right">
                        <div className="text-[13px] font-semibold tabular-nums">{num(t.clicks)}</div>
                        {data.views ? <div className="text-[11px] text-faint tabular-nums">{pct(t.clicks / data.views)}</div> : null}
                      </div>
                    </div>
                  ))}
                </Rows>
              ) : (
                <NoResults text="No clicks in this period yet" />
              )}
            </Section>
            <Section title="Top referrers">
              {data.referrers.length ? (
                <Rows label="Top referrers">
                  {data.referrers.map((r) => (
                    <div key={r.host || "direct"} role="listitem" className="flex min-h-12 items-center gap-3 px-4 py-2.5">
                      <span className="flex size-7 items-center justify-center rounded-md bg-paper text-muted shadow-track">
                        <Globe size={14} />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{r.host === "other" ? "Other" : r.host || "Direct"}</span>
                      <span className="text-[13px] font-semibold tabular-nums">{num(r.views)}</span>
                      <span className="w-14 text-right text-[11px] text-faint tabular-nums">{pct(r.views / Math.max(1, data.views))}</span>
                    </div>
                  ))}
                </Rows>
              ) : (
                <NoResults text="No visits in this period yet" />
              )}
            </Section>
          </div>
        </>
      )}
    </div>
  );
}
