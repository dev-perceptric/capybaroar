"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Layers, Plus } from "lucide-react";
import { Badge, Button, IconButton, Page, Segmented } from "@/components/ui";
import { Composer } from "@/components/Composer";
import { NetworkLogo } from "@/components/NetworkLogo";
import type { Channel } from "@/lib/channels";
import type { PostRow } from "@/lib/posts";
import { loadPosts, move } from "@/app/(app)/calendar/actions";
import { tell } from "@/components/Dialogs";

type Mode = "week" | "month" | "list";

const DAY = 86400000;
const HOURS = Array.from({ length: 24 }, (_, h) => h);
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const startOfWeek = (d: Date) => {
  const s = startOfDay(d);
  return new Date(s.getTime() - ((s.getDay() + 6) % 7) * DAY);
};
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const hourOf = (iso: string, at: Date) => {
  const d = new Date(iso);
  return sameDay(d, at) && d.getHours() === at.getHours();
};
const hourLabel = (h: number) => (h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`);

export function CalendarView({ channels }: { channels: Channel[] }) {
  const [mode, setMode] = useState<Mode>("week");
  const [anchor, setAnchor] = useState(() => new Date());
  const [compose, setCompose] = useState<{ at?: Date; post?: PostRow } | null>(null);
  const [channel, setChannel] = useState<string>("all");
  const [posts, setPosts] = useState<PostRow[]>([]);
  const range = useMemo(() => {
    if (mode === "list") {
      const from = startOfDay(anchor);
      return { from, to: new Date(from.getTime() + 28 * DAY) };
    }
    const from = mode === "week" ? startOfWeek(anchor) : startOfWeek(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
    return { from, to: new Date(from.getTime() + (mode === "week" ? 7 : 42) * DAY) };
  }, [mode, anchor]);
  const reload = useCallback(() => {
    loadPosts(range.from.toISOString(), range.to.toISOString()).then(setPosts, () => setPosts([]));
  }, [range]);
  useEffect(() => {
    reload();
    const t = setInterval(reload, 30000);
    return () => clearInterval(t);
  }, [reload]);
  const shown = channel === "all" ? posts : posts.filter((p) => p.post_targets.some((t) => t.channel_id === channel));
  const byId = useMemo(() => new Map(channels.map((c) => [c.id, c])), [channels]);
  const chip = (p: PostRow) => <PostChip key={p.id} post={p} byId={byId} onOpen={() => setCompose({ post: p })} />;
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
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const step = (dir: -1 | 1) =>
    setAnchor((a) => (mode === "month" ? new Date(a.getFullYear(), a.getMonth() + dir, 1) : new Date(a.getTime() + dir * (mode === "list" ? 28 : 7) * DAY)));

  const title = useMemo(() => {
    if (mode === "month") return anchor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (mode === "list") return `From ${anchor.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    const s = startOfWeek(anchor);
    const e = new Date(s.getTime() + 6 * DAY);
    const sm = s.toLocaleDateString("en-US", { month: "short" });
    const em = e.toLocaleDateString("en-US", { month: "short" });
    return sm === em ? `${sm} ${s.getDate()} to ${e.getDate()}, ${e.getFullYear()}` : `${sm} ${s.getDate()} to ${em} ${e.getDate()}, ${e.getFullYear()}`;
  }, [mode, anchor]);

  return (
    <Page
      icon={<CalendarDays />}
      title="Calendar"
      flush
      actions={
        <Button onClick={() => setCompose({})}>
          <Plus size={14} /> New post
        </Button>
      }
      toolbar={
        <>
          <IconButton label="Previous" onClick={() => step(-1)}>
            <ChevronLeft size={16} />
          </IconButton>
          <Button variant="ghost" onClick={() => setAnchor(new Date())}>
            Today
          </Button>
          <IconButton label="Next" onClick={() => step(1)}>
            <ChevronRight size={16} />
          </IconButton>
          <h2 className="ml-1 text-[13px] font-medium">{title}</h2>
          <span className="flex-1" />
          <Segmented<Mode>
            value={mode}
            onChange={setMode}
            options={[
              { value: "week", label: "Week" },
              { value: "month", label: "Month" },
              { value: "list", label: "List" },
            ]}
          />
        </>
      }
    >
      <div className="flex min-h-full">
        <aside className="sticky top-0 hidden w-56 shrink-0 self-start border-r border-line p-2 md:block">
          <p className="label-mono flex h-6 items-center px-2">
            <span className="bracket">Channels</span>
          </p>
          <ChannelItem on={channel === "all"} onClick={() => setChannel("all")} icon={<Layers size={16} />} label="All channels" />
          {channels.map((c) => (
            <ChannelItem key={c.id} on={channel === c.id} onClick={() => setChannel(c.id)} icon={<NetworkLogo id={c.network} size={16} />} label={c.name} />
          ))}
          {!channels.length ? (
            <Link href="/channels" className="mt-1 flex h-8 items-center gap-2 border border-dashed border-line-strong px-2 text-[13px] text-muted transition-colors hover:border-frame hover:text-ink">
              <Plus size={14} /> Connect a channel
            </Link>
          ) : null}
        </aside>
        <div className="min-w-0 flex-1">
          {mode === "week" ? (
            <Week anchor={anchor} now={now} posts={shown} chip={chip} onPick={(at) => setCompose({ at })} onDrop={(id, at) => drop(id, at, false)} />
          ) : mode === "month" ? (
            <Month anchor={anchor} now={now} posts={shown} chip={chip} onPick={(at) => setCompose({ at })} onDrop={(id, at) => drop(id, at, true)} />
          ) : (
            <List posts={shown} byId={byId} onOpen={(p) => setCompose({ post: p })} />
          )}
        </div>
      </div>
      {compose ? (
        <Composer
          channels={channels}
          at={compose.at}
          post={compose.post}
          preset={channel === "all" ? undefined : channel}
          onClose={() => setCompose(null)}
          onSaved={() => {
            setCompose(null);
            reload();
          }}
        />
      ) : null}
    </Page>
  );
}

