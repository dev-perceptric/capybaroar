"use client";

import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, ExternalLink } from "lucide-react";
import { Avatar, Badge, StatCards } from "./ui";
import { NetworkLogo } from "./NetworkLogo";
import type { Channel } from "@/lib/channels";
import type { Analytics, BestCell } from "@/lib/analytics";
import { fmtNum, fmtParts } from "@/lib/format";

// The analytics charts, shared by the Analytics screen and the report page. The main series color is `--chart`
// when a parent sets it (a white-label report's accent), else ink.

export const num = (n: number) => fmtNum(n, 0);
export const pct = (n: number) => `${fmtNum(n * 100, 1)}%`;
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const hourShort = (h: number) => (h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`);
const hourLong = (h: number) => (h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`);
const dayLabel = (day: string) => fmtParts(`${day}T12:00:00`, { month: "short", day: "numeric" });
const CARD = "rounded-lg bg-panel shadow-card";

export function Section({ title, note, className = "", children }: { title: string; note?: string; className?: string; children: React.ReactNode }) {
  return (
    <section className={`mt-8 ${className}`}>
      <div className="mb-2.5 flex items-baseline gap-2">
        <h2 className="text-[14px] font-semibold tracking-[-0.01em]">{title}</h2>
        {note ? <span className="text-[12px] text-faint">{note}</span> : null}
      </div>
      {children}
    </section>
  );
}

/** Posts out, reach, engagements and rate, each against the period before. */
export function Tiles({ data }: { data: Analytics }) {
  const stats = data.current.withStats > 0;
  return (
    <StatCards
      cards={[
        { label: "Posts out", value: num(data.current.posts), note: <Delta cur={data.current.posts} prev={data.previous.posts} /> },
        { label: "Reach", value: stats ? num(data.current.views) : "None yet", note: <Delta cur={data.current.views} prev={data.previous.views} show={stats} /> },
        { label: "Engagements", value: stats ? num(data.current.engagement) : "None yet", note: <Delta cur={data.current.engagement} prev={data.previous.engagement} show={stats} /> },
        {
          label: "Engagement rate",
          value: data.current.rate != null ? pct(data.current.rate) : "None yet",
          note: <Delta cur={data.current.rate ?? 0} prev={data.previous.rate ?? 0} show={data.current.rate != null && data.previous.rate != null} ratio />,
        },
      ]}
    />
  );
}

