"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

const noop = () => () => {};
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, CalendarDays, Check, ChevronLeft, ChevronRight, Flag, Layers, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge, Button, Empty, IconButton, LinkButton, Page, Segmented } from "@/components/ui";
import { Select } from "@/components/Select";
import { Sheet } from "@/components/Overlay";
import { NetworkLogo } from "@/components/NetworkLogo";
import type { Channel } from "@/lib/channels";
import type { PostRow } from "@/lib/posts";
import { loadCampaigns, loadPosts, move, newCampaign, removeCampaign, renameCampaign } from "@/app/(app)/calendar/actions";
import { askConfirm, askText, tell } from "@/components/Dialogs";
import type { Campaign, CampaignCounts } from "@/lib/campaignRules";
import { fmtNum } from "@/lib/format";

// The composer (previews, text tools, uploads) loads after the calendar shows, and is fetched while the browser is
// idle so it opens at once.
const loadComposer = () => import("@/components/Composer").then((m) => m.Composer);
const Composer = dynamic(loadComposer, { ssr: false });
const BulkSheet = dynamic(() => import("@/components/BulkSheet").then((m) => m.BulkSheet), { ssr: false });

type Mode = "day" | "week" | "month" | "list";

const DAY = 86400000;
const HOUR_PX = 64;
const CARD_PX = 54;
const HOURS = Array.from({ length: 24 }, (_, h) => h);
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const startOfWeek = (d: Date) => {
  const s = startOfDay(d);
  return new Date(s.getTime() - ((s.getDay() + 6) % 7) * DAY);
};
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const hourLabel = (h: number) => (h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`);
const clock = (d: Date) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;
const MOVABLE: PostRow["status"][] = ["draft", "review", "scheduled", "failed"];

/** What this person may do: write posts (team) and approve them (owners, admins, clients). */
export type Access = { write: boolean; approve: boolean };
const postText = (p: PostRow) => p.text || p.post_targets.find((t) => t.text)?.text || "No text";

/** Posts the server already loaded for the opening week (a range wide enough for any time zone). */
type Initial = { from: string; to: string; posts: PostRow[] };
// A tab reopened from the browser's cache brings the same first load again, which may be out of date: use each once.
let usedSeed = "";

export function CalendarView({ channels, initial, access }: { channels: Channel[]; initial?: Initial; access: Access }) {
  const startNew = useSearchParams().has("new") && access.write;
  const [mode, setMode] = useState<Mode>("week");
  const [anchor, setAnchor] = useState(() => new Date());
  const [compose, setCompose] = useState<{ at?: Date; post?: PostRow } | null>(() => (startNew ? {} : null));
  const [bulk, setBulk] = useState(false);
  const [channel, setChannel] = useState<string>("all");
  const [campaign, setCampaign] = useState<string>("all");
  const [campaigns, setCampaigns] = useState<(Campaign & { counts: CampaignCounts })[]>([]);
  const [campaignSheet, setCampaignSheet] = useState(false);
  const reloadCampaigns = useCallback(() => {
    loadCampaigns().then(setCampaigns, () => setCampaigns([]));
  }, []);
  useEffect(() => reloadCampaigns(), [reloadCampaigns]);
  const [posts, setPosts] = useState<PostRow[]>(() => initial?.posts ?? []);
  const range = useMemo(() => {
    if (mode === "list") {
      const from = startOfDay(anchor);
      return { from, to: new Date(from.getTime() + 28 * DAY) };
    }
    if (mode === "day") {
      const from = startOfDay(anchor);
      return { from, to: new Date(from.getTime() + DAY) };
    }
    const from = mode === "week" ? startOfWeek(anchor) : startOfWeek(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
    return { from, to: new Date(from.getTime() + (mode === "week" ? 7 : 42) * DAY) };
  }, [mode, anchor]);
  const reload = useCallback(() => {
    loadPosts(range.from.toISOString(), range.to.toISOString()).then(setPosts, () => setPosts([]));
  }, [range]);
  // The first range comes with the page when the server's covers it; after that, load on every change.
  const seeded = useRef(initial ? { key: initial.from, from: Date.parse(initial.from), to: Date.parse(initial.to) } : null);
  useEffect(() => {
    const s = seeded.current;
    seeded.current = null;
    const covered = s && s.key !== usedSeed && range.from.getTime() >= s.from && range.to.getTime() <= s.to;
    if (s) usedSeed = s.key;
    if (!covered) reload();
    // Refresh every 30 seconds while the tab is in view, and as soon as it comes back.
    const t = setInterval(() => document.visibilityState === "visible" && reload(), 30000);
    const back = () => document.visibilityState === "visible" && reload();
    document.addEventListener("visibilitychange", back);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", back);
    };
  }, [reload, range]);
  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((f: () => void) => window.setTimeout(f, 1500));
    idle(() => void loadComposer());
  }, []);
  const [now, setNow] = useState(() => new Date());
  // Times depend on the viewer's time zone, so the grid draws in the browser only (no server/browser mismatch).
  const ready = useSyncExternalStore(noop, () => true, () => false);
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  // Only the range on screen (the server's first load is wider). Counted in the browser, where the range is known.
  const inRange = useMemo(() => {
    if (!ready) return [];
    const from = range.from.getTime();
    const to = range.to.getTime();
    return posts.filter((p) => {
      const t = p.publish_at ? Date.parse(p.publish_at) : NaN;
      return t >= from && t < to;
    });
  }, [posts, range, ready]);
  const byCampaign = campaign === "all" ? inRange : inRange.filter((p) => (campaign === "none" ? !p.campaign_id : p.campaign_id === campaign));
  const shown = channel === "all" ? byCampaign : byCampaign.filter((p) => p.post_targets.some((t) => t.channel_id === channel));
  const byId = useMemo(() => new Map(channels.map((c) => [c.id, c])), [channels]);
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of inRange) for (const t of p.post_targets) m.set(t.channel_id, (m.get(t.channel_id) ?? 0) + 1);
    return m;
  }, [inRange]);

  // Drag a draft or scheduled post to another slot. Month keeps its time of day.
  const drop = async (postId: string, at: Date, keepTime: boolean) => {
    const p = posts.find((x) => x.id === postId);
    if (!p) return;
    const to = new Date(at);
    if (keepTime && p.publish_at) {
      const old = new Date(p.publish_at);
      to.setHours(old.getHours(), old.getMinutes(), 0, 0);
    }
    setPosts((all) => all.map((x) => (x.id === postId ? { ...x, publish_at: to.toISOString() } : x)));
    const r = await move(postId, to.toISOString());
    if (r.error) await tell("Couldn't move the post", r.error);
    reload();
  };
  const open = (p: PostRow) => setCompose({ post: p });
  const pick = access.write ? (at: Date) => setCompose({ at }) : null;
  // Month and List open at the top (Week scrolls to the working hours itself).
  useEffect(() => {
    if (mode === "week") return;
    const box = head.current?.closest(".overflow-auto") as HTMLElement | null;
    if (box) box.scrollTop = 0;
  }, [mode, anchor]);
  // The day header sticks just under the toolbar, whose height changes as it wraps.
  const head = useRef<HTMLDivElement>(null);
  const [headH, setHeadH] = useState(0);
  useEffect(() => {
    const el = head.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setHeadH(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const step = (dir: -1 | 1) =>
    setAnchor((a) => (mode === "month" ? new Date(a.getFullYear(), a.getMonth() + dir, 1) : new Date(a.getTime() + dir * (mode === "list" ? 28 : mode === "day" ? 1 : 7) * DAY)));

  // The big title: the point in black, the year in gray.
  const [lead, tail] = useMemo((): [string, string] => {
    const year = String(anchor.getFullYear());
    if (mode === "month") return [anchor.toLocaleDateString("en-US", { month: "long" }), year];
    if (mode === "day") return [anchor.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }), year];
    const s = mode === "list" ? startOfDay(anchor) : startOfWeek(anchor);
    const e = new Date(s.getTime() + (mode === "list" ? 27 : 6) * DAY);
    const md = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const sameMonth = s.getMonth() === e.getMonth();
    return [sameMonth ? `${md(s)} to ${e.getDate()}` : `${md(s)} to ${md(e)}`, String(e.getFullYear())];
  }, [mode, anchor]);

  return (
    <Page
      icon={<CalendarDays />}
      title="Calendar"
      flush
      actions={
        access.write ? (
          <>
            <Button variant="ghost" onClick={() => setCampaignSheet(true)}>
              <Flag /> Campaigns
            </Button>
            <Button variant="ghost" onClick={() => setBulk(true)}>
              <Layers /> Bulk
            </Button>
            <Button onClick={() => setCompose({})}>
              <Plus /> New post
            </Button>
          </>
        ) : null
      }
    >
      <div className={`flex min-h-full flex-col ${mode === "list" ? "" : "bg-panel"}`} style={{ "--cal-head": `${headH}px` } as React.CSSProperties}>
        <div ref={head} data-cal-sticky className="sticky top-0 left-0 z-30 border-b border-line bg-panel">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 pt-4 pb-3">
            <h2 className="min-w-0 text-[22px] leading-none font-semibold tracking-[-0.03em] whitespace-nowrap">
              {lead} <span className="text-faint">{tail}</span>
            </h2>
            <div className="flex h-[34px] items-stretch overflow-hidden rounded-full bg-panel shadow-outline">
              <button type="button" onClick={() => step(-1)} aria-label="Previous" className="flex w-9 items-center justify-center pl-0.5 text-muted transition-colors hover:bg-paper hover:text-ink">
                <ChevronLeft size={16} />
              </button>
              <button type="button" onClick={() => setAnchor(new Date())} className="border-x border-line px-3.5 text-[13px] font-medium transition-colors hover:bg-paper">
                Today
              </button>
              <button type="button" onClick={() => step(1)} aria-label="Next" className="flex w-9 items-center justify-center pr-0.5 text-muted transition-colors hover:bg-paper hover:text-ink">
                <ChevronRight size={16} />
              </button>
            </div>
            <span className="flex-1" />
            {channels.length > 1 ? (
              <Select<string>
                size="sm"
                lead="Channel"
                ariaLabel="Channel"
                className="max-w-72"
                value={channel}
                onChange={setChannel}
                options={[
                  { value: "all", label: "All channels", hint: String(inRange.length) },
                  ...channels.map((c) => ({ value: c.id, label: c.name, icon: <NetworkLogo id={c.network} size={14} />, hint: c.status === "reconnect" ? "Reconnect" : String(counts.get(c.id) ?? 0) })),
                ]}
              />
            ) : null}
            {!channels.length && access.write ? (
              <LinkButton href="/channels" variant="ghost" size="sm">
                Connect a channel
              </LinkButton>
            ) : null}
            {campaigns.length ? (
              <Select<string>
                size="sm"
                lead="Campaign"
                ariaLabel="Campaign"
                value={campaign}
                onChange={setCampaign}
                options={[{ value: "all", label: "All" }, ...campaigns.map((c) => ({ value: c.id, label: c.name, dot: `var(--color-tone-${c.tone})` })), { value: "none", label: "No campaign" }]}
              />
            ) : null}
            <Segmented<Mode>
              label="View"
              value={mode}
              onChange={setMode}
              options={[
                { value: "day", label: "Day" },
                { value: "week", label: "Week" },
                { value: "month", label: "Month" },
                { value: "list", label: "List" },
              ]}
            />
          </div>
        </div>

        <div className="min-h-0 flex-1">
          {!ready ? null : mode === "week" || mode === "day" ? (
            <Week anchor={anchor} now={now} posts={shown} byId={byId} onOpen={open} onPick={pick} onDrop={(id, at) => drop(id, at, false)} single={mode === "day"} />
          ) : mode === "month" ? (
            <Month
              anchor={anchor}
              now={now}
              posts={shown}
              byId={byId}
              onOpen={open}
              onPick={pick}
              onDrop={(id, at) => drop(id, at, true)}
              onDay={(d) => {
                setAnchor(d);
                setMode("week");
              }}
            />
          ) : (
            <List posts={shown} byId={byId} onOpen={open} />
          )}
        </div>
      </div>
      {bulk ? (
        <BulkSheet
          channels={channels}
          onClose={() => setBulk(false)}
          onSaved={() => {
            setBulk(false);
            reload();
          }}
        />
      ) : null}
      {compose ? (
        <Composer
          channels={channels}
          at={compose.at}
          post={compose.post}
          preset={channel === "all" ? undefined : channel}
          access={access}
          onClose={() => setCompose(null)}
          onSaved={() => {
            setCompose(null);
            reload();
            reloadCampaigns();
          }}
        />
      ) : null}
      <Sheet open={campaignSheet} onClose={() => setCampaignSheet(false)} label="Campaigns" title="Campaigns" wide>
        <CampaignList
          campaigns={campaigns}
          onChange={reloadCampaigns}
          onShow={(id) => {
            setCampaign(id);
            setMode("list");
            setCampaignSheet(false);
          }}
        />
      </Sheet>
    </Page>
  );
}

/** The channels a post goes to, as overlapping round discs: the channel's picture, or its network's logo. */
function Faces({ post, byId, size = 18 }: { post: PostRow; byId: Map<string, Channel>; size?: number }) {
  const list = post.post_targets.map((t) => byId.get(t.channel_id)).filter((c): c is Channel => Boolean(c));
  const step = Math.round(size * 0.4);
  return (
    <span className="flex shrink-0 items-center">
      {list.slice(0, 3).map((c, i) => (
        <span
          key={c.id}
          title={c.name}
          style={{ width: size, height: size, marginLeft: i ? -step : 0, zIndex: 3 - i }}
          className="relative flex items-center justify-center overflow-hidden rounded-full border border-line bg-panel ring-2 ring-panel"
        >
          {c.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.avatar} alt="" className="size-full object-cover" />
          ) : (
            <NetworkLogo id={c.network} size={Math.round(size * 0.6)} />
          )}
        </span>
      ))}
      {list.length > 3 ? (
        <span style={{ width: size, height: size, marginLeft: -step }} className="relative flex items-center justify-center rounded-full border border-line bg-hover text-[9px] font-medium text-muted ring-2 ring-panel tabular-nums">
          +{list.length - 3}
        </span>
      ) : null}
    </span>
  );
}

// Status reads on the card's left edge, with an icon for the two that need noticing.
const BAR: Record<PostRow["status"], string> = {
  draft: "bg-line-strong",
  review: "bg-tone-violet",
  scheduled: "bg-ink",
  publishing: "bg-yolk",
  published: "bg-yolk",
  partial: "bg-warning",
  failed: "bg-danger",
  deleted: "bg-line-strong",
};

function PostCard({ post, byId, onOpen, compact = false, narrow = false, movable: canMove, style }: { post: PostRow; byId: Map<string, Channel>; onOpen: () => void; compact?: boolean; narrow?: boolean; movable: boolean; style?: React.CSSProperties }) {
  const movable = canMove && MOVABLE.includes(post.status);
  const time = post.publish_at ? clock(new Date(post.publish_at)) : "";
  return (
    <button
      type="button"
      onClick={onOpen}
      title={postText(post)}
      draggable={movable}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/x-post", post.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      style={style}
      className={`group/card relative flex w-full min-w-0 overflow-hidden rounded-md border text-left transition-[background-color,box-shadow] ${post.status === "draft" ? "border-dashed border-line-strong bg-panel" : post.status === "review" ? "border-transparent bg-violet-soft" : "border-transparent bg-panel shadow-chip"} hover:bg-canvas ${movable ? "cursor-grab active:cursor-grabbing" : ""} ${compact ? "h-7 items-center" : "flex-col"}`}
    >
      <span className={`absolute inset-y-0 left-0 w-[3px] ${BAR[post.status]}`} />
      {compact ? (
        <span className="flex min-w-0 flex-1 items-center gap-1.5 pr-1.5 pl-2.5">
          <Faces post={post} byId={byId} size={14} />
          <span className="shrink-0 text-[11px] font-medium tabular-nums">{time}</span>
          <span className={`min-w-0 truncate text-[11px] ${post.status === "draft" ? "text-muted" : ""}`}>{postText(post)}</span>
        </span>
      ) : (
        <span className="flex min-w-0 flex-1 flex-col gap-0.5 py-1.5 pr-2 pl-2.5">
          <span className="flex min-w-0 items-center gap-1.5">
            {narrow ? null : <Faces post={post} byId={byId} />}
            <span className="text-[11px] font-semibold whitespace-nowrap tabular-nums">{narrow ? time.replace(/ ([AP])M/, "$1").toLowerCase() : time}</span>
            <span className="flex-1" />
            {post.status === "published" ? <Check size={12} className="shrink-0" aria-label="Published" /> : post.status === "failed" ? <AlertTriangle size={12} className="shrink-0 text-danger" aria-label="Failed" /> : post.status === "draft" && !narrow ? <span className="text-[10px] text-muted">Draft</span> : post.status === "review" && !narrow ? <Badge tone="violet">In review</Badge> : null}
          </span>
          <span className={`line-clamp-1 text-[12px] leading-snug ${post.status === "draft" ? "text-muted" : "text-ink"}`}>{postText(post)}</span>
        </span>
      )}
    </button>
  );
}

/** Side-by-side lanes for posts that overlap in time, like any calendar app. */
function lanes(posts: PostRow[]) {
  const sorted = [...posts].sort((a, b) => new Date(a.publish_at!).getTime() - new Date(b.publish_at!).getTime());
  const out: { post: PostRow; lane: number; of: number }[] = [];
  let group: { post: PostRow; lane: number }[] = [];
  let groupEnd = 0;
  const flush = () => {
    const of = Math.max(1, ...group.map((g) => g.lane + 1));
    for (const g of group) out.push({ ...g, of });
    group = [];
  };
  for (const p of sorted) {
    const start = new Date(p.publish_at!).getTime();
    if (group.length && start >= groupEnd) flush();
    const end = start + (CARD_PX / HOUR_PX) * 3600000;
    const taken = new Set(group.filter((g) => new Date(g.post.publish_at!).getTime() + (CARD_PX / HOUR_PX) * 3600000 > start).map((g) => g.lane));
    let lane = 0;
    while (taken.has(lane)) lane++;
    group.push({ post: p, lane });
    groupEnd = Math.max(groupEnd, end);
  }
  flush();
  return out;
}

type ViewProps = { anchor: Date; now: Date; posts: PostRow[]; byId: Map<string, Channel>; onOpen: (p: PostRow) => void; onPick: ((at: Date) => void) | null; onDrop: (postId: string, at: Date) => void };

/** The week, or with `single` one day, hour by hour. */
function Week({ anchor, now, posts, byId, onOpen, onPick, onDrop, single = false }: ViewProps & { single?: boolean }) {
  const days = single ? [startOfDay(anchor)] : Array.from({ length: 7 }, (_, i) => new Date(startOfWeek(anchor).getTime() + i * DAY));
  const cols = { gridTemplateColumns: `64px repeat(${days.length}, minmax(0, 1fr))` };
  const seven = useRef<HTMLDivElement>(null);
  const thisWeekStart = days.some((d) => sameDay(d, now));
  // Open at 7 AM, or two hours before now on this week, just under the sticky headers.
  useEffect(() => {
    const row = seven.current;
    const box = row?.closest(".overflow-auto") as HTMLElement | null;
    if (!row || !box) return;
    const grid = row.parentElement!.parentElement!;
    const sticky = (box.querySelector("[data-cal-sticky]") as HTMLElement | null)?.offsetHeight ?? 0;
    const head = (grid.previousElementSibling as HTMLElement | null)?.offsetHeight ?? 0;
    const hour = thisWeekStart ? Math.max(0, new Date().getHours() - 2) : 7;
    box.scrollTop = grid.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop + hour * HOUR_PX - sticky - head - 12;
  }, [thisWeekStart, anchor]);
  const nowTop = ((now.getHours() * 60 + now.getMinutes()) / 60) * HOUR_PX;
  const thisWeek = days.some((d) => sameDay(d, now));
  return (
    <div className={`${single ? "" : "min-w-[840px]"} pr-6`}>
      <div className="sticky top-[var(--cal-head,0px)] z-20 grid border-r border-b border-line bg-panel" style={cols}>
        <div />
        {days.map((d) => {
          const today = sameDay(d, now);
          const n = posts.filter((p) => p.publish_at && sameDay(new Date(p.publish_at), d)).length;
          return (
            <div key={d.toISOString()} className="flex items-end gap-2 border-l border-line px-3 pt-3 pb-2.5">
              <span className={`flex h-8 min-w-8 items-center justify-center px-1 text-[20px] leading-none tabular-nums ${today ? "rounded-md bg-signal font-semibold text-on-signal" : isWeekend(d) ? "font-[350] text-muted" : "font-[350]"}`}>{d.getDate()}</span>
              <span className="mb-0.5 flex flex-col leading-tight">
                <span className={`text-[12px] font-medium ${today ? "text-ink" : "text-muted"}`}>{d.toLocaleDateString("en-US", { weekday: "short" })}</span>
                <span className="text-[11px] text-faint tabular-nums">{n ? `${n} post${n === 1 ? "" : "s"}` : "\u00a0"}</span>
              </span>
            </div>
          );
        })}
      </div>
      <div className="relative mb-6 grid border-r border-b border-line" style={cols}>
        <div className="relative">
          {HOURS.map((h) => (
            <div key={h} ref={h === 0 ? seven : undefined} className="relative" style={{ height: HOUR_PX }}>
              {h ? <span className="absolute top-0 right-3 -translate-y-1/2 text-[11px] text-faint tabular-nums">{hourLabel(h)}</span> : null}
            </div>
          ))}
          {thisWeek ? (
            <span className="absolute right-1 z-10 -translate-y-1/2 rounded-xs bg-ink px-1 py-0.5 text-[10px] font-medium text-inverted tabular-nums" style={{ top: nowTop }}>
              {clock(now).replace(/ [AP]M/, "")}
            </span>
          ) : null}
        </div>
        {days.map((d) => {
          const today = sameDay(d, now);
          const dayPosts = posts.filter((p) => p.publish_at && sameDay(new Date(p.publish_at), d));
          return (
            <div key={d.toISOString()} className={`relative border-l border-line ${today ? "bg-signal-pale" : isWeekend(d) ? "bg-hover/50" : ""}`}>
              {HOURS.map((h) => {
                const at = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h);
                const past = at.getTime() + 3600000 <= now.getTime();
                return (
                  <div key={h} className="relative border-t border-line-light first:border-t-0" style={{ height: HOUR_PX }} {...dropTarget(past || !onPick, () => at, onDrop)}>
                    <span className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-line-light" />
                    {!past && onPick ? (
                      <button type="button" onClick={() => onPick(at)} aria-label={`New post ${at.toLocaleString("en-US", { weekday: "long", hour: "numeric" })}`} className="group absolute inset-0">
                        <span className="absolute inset-1 hidden items-center gap-1 rounded-md border border-dashed border-line-strong bg-panel px-2 text-[11px] text-muted group-hover:flex">
                          <Plus size={12} /> {hourLabel(h).replace(" ", ":00 ")}
                        </span>
                      </button>
                    ) : null}
                  </div>
                );
              })}
              {lanes(dayPosts).map(({ post, lane, of }) => {
                const t = new Date(post.publish_at!);
                const top = ((t.getHours() * 60 + t.getMinutes()) / 60) * HOUR_PX + 1;
                return (
                  <div key={post.id} className="absolute z-[5] px-1" style={{ top, height: CARD_PX, left: `${(lane / of) * 100}%`, width: `${100 / of}%` }}>
                    <PostCard post={post} byId={byId} onOpen={() => onOpen(post)} narrow={of > 1} movable={!!onPick} style={{ height: CARD_PX - 2 }} />
                  </div>
                );
              })}
              {today ? (
                <span className="pointer-events-none absolute inset-x-0 z-10 h-0.5 bg-ink" style={{ top: nowTop }}>
                  <span className="absolute -top-[3px] -left-[4px] size-2 rounded-full bg-ink" />
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Month({ anchor, now, posts, byId, onOpen, onPick, onDrop, onDay }: ViewProps & { onDay: (d: Date) => void }) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const start = startOfWeek(first);
  const days = Array.from({ length: 42 }, (_, i) => new Date(start.getTime() + i * DAY));
  return (
    <div className="min-w-[840px] px-6 pt-4 pb-6">
      <div className="sticky top-[var(--cal-head,0px)] z-20 grid grid-cols-7 rounded-t-lg border-x border-t border-b border-line bg-panel">
        {days.slice(0, 7).map((d) => (
          <div key={d.getDay()} className={`border-l border-line px-3 py-2 text-[12px] font-medium first:border-l-0 ${isWeekend(d) ? "text-faint" : "text-muted"}`}>
            {d.toLocaleDateString("en-US", { weekday: "short" })}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 overflow-hidden rounded-b-lg border-x border-line">
        {days.map((d, i) => {
          const inMonth = d.getMonth() === anchor.getMonth();
          const today = sameDay(d, now);
          const past = startOfDay(d).getTime() < startOfDay(now).getTime();
          const here = posts.filter((p) => p.publish_at && sameDay(new Date(p.publish_at), d)).sort((a, b) => a.publish_at!.localeCompare(b.publish_at!));
          return (
            <div
              key={d.toISOString()}
              className={`group relative flex h-36 flex-col gap-1 border-b border-line-light p-1.5 ${i % 7 ? "border-l" : ""} ${!inMonth ? "bg-hover/60" : isWeekend(d) ? "bg-hover/30" : ""}`}
              {...dropTarget(past || !onPick, () => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9), onDrop)}
            >
              {!past && onPick ? <button type="button" aria-label={`New post ${d.toLocaleDateString("en-US", { month: "long", day: "numeric" })}`} onClick={() => onPick(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9))} className="absolute inset-0 hover:bg-hover/60" /> : null}
              <div className="pointer-events-none relative flex items-center justify-between px-0.5">
                <span className={`flex h-6 min-w-6 items-center justify-center px-1 text-[13px] tabular-nums ${today ? "rounded-sm bg-signal font-semibold text-on-signal" : inMonth ? "font-medium text-ink" : "text-faint"}`}>
                  {d.getDate() === 1 ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : d.getDate()}
                </span>
                {!past && onPick ? <Plus size={13} className="hidden text-muted group-hover:block" /> : null}
              </div>
              <div className="relative flex w-full flex-col gap-1">
                {here.slice(0, 3).map((p) => (
                  <PostCard key={p.id} post={p} byId={byId} onOpen={() => onOpen(p)} movable={!!onPick} compact />
                ))}
                {here.length > 3 ? (
                  <button type="button" onClick={() => onDay(d)} className="w-fit px-1 text-[11px] font-medium text-muted hover:text-ink">
                    {here.length - 3} more
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Props that make a calendar cell accept a dragged post. Past cells don't. */
function dropTarget(past: boolean, at: () => Date, onDrop: (postId: string, at: Date) => void) {
  if (past) return {};
  return {
    onDragOver: (e: React.DragEvent) => {
      if (e.dataTransfer.types.includes("text/x-post")) {
        e.preventDefault();
        e.currentTarget.classList.add("!bg-signal-soft");
      }
    },
    onDragLeave: (e: React.DragEvent) => e.currentTarget.classList.remove("!bg-signal-soft"),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      e.currentTarget.classList.remove("!bg-signal-soft");
      const id = e.dataTransfer.getData("text/x-post");
      if (id) onDrop(id, at());
    },
  };
}

const LABEL: Record<PostRow["status"], string> = { draft: "Draft", review: "In review", scheduled: "Scheduled", publishing: "Posting", published: "Published", partial: "Partly published", failed: "Failed", deleted: "Deleted" };
const TONE: Record<PostRow["status"], "gray" | "violet" | "yellow" | "green" | "amber" | "red"> = { draft: "gray", review: "violet", scheduled: "yellow", publishing: "yellow", published: "green", partial: "amber", failed: "red", deleted: "gray" };

function List({ posts, byId, onOpen }: { posts: PostRow[]; byId: Map<string, Channel>; onOpen: (p: PostRow) => void }) {
  if (!posts.length) return <Empty compact drawing="timeline" title="No posts in these 4 weeks" />;
  const days = new Map<string, PostRow[]>();
  for (const p of [...posts].sort((a, b) => a.publish_at!.localeCompare(b.publish_at!))) {
    const k = new Date(p.publish_at!).toDateString();
    days.set(k, [...(days.get(k) ?? []), p]);
  }
  return (
    <div className="mx-auto w-full max-w-[880px] px-4 py-6 md:px-6">
      {[...days.entries()].map(([day, list]) => {
        const d = new Date(day);
        return (
          <section key={day} className="mb-8">
            <h3 className="mb-2.5 text-[16px] font-semibold tracking-[-0.02em]">
              {d.toLocaleDateString("en-US", { weekday: "long" })} <span className="text-faint">{d.toLocaleDateString("en-US", { month: "long", day: "numeric" })}</span>
            </h3>
            <div className="divide-y divide-line overflow-hidden rounded-lg bg-panel shadow-card">
              {list.map((p) => (
                <button key={p.id} type="button" onClick={() => onOpen(p)} className="relative flex min-h-14 w-full items-center gap-4 py-3 pr-4 pl-5 text-left transition-colors hover:bg-hover">
                  <span className={`absolute inset-y-0 left-0 w-[3px] ${BAR[p.status]}`} />
                  <span className="w-16 shrink-0 text-[13px] font-semibold tabular-nums">{clock(new Date(p.publish_at!))}</span>
                  <Faces post={p} byId={byId} size={20} />
                  <span className={`min-w-0 flex-1 truncate text-[13px] ${p.status === "draft" ? "text-muted" : ""}`}>{postText(p)}</span>
                  <Badge tone={TONE[p.status]}>{LABEL[p.status]}</Badge>
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

const CAMP_TH = "h-10 px-4 text-right font-medium";

/** Every campaign with its posts by status and their engagements: show its posts, rename it or delete it. */
function CampaignList({ campaigns, onChange, onShow }: { campaigns: (Campaign & { counts: CampaignCounts })[]; onChange: () => void; onShow: (id: string) => void }) {
  const add = async () => {
    const name = await askText("New campaign", { placeholder: "Spring launch", ok: "Create" });
    if (!name?.trim()) return;
    const r = await newCampaign(name);
    if (r.error) return tell("Couldn't make the campaign", r.error);
    onChange();
  };
  const rename = async (c: Campaign) => {
    const name = await askText("Rename campaign", { initial: c.name, ok: "Save" });
    if (!name?.trim() || name.trim() === c.name) return;
    const r = await renameCampaign(c.id, name);
    if (r.error) return tell("Couldn't rename the campaign", r.error);
    onChange();
  };
  const del = async (c: Campaign) => {
    if (!(await askConfirm(`Delete the campaign "${c.name}"?`, { ok: "Delete", danger: true, body: "Its posts stay on the calendar." }))) return;
    const r = await removeCampaign(c.id);
    if (r.error) return tell("Couldn't delete the campaign", r.error);
    onChange();
  };
  return (
    <div className="flex flex-col gap-3 p-4">
      <div>
        <Button size="sm" onClick={add}>
          <Plus /> New campaign
        </Button>
      </div>
      {campaigns.length ? (
        <div className="overflow-x-auto rounded-lg bg-panel shadow-card">
          <table className="w-full min-w-[560px] text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-[12px] text-muted">
                <th className="h-10 px-4 font-medium">Campaign</th>
                <th className={CAMP_TH}>Scheduled</th>
                <th className={CAMP_TH}>Published</th>
                <th className={CAMP_TH}>Failed</th>
                <th className={CAMP_TH}>Drafts</th>
                <th className={CAMP_TH}>Engagements</th>
                <th className="h-10 w-px px-2 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-b border-line last:border-b-0 hover:bg-hover">
                  <td className="max-w-[220px] px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ background: `var(--color-tone-${c.tone})` }} />
                      <button type="button" onClick={() => onShow(c.id)} className="min-w-0 truncate text-left font-medium hover:underline">
                        {c.name}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmtNum(c.counts.scheduled)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmtNum(c.counts.published)}</td>
                  <td className={`px-4 py-2.5 text-right tabular-nums ${c.counts.failed ? "text-danger" : ""}`}>{fmtNum(c.counts.failed)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmtNum(c.counts.drafts)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmtNum(c.counts.engagements)}</td>
                  <td className="px-2 py-1.5">
                    <div className="flex items-center justify-end">
                      <IconButton label="Rename" onClick={() => rename(c)}>
                        <Pencil size={14} />
                      </IconButton>
                      <IconButton label="Delete" align="end" onClick={() => del(c)}>
                        <Trash2 size={14} />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
