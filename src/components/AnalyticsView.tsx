"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDownRight, ArrowUpRight, ExternalLink } from "lucide-react";
import { Avatar, Segmented } from "./ui";
import { NetworkLogo } from "./NetworkLogo";
import type { Channel } from "@/lib/channels";
import type { Analytics, BestCell } from "@/lib/analytics";

const num = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });
const pct = (n: number) => `${(n * 100).toLocaleString("en-US", { maximumFractionDigits: 1 })}%`;
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const hourShort = (h: number) => (h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`);
const hourLong = (h: number) => (h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`);

export function AnalyticsView({ data, channels, channel, timezone }: { data: Analytics; channels: Channel[]; channel: string | null; timezone: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const go = (k: string, v: string | null) => {
    const p = new URLSearchParams(params.toString());
    if (v) p.set(k, v);
    else p.delete(k);
    router.push(`/analytics?${p}`);
  };
  const byId = new Map(channels.map((c) => [c.id, c]));
  const shown = channel ? channels.filter((c) => c.id === channel) : channels;
  const noStats = data.current.posts > 0 && data.current.withStats === 0;

  return (
    <div className="mx-auto w-full max-w-[1200px] px-5 pt-5 pb-10">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-[22px] leading-none font-semibold tracking-[-0.03em]">
          Last {data.days} days <span className="text-faint">since {new Date(`${data.since}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
        </h2>
        <span className="flex-1" />
        <Segmented
          value={String(data.days)}
          onChange={(v) => go("days", v)}
          options={[
            { value: "7", label: "7 days" },
            { value: "30", label: "30 days" },
            { value: "90", label: "90 days" },
          ]}
        />
      </div>
      <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1">
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

      <div className="mt-5 grid grid-cols-2 overflow-hidden rounded-lg border border-frame md:grid-cols-4">
        <Tile label="Posts out" value={num(data.current.posts)} cur={data.current.posts} prev={data.previous.posts} />
        <Tile label="Reach" value={data.current.withStats ? num(data.current.views) : "None yet"} cur={data.current.views} prev={data.previous.views} show={data.current.withStats > 0} />
        <Tile label="Engagements" value={data.current.withStats ? num(data.current.engagement) : "None yet"} cur={data.current.engagement} prev={data.previous.engagement} show={data.current.withStats > 0} />
        <Tile label="Engagement rate" value={data.current.rate != null ? pct(data.current.rate) : "None yet"} cur={data.current.rate ?? 0} prev={data.previous.rate ?? 0} show={data.current.rate != null && data.previous.rate != null} ratio />
      </div>
      {noStats ? <p className="mt-2 text-[12px] text-muted">Results arrive 1 hour after a post goes out.</p> : null}

      <Section title="Engagements by day">
        <Bars daily={data.daily} />
      </Section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Section title="Best time to post" note={timezone.replace(/_/g, " ")}>
          <Heatmap cells={data.best} />
        </Section>
        <Section title="What works">
          <div className="overflow-hidden rounded-lg border border-frame">
            {data.formats.map((f) => (
              <div key={f.format} className="flex items-center gap-3 border-b border-line px-3 py-2.5 last:border-b-0">
                <span className="w-20 text-[13px] font-medium capitalize">{f.format}</span>
                <span className="flex-1 text-[12px] text-muted tabular-nums">
                  {num(f.posts)} post{f.posts === 1 ? "" : "s"}
                </span>
                <span className="text-[13px] tabular-nums">{f.avg != null ? `${num(f.avg)} avg engagements` : "No results yet"}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <Section title="Top posts">
        {data.top.length ? (
          <div className="overflow-x-auto rounded-lg border border-frame">
            <table className="w-full min-w-[720px] text-[13px]">
              <thead>
                <tr className="border-b border-line text-left text-[11px] tracking-[0.04em] text-faint uppercase">
                  <th className="px-3 py-2 font-medium">Post</th>
                  <th className="px-3 py-2 text-right font-medium">Reach</th>
                  <th className="px-3 py-2 text-right font-medium">Likes</th>
                  <th className="px-3 py-2 text-right font-medium">Comments</th>
                  <th className="px-3 py-2 text-right font-medium">Shares</th>
                  <th className="px-3 py-2 text-right font-medium">Engagements</th>
                  <th className="px-3 py-2 text-right font-medium">Rate</th>
                </tr>
              </thead>
              <tbody>
                {data.top.map((t) => {
                  const c = byId.get(t.channelId);
                  const reach = t.m?.reach ?? t.m?.views ?? t.m?.impressions;
                  return (
                    <tr key={t.id} className="border-b border-line-light last:border-b-0 hover:bg-hover">
                      <td className="max-w-[360px] px-3 py-2">
                        <div className="flex items-center gap-2">
                          {c ? <NetworkLogo id={c.network} size={14} /> : null}
                          <span className="min-w-0 truncate">{t.text || "No text"}</span>
                          {t.url ? (
                            <a href={t.url} target="_blank" rel="noreferrer" aria-label="Open post" className="shrink-0 text-muted hover:text-ink">
                              <ExternalLink size={13} />
                            </a>
                          ) : null}
                        </div>
                        <p className="mt-0.5 text-[11px] text-faint">
                          {c?.name}, {new Date(t.at).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: timezone })}
                        </p>
                      </td>
                      <Num v={reach} />
                      <Num v={t.m?.likes} />
                      <Num v={t.m?.comments} />
                      <Num v={t.m?.shares} />
                      <td className="px-3 py-2 text-right font-semibold tabular-nums">{num(t.m?.engagement ?? 0)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{t.rate != null ? pct(t.rate) : ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-line-strong px-4 py-8 text-center text-[13px] text-muted">No results in this period yet</p>
        )}
      </Section>

      <Section title="Followers">
        <div className="grid gap-3 md:grid-cols-2">
          {shown.map((c) => {
            const points = data.followers.filter((m) => m.channel_id === c.id && m.followers != null).map((m) => ({ day: m.day, value: m.followers as number }));
            const last = points.at(-1)?.value;
            const first = points.find((p) => p.day >= data.since)?.value ?? points[0]?.value;
            return (
              <div key={c.id} className="rounded-lg border border-frame p-3">
                <div className="flex items-center gap-2">
                  {c.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.avatar} alt="" className="size-5 rounded-full object-cover" />
                  ) : (
                    <Avatar label={c.name} size={20} />
                  )}
                  <NetworkLogo id={c.network} size={14} />
                  <h3 className="min-w-0 flex-1 truncate text-[13px] font-medium">{c.name}</h3>
                </div>
                <p className="mt-2 flex items-baseline gap-2">
                  <span className="text-[24px] font-[350] tabular-nums">{last != null ? num(last) : "None yet"}</span>
                  {last != null && first != null && points.length > 1 ? (
                    <span className={`text-[12px] tabular-nums ${last - first >= 0 ? "text-success" : "text-danger"}`}>
                      {last - first >= 0 ? "+" : ""}
                      {num(last - first)}
                    </span>
                  ) : null}
                </p>
                {points.length > 1 ? <Line points={points} label={`${c.name} followers`} /> : <p className="mt-1 text-[12px] text-faint">Recorded once a day</p>}
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={`flex h-8 shrink-0 items-center gap-2 rounded-md px-2.5 text-[12px] transition-[background-color,box-shadow] ${on ? "bg-signal-soft font-medium text-ink shadow-[0_0_0_1px_var(--signal-10)]" : "bg-panel text-ink/85 shadow-chip hover:bg-canvas"}`}>
      {children}
    </button>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <div className="mb-2 flex items-baseline gap-2">
        <p className="label-mono">
          {title}
        </p>
        {note ? <span className="text-[11px] text-faint">{note}</span> : null}
      </div>
      {children}
    </section>
  );
}

function Tile({ label, value, cur, prev, show = true, ratio = false }: { label: string; value: string; cur: number; prev: number; show?: boolean; ratio?: boolean }) {
  const delta = show && prev > 0 ? (cur - prev) / prev : null;
  return (
    <div className="border-line p-4 not-last:border-r max-md:[&:nth-child(2)]:border-r-0 max-md:[&:nth-child(-n+2)]:border-b">
      <p className="text-[12px] text-muted">{label}</p>
      <p className="mt-1 text-[26px] leading-tight font-[350] tabular-nums">{value}</p>
      <p className="mt-1 h-4 text-[11px] tabular-nums">
        {delta != null ? (
          <span className={`inline-flex items-center gap-0.5 ${delta >= 0 ? "text-success" : "text-danger"}`}>
            {delta >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {ratio ? `${((cur - prev) * 100).toFixed(1)} pts` : pct(Math.abs(delta))}
            <span className="ml-1 text-faint">vs previous</span>
          </span>
        ) : null}
      </p>
    </div>
  );
}

function Num({ v }: { v: number | null | undefined }) {
  return <td className="px-3 py-2 text-right tabular-nums">{v != null ? num(v) : <span className="text-faint">–</span>}</td>;
}

/** One series (engagements per day), so one ink color and no legend. Hover shows the day. */
function Bars({ daily }: { daily: { day: string; posts: number; engagement: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...daily.map((d) => d.engagement));
  const h = hover != null ? daily[hover] : null;
  return (
    <figure className="relative rounded-lg border border-frame px-3 pt-8 pb-2">
      {h ? (
        <figcaption className="pointer-events-none absolute top-2 right-3 rounded-md bg-panel px-2 py-0.5 text-[11px] tabular-nums shadow-pop">
          {new Date(`${h.day}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}: {num(h.engagement)} engagements, {h.posts} post{h.posts === 1 ? "" : "s"}
        </figcaption>
      ) : (
        <figcaption className="absolute top-2 right-3 text-[11px] text-faint tabular-nums">Max {num(max)}</figcaption>
      )}
      <div className="flex h-36 items-end gap-[2px]" onMouseLeave={() => setHover(null)} role="img" aria-label="Engagements by day">
        {daily.map((d, i) => (
          <div key={d.day} className="flex h-full min-w-0 flex-1 items-end" onMouseEnter={() => setHover(i)}>
            <div className={`w-full rounded-t-xs ${hover === i ? "bg-signal" : d.engagement ? "bg-ink" : "bg-line-light"}`} style={{ height: d.engagement ? `${Math.max(3, (d.engagement / max) * 100)}%` : "2px" }} />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-faint tabular-nums">
        <span>{new Date(`${daily[0]?.day}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
        <span>{new Date(`${daily.at(-1)?.day}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
      </div>
    </figure>
  );
}

/** Average engagements per post by weekday and hour: one hue, light to dark. Empty cells had no posts. */
function Heatmap({ cells }: { cells: BestCell[] }) {
  const [hover, setHover] = useState<BestCell | null>(null);
  const map = new Map(cells.map((c) => [`${c.day}:${c.hour}`, c]));
  const max = Math.max(0, ...cells.map((c) => c.engagement));
  const order = [1, 2, 3, 4, 5, 6, 0];
  const step = (v: number) => (max ? Math.min(4, Math.floor((v / max) * 5)) : 0);
  const shade = ["bg-[#e5e5e5]", "bg-[#bdbdbd]", "bg-[#8a8a8a]", "bg-[#4d4d4d]", "bg-ink"];
  const best = [...cells].filter((c) => c.posts >= 2).sort((a, b) => b.engagement - a.engagement)[0];
  return (
    <figure className="rounded-lg border border-frame p-3">
      <figcaption className="mb-2 h-4 text-[11px] tabular-nums">
        {hover ? (
          <span>
            {DAYS[hover.day]} {hourLong(hover.hour)}: {num(hover.engagement)} avg engagements over {hover.posts} post{hover.posts === 1 ? "" : "s"}
          </span>
        ) : best ? (
          <span className="text-muted">
            Best: <span className="font-medium text-ink">{DAYS[best.day]} at {hourLong(best.hour)}</span>
          </span>
        ) : (
          <span className="text-faint">Fills in as your posts get results</span>
        )}
      </figcaption>
      <div className="grid grid-cols-[32px_repeat(24,minmax(0,1fr))] gap-[2px]" onMouseLeave={() => setHover(null)}>
        {order.map((d) => (
          <div key={d} className="contents">
            <span className="flex items-center text-[10px] text-faint">{DAYS[d]}</span>
            {Array.from({ length: 24 }, (_, h) => {
              const c = map.get(`${d}:${h}`);
              return <div key={h} onMouseEnter={() => setHover(c ?? null)} className={`aspect-square ${c ? shade[step(c.engagement)] : "border border-line-light"} ${c && best && c.day === best.day && c.hour === best.hour ? "outline outline-2 outline-signal-strong" : ""}`} />;
            })}
          </div>
        ))}
        <span />
        {Array.from({ length: 24 }, (_, h) => (
          <span key={h} className="text-center text-[9px] text-faint">
            {h % 3 === 0 ? hourShort(h) : ""}
          </span>
        ))}
      </div>
    </figure>
  );
}

/** One channel's followers over time. */
function Line({ points, label }: { points: { day: string; value: number }[]; label: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 480;
  const H = 80;
  const pad = 4;
  const vals = points.map((p) => p.value);
  const min = Math.min(...vals);
  const span = Math.max(...vals) - min || 1;
  const x = (i: number) => pad + (i * (W - pad * 2)) / Math.max(points.length - 1, 1);
  const y = (v: number) => H - pad - ((v - min) / span) * (H - pad * 2);
  const d = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const h = hover != null ? points[hover] : null;
  return (
    <figure className="relative mt-2">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-20 w-full"
        role="img"
        aria-label={`${label}: ${points[0].value} to ${points.at(-1)!.value}`}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setHover(Math.max(0, Math.min(points.length - 1, Math.round(((e.clientX - r.left) / r.width) * (points.length - 1)))));
        }}
      >
        <path d={d} fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {h ? <circle cx={x(hover!)} cy={y(h.value)} r="4" fill="var(--yolk-9)" stroke="var(--text-primary)" strokeWidth="2" vectorEffect="non-scaling-stroke" /> : null}
      </svg>
      {h ? (
        <figcaption className="pointer-events-none absolute top-0 right-0 rounded-md bg-panel px-2 py-0.5 text-[11px] tabular-nums shadow-pop">
          {new Date(`${h.day}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}: {num(h.value)}
        </figcaption>
      ) : null}
    </figure>
  );
}