function Delta({ cur, prev, show = true, ratio = false }: { cur: number; prev: number; show?: boolean; ratio?: boolean }) {
  const delta = show && prev > 0 ? (cur - prev) / prev : null;
  if (delta == null) return null;
  return (
    <span className={`inline-flex items-center gap-0.5 ${delta >= 0 ? "text-success" : "text-danger"}`}>
      {delta >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
      {ratio ? `${((cur - prev) * 100).toFixed(1)} pts` : pct(Math.abs(delta))}
      <span className="ml-1 text-faint">vs previous</span>
    </span>
  );
}

function Num({ v }: { v: number | null | undefined }) {
  return <td className="px-4 py-2.5 text-right tabular-nums">{v != null ? num(v) : <span className="text-faint">–</span>}</td>;
}

/** One series (engagements per day), so one color and no legend. Hover shows the day. */
export function Bars({ daily }: { daily: { day: string; posts: number; engagement: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...daily.map((d) => d.engagement));
  const h = hover != null ? daily[hover] : null;
  return (
    <figure className={`relative px-4 pt-9 pb-3 ${CARD}`}>
      {h ? (
        <figcaption className="pointer-events-none absolute top-2.5 right-3 rounded-md bg-panel px-2 py-0.5 text-[11px] tabular-nums shadow-menu">
          {dayLabel(h.day)}: {num(h.engagement)} engagements, {h.posts} post{h.posts === 1 ? "" : "s"}
        </figcaption>
      ) : (
        <figcaption className="absolute top-3 right-4 text-[11px] text-faint tabular-nums">Max {num(max)}</figcaption>
      )}
      <div className="flex h-36 items-end gap-[2px]" onMouseLeave={() => setHover(null)} role="img" aria-label="Engagements by day">
        {daily.map((d, i) => (
          <div key={d.day} className="flex h-full min-w-0 flex-1 items-end" onMouseEnter={() => setHover(i)}>
            <div className={`w-full rounded-t-xs ${hover === i ? "bg-signal" : d.engagement ? "bg-chart" : "bg-line"}`} style={{ height: d.engagement ? `${Math.max(3, (d.engagement / max) * 100)}%` : "2px" }} />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-faint tabular-nums">
        <span>{daily[0] ? dayLabel(daily[0].day) : ""}</span>
        <span>{daily.length ? dayLabel(daily.at(-1)!.day) : ""}</span>
      </div>
    </figure>
  );
}

/** Average engagements per post by weekday and hour: one hue, light to dark. Empty cells had no posts. */
export function Heatmap({ cells }: { cells: BestCell[] }) {
  const [hover, setHover] = useState<BestCell | null>(null);
  const map = new Map(cells.map((c) => [`${c.day}:${c.hour}`, c]));
  const max = Math.max(0, ...cells.map((c) => c.engagement));
  const order = [1, 2, 3, 4, 5, 6, 0];
  const step = (v: number) => (max ? Math.min(4, Math.floor((v / max) * 5)) : 0);
  const shade = ["bg-chart/10", "bg-chart/30", "bg-chart/50", "bg-chart/75", "bg-chart"];
  const best = [...cells].filter((c) => c.posts >= 2).sort((a, b) => b.engagement - a.engagement)[0];
  return (
    <figure className={`p-4 ${CARD}`}>
      <figcaption className="mb-2.5 h-4 text-[12px] tabular-nums">
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
              return <div key={h} onMouseEnter={() => setHover(c ?? null)} className={`aspect-square rounded-[2px] ${c ? shade[step(c.engagement)] : "bg-paper shadow-track"} ${c && best && c.day === best.day && c.hour === best.hour ? "outline outline-2 outline-signal-strong" : ""}`} />;
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

/** Posts and average engagements by format: video, picture, text. */
export function Formats({ formats }: { formats: Analytics["formats"] }) {
  return (
    <div className={`divide-y divide-line overflow-hidden ${CARD}`}>
      {formats.map((f) => (
        <div key={f.format} className="flex min-h-12 items-center gap-3 px-4 py-2.5">
          <span className="w-20 text-[13px] font-medium capitalize">{f.format}</span>
          <span className="flex-1 text-[12px] text-muted tabular-nums">
            {num(f.posts)} post{f.posts === 1 ? "" : "s"}
          </span>
          <span className="text-[13px] tabular-nums">{f.avg != null ? `${num(f.avg)} avg engagements` : "No results yet"}</span>
        </div>
      ))}
    </div>
  );
}

const TH = "h-10 px-4 text-right font-medium";
const HEAD = "border-b border-line text-left text-[12px] text-muted";

function NoResults() {
  return <p className="rounded-lg border border-dashed border-line-strong px-4 py-10 text-center text-[13px] text-muted">No results in this period yet</p>;
}

/** The posts with the most engagements. */
export function TopPosts({ top, channels, timezone }: { top: Analytics["top"]; channels: Channel[]; timezone: string }) {
  if (!top.length) return <NoResults />;
  const byId = new Map(channels.map((c) => [c.id, c]));
  return (
    <div className={`overflow-x-auto ${CARD}`}>
      <table className="w-full min-w-[720px] text-[13px] print:min-w-0">
        <thead>
          <tr className={HEAD}>
            <th className="h-10 px-4 font-medium">Post</th>
            <th className={TH}>Reach</th>
            <th className={TH}>Likes</th>
            <th className={TH}>Comments</th>
            <th className={TH}>Shares</th>
            <th className={TH}>Engagements</th>
            <th className={TH}>Rate</th>
          </tr>
        </thead>
        <tbody>
          {top.map((t) => {
            const c = byId.get(t.channelId);
            const reach = t.m?.reach ?? t.m?.views ?? t.m?.impressions;
            return (
              <tr key={t.id} className="border-b border-line last:border-b-0 hover:bg-hover">
                <td className="max-w-[360px] px-4 py-2.5 print:max-w-[240px]">
                  <div className="flex items-center gap-2">
                    {c ? <NetworkLogo id={c.network} size={14} /> : null}
                    <span className="min-w-0 truncate">{t.text || "No text"}</span>
                    {t.url ? (
                      <a href={t.url} target="_blank" rel="noreferrer" aria-label="Open post" className="shrink-0 text-muted hover:text-ink print:hidden">
                        <ExternalLink size={13} />
                      </a>
                    ) : null}
                    {t.deleted ? <Badge>Deleted</Badge> : null}
                  </div>
                  <p className="mt-0.5 text-[11px] text-faint">
                    {c?.name}, {fmtParts(t.at, { month: "short", day: "numeric", timeZone: timezone })}
                  </p>
                </td>
                <Num v={reach} />
                <Num v={t.m?.likes} />
                <Num v={t.m?.comments} />
                <Num v={t.m?.shares} />
                <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{num(t.m?.engagement ?? 0)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{t.rate != null ? pct(t.rate) : ""}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Each channel's followers over the period. */
export function Followers({ data, channels }: { data: Analytics; channels: Channel[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 print:grid-cols-2">
      {channels.map((c) => {
        const points = data.followers.filter((m) => m.channel_id === c.id && m.followers != null).map((m) => ({ day: m.day, value: m.followers as number }));
        const last = points.at(-1)?.value;
        const first = points.find((p) => p.day >= data.since)?.value ?? points[0]?.value;
        return (
          <div key={c.id} className={`p-4 break-inside-avoid ${CARD}`}>
            <div className="flex items-center gap-2">
              <ChannelFace c={c} />
              <NetworkLogo id={c.network} size={14} />
              <h3 className="min-w-0 flex-1 truncate text-[13px] font-medium">{c.name}</h3>
            </div>
            <p className="mt-2 flex items-baseline gap-2">
              <span className="text-[24px] leading-none font-semibold tracking-[-0.03em] tabular-nums">{last != null ? num(last) : "None yet"}</span>
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
  );
}

function ChannelFace({ c }: { c: Channel }) {
  return c.avatar ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={c.avatar} alt="" className="size-5 rounded-full object-cover" />
  ) : (
    <Avatar label={c.name} size={20} />
  );
}

/** Posts, reach, engagements and rate for each channel. */
export function ChannelTable({ data, channels }: { data: Analytics; channels: Channel[] }) {
  const by = new Map(data.byChannel.map((r) => [r.channelId, r]));
  if (!channels.length) return <NoResults />;
  return (
    <div className={`overflow-x-auto ${CARD}`}>
      <table className="w-full min-w-[560px] text-[13px] print:min-w-0">
        <thead>
          <tr className={HEAD}>
            <th className="h-10 px-4 font-medium">Channel</th>
            <th className={TH}>Posts</th>
            <th className={TH}>Reach</th>
            <th className={TH}>Engagements</th>
            <th className={TH}>Rate</th>
          </tr>
        </thead>
        <tbody>
          {channels.map((c) => {
            const r = by.get(c.id);
            return (
              <tr key={c.id} className="border-b border-line last:border-b-0">
                <td className="px-4 py-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <NetworkLogo id={c.network} size={14} />
                    <span className="min-w-0 truncate">{c.name}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">{num(r?.posts ?? 0)}</td>
                <Num v={r?.withStats ? r.views : null} />
                <Num v={r?.withStats ? r.engagement : null} />
                <td className="px-4 py-2.5 text-right tabular-nums">{r?.rate != null ? pct(r.rate) : <span className="text-faint">–</span>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
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
        <path d={d} fill="none" stroke="var(--chart, var(--text-primary))" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {h ? <circle cx={x(hover!)} cy={y(h.value)} r="4" fill="var(--yolk-9)" stroke="var(--text-primary)" strokeWidth="2" vectorEffect="non-scaling-stroke" /> : null}
      </svg>
      {h ? (
        <figcaption className="pointer-events-none absolute top-0 right-0 rounded-md bg-panel px-2 py-0.5 text-[11px] tabular-nums shadow-menu">
          {dayLabel(h.day)}: {num(h.value)}
        </figcaption>
      ) : null}
    </figure>
  );
}