function ChannelItem({ on, onClick, icon, label }: { on: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`flex h-8 w-full items-center gap-2 border px-2 text-left text-[13px] transition-colors ${on ? "border-frame bg-yolk font-semibold text-on-yolk" : "border-transparent text-ink/85 hover:bg-pressed"}`}
    >
      {icon}
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </button>
  );
}

function Week({ anchor, now, posts, chip, onPick, onDrop }: { anchor: Date; now: Date; posts: PostRow[]; chip: (p: PostRow) => React.ReactNode; onPick: (at: Date) => void; onDrop: (postId: string, at: Date) => void }) {
  const days = Array.from({ length: 7 }, (_, i) => new Date(startOfWeek(anchor).getTime() + i * DAY));
  const eight = useRef<HTMLDivElement>(null);
  useEffect(() => {
    eight.current?.scrollIntoView({ block: "start" });
  }, []);
  return (
    <div className="grid min-w-[760px] grid-cols-[56px_repeat(7,minmax(0,1fr))]">
      <div className="sticky top-0 z-10 border-b border-line bg-panel" />
      {days.map((d) => {
        const today = sameDay(d, now);
        return (
          <div key={d.toISOString()} className="sticky top-0 z-10 flex h-12 items-center gap-2 border-b border-l border-line bg-panel px-3">
            <span className="text-[12px] text-muted">{d.toLocaleDateString("en-US", { weekday: "short" })}</span>
            <span className={`flex h-6 min-w-6 items-center justify-center px-1 text-[13px] font-medium tabular-nums ${today ? "border border-frame bg-yolk text-on-yolk" : ""}`}>{d.getDate()}</span>
          </div>
        );
      })}
      {HOURS.map((h) => (
        <div key={h} className="contents">
          <div ref={h === 7 ? eight : undefined} className="relative h-14 scroll-mt-12 border-b border-line-light pr-2 text-right">
            <span className="absolute -top-2 right-2 font-mono text-[10px] text-faint">{h ? hourLabel(h) : ""}</span>
          </div>
          {days.map((d) => {
            const at = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h);
            const past = at.getTime() + 3600000 < now.getTime();
            const nowHere = sameDay(d, now) && now.getHours() === h;
            const here = posts.filter((p) => p.publish_at && hourOf(p.publish_at, at));
            return (
              <div key={at.toISOString()} className="relative h-14 border-b border-l border-line-light" {...dropTarget(past, () => at, onDrop)}>
              <button
                type="button"
                disabled={past}
                onClick={() => onPick(at)}
                aria-label={`New post ${at.toLocaleString("en-US", { weekday: "long", hour: "numeric" })}`}
                className={`group absolute inset-0 text-left transition-colors ${past ? "bg-canvas/60" : "hover:bg-hover"}`}
              >
                {!past ? (
                  <span className="absolute inset-1 hidden items-center justify-center border border-dashed border-line-strong text-[11px] text-muted group-hover:flex">
                    <Plus size={12} />
                  </span>
                ) : null}
              </button>
                {here.length ? <div className="pointer-events-none relative z-[1] flex flex-col gap-0.5 p-0.5 [&>*]:pointer-events-auto">{here.slice(0, 2).map(chip)}</div> : null}
                {nowHere ? <span className="pointer-events-none absolute right-0 left-0 z-[2] h-0.5 bg-ink" style={{ top: `${(now.getMinutes() / 60) * 100}%` }} /> : null}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function Month({ anchor, now, posts, chip, onPick, onDrop }: { anchor: Date; now: Date; posts: PostRow[]; chip: (p: PostRow) => React.ReactNode; onPick: (at: Date) => void; onDrop: (postId: string, at: Date) => void }) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const start = startOfWeek(first);
  const days = Array.from({ length: 42 }, (_, i) => new Date(start.getTime() + i * DAY));
  return (
    <div className="grid min-w-[760px] grid-cols-7">
      {days.slice(0, 7).map((d) => (
        <div key={d.getDay()} className="border-b border-l border-line px-3 py-2 text-[12px] text-muted first:border-l-0">
          {d.toLocaleDateString("en-US", { weekday: "short" })}
        </div>
      ))}
      {days.map((d) => {
        const inMonth = d.getMonth() === anchor.getMonth();
        const today = sameDay(d, now);
        const past = startOfDay(d).getTime() < startOfDay(now).getTime();
        const here = posts.filter((p) => p.publish_at && sameDay(new Date(p.publish_at), d));
        return (
          <div key={d.toISOString()} className="relative flex h-28 flex-col items-start gap-0.5 border-b border-l border-line-light p-1.5 [&:nth-child(7n+1)]:border-l-0" {...dropTarget(past, () => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9), onDrop)}>
            <button
              type="button"
              disabled={past}
              aria-label={`New post ${d.toLocaleDateString("en-US", { month: "long", day: "numeric" })}`}
              onClick={() => onPick(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9))}
              className={`absolute inset-0 transition-colors ${past ? "bg-canvas/60" : "hover:bg-hover"}`}
            />
            <span className={`pointer-events-none relative flex h-6 min-w-6 items-center justify-center px-1 text-[12px] tabular-nums ${today ? "border border-frame bg-yolk font-medium text-on-yolk" : inMonth ? "text-ink" : "text-light"}`}>{d.getDate()}</span>
            <div className="relative flex w-full flex-col gap-0.5">
              {here.slice(0, 3).map(chip)}
              {here.length > 3 ? <span className="text-[11px] text-muted">{here.length - 3} more</span> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const STATUS: Record<PostRow["status"], string> = {
  draft: "border-dashed border-line-strong bg-panel text-muted",
  scheduled: "border-frame bg-panel text-ink",
  publishing: "border-frame bg-yolk-soft text-ink",
  published: "border-frame bg-yolk text-on-yolk",
  partial: "border-warning bg-warning-soft text-ink",
  failed: "border-danger bg-danger-soft text-danger",
};

function PostChip({ post, byId, onOpen }: { post: PostRow; byId: Map<string, Channel>; onOpen: () => void }) {
  const nets = [...new Set(post.post_targets.map((t) => byId.get(t.channel_id)?.network).filter(Boolean))] as Channel["network"][];
  const time = post.publish_at ? new Date(post.publish_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "";
  return (
    <button
      type="button"
      onClick={onOpen}
      title={`${post.status}: ${post.text}`}
      draggable={MOVABLE.includes(post.status)}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/x-post", post.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className={`flex h-6 w-full min-w-0 items-center gap-1 border px-1 text-left text-[11px] ${MOVABLE.includes(post.status) ? "cursor-grab active:cursor-grabbing" : ""} ${STATUS[post.status]}`}
    >
      {nets.slice(0, 3).map((n) => (
        <NetworkLogo key={n} id={n} size={11} />
      ))}
      <span className="shrink-0 font-medium tabular-nums">{time}</span>
      <span className="min-w-0 truncate">{post.text}</span>
    </button>
  );
}

const MOVABLE: PostRow["status"][] = ["draft", "scheduled", "failed"];

/** Props that make a calendar cell accept a dragged post. Past cells don't. */
function dropTarget(past: boolean, at: () => Date, onDrop: (postId: string, at: Date) => void) {
  if (past) return {};
  return {
    onDragOver: (e: React.DragEvent) => {
      if (e.dataTransfer.types.includes("text/x-post")) {
        e.preventDefault();
        e.currentTarget.classList.add("bg-yolk-soft");
      }
    },
    onDragLeave: (e: React.DragEvent) => e.currentTarget.classList.remove("bg-yolk-soft"),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      e.currentTarget.classList.remove("bg-yolk-soft");
      const id = e.dataTransfer.getData("text/x-post");
      if (id) onDrop(id, at());
    },
  };
}

const LABEL: Record<PostRow["status"], string> = { draft: "Draft", scheduled: "Scheduled", publishing: "Posting", published: "Published", partial: "Partly published", failed: "Failed" };
const TONE: Record<PostRow["status"], "gray" | "yellow" | "green" | "amber" | "red"> = { draft: "gray", scheduled: "yellow", publishing: "yellow", published: "green", partial: "amber", failed: "red" };

function List({ posts, byId, onOpen }: { posts: PostRow[]; byId: Map<string, Channel>; onOpen: (p: PostRow) => void }) {
  if (!posts.length) return <p className="px-6 py-12 text-center text-[13px] text-muted">No posts in these 4 weeks</p>;
  const days = new Map<string, PostRow[]>();
  for (const p of posts) {
    const k = new Date(p.publish_at!).toDateString();
    days.set(k, [...(days.get(k) ?? []), p]);
  }
  return (
    <div className="mx-auto w-full max-w-[880px] p-4 md:p-6">
      {[...days.entries()].map(([day, list]) => (
        <section key={day} className="mb-6">
          <p className="label-mono mb-2">
            <span className="bracket">{new Date(day).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</span>
          </p>
          <div className="border border-frame">
            {list.map((p) => (
              <button key={p.id} type="button" onClick={() => onOpen(p)} className="flex w-full items-center gap-3 border-b border-line px-3 py-2.5 text-left last:border-b-0 hover:bg-hover">
                <span className="w-16 shrink-0 text-[12px] font-medium tabular-nums">{new Date(p.publish_at!).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
                <span className="flex shrink-0 gap-0.5">
                  {p.post_targets.map((t) => {
                    const c = byId.get(t.channel_id);
                    return c ? <NetworkLogo key={t.id} id={c.network} size={14} /> : null;
                  })}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px]">{p.text || p.post_targets.find((t) => t.text)?.text || "No text"}</span>
                <Badge tone={TONE[p.status]}>{LABEL[p.status]}</Badge>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
