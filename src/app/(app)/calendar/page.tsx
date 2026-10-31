"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button, IconButton, Page, Segmented } from "@/components/ui";
import { Composer } from "@/components/Composer";

type Mode = "week" | "month";

const DAY = 86400000;
const HOURS = Array.from({ length: 24 }, (_, h) => h);
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const startOfWeek = (d: Date) => {
  const s = startOfDay(d);
  return new Date(s.getTime() - ((s.getDay() + 6) % 7) * DAY);
};
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const hourLabel = (h: number) => (h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`);

export default function CalendarPage() {
  const [mode, setMode] = useState<Mode>("week");
  const [anchor, setAnchor] = useState(() => new Date());
  const [compose, setCompose] = useState<{ at?: Date } | null>(null);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const step = (dir: -1 | 1) =>
    setAnchor((a) => (mode === "week" ? new Date(a.getTime() + dir * 7 * DAY) : new Date(a.getFullYear(), a.getMonth() + dir, 1)));

  const title = useMemo(() => {
    if (mode === "month") return anchor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
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
            ]}
          />
        </>
      }
    >
      {mode === "week" ? <Week anchor={anchor} now={now} onPick={(at) => setCompose({ at })} /> : <Month anchor={anchor} now={now} onPick={(at) => setCompose({ at })} />}
      {compose ? <Composer at={compose.at} onClose={() => setCompose(null)} /> : null}
    </Page>
  );
}

function Week({ anchor, now, onPick }: { anchor: Date; now: Date; onPick: (at: Date) => void }) {
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
            return (
              <button
                key={at.toISOString()}
                type="button"
                disabled={past}
                onClick={() => onPick(at)}
                aria-label={`New post ${at.toLocaleString("en-US", { weekday: "long", hour: "numeric" })}`}
                className={`group relative h-14 border-b border-l border-line-light text-left transition-colors ${past ? "bg-canvas/60" : "hover:bg-hover"}`}
              >
                {!past ? (
                  <span className="absolute inset-1 hidden items-center justify-center border border-dashed border-line-strong text-[11px] text-muted group-hover:flex">
                    <Plus size={12} />
                  </span>
                ) : null}
                {nowHere ? <span className="pointer-events-none absolute right-0 left-0 h-0.5 bg-ink" style={{ top: `${(now.getMinutes() / 60) * 100}%` }} /> : null}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function Month({ anchor, now, onPick }: { anchor: Date; now: Date; onPick: (at: Date) => void }) {
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
        return (
          <button
            key={d.toISOString()}
            type="button"
            disabled={past}
            onClick={() => onPick(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9))}
            className={`flex h-28 flex-col items-start border-b border-l border-line-light p-2 text-left transition-colors [&:nth-child(7n+1)]:border-l-0 ${past ? "bg-canvas/60" : "hover:bg-hover"}`}
          >
            <span className={`flex h-6 min-w-6 items-center justify-center px-1 text-[12px] tabular-nums ${today ? "border border-frame bg-yolk font-medium text-on-yolk" : inMonth ? "text-ink" : "text-light"}`}>{d.getDate()}</span>
          </button>
        );
      })}
    </div>
  );
}
