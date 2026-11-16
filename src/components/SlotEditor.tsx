"use client";

// Queue times by weekday, with ready-made sets: the workspace's queue (Settings) and a channel's own (Calendar).
import { useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { Chip, IconButton, inputLook } from "./ui";
import { askConfirm, tell } from "./Dialogs";
import { QUEUE_PRESETS, type Slot } from "@/lib/queue";
import { fmtTime } from "@/lib/format";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
/** The queue's days in the order they show: Monday first. Values are `DAYS` indexes, as saved. */
const WEEK = [1, 2, 3, 4, 5, 6, 0];

/** `best`: the workspace's best times as slots, for the "Your best times" set (left out: no such set). */
export function SlotEditor({ slots, onChange, best }: { slots: Slot[]; onChange: (s: Slot[]) => void; best?: () => Promise<Slot[]> }) {
  const preset = async (k: keyof typeof QUEUE_PRESETS | "best") => {
    const next = k === "best" ? await (best?.() ?? Promise.resolve([])).catch(() => []) : [...QUEUE_PRESETS[k].slots];
    if (!next.length) return tell("Not enough results yet", "Your best times show once 10 posts have results. Pick another set for now.");
    if (slots.length && !(await askConfirm("Replace your times?", { ok: "Replace" }))) return;
    onChange(next);
  };
  const add = (day: number, time: string) => !slots.some((x) => x.day === day && x.time === time) && onChange([...slots, { day, time }]);
  const remove = (i: number) => onChange(slots.filter((_, j) => j !== i));
  return (
    <>
      {/* One line of sets that scrolls sideways on a phone, so none ends up alone on a second line. */}
      <div className="flex gap-1.5 overflow-x-auto border-b border-line px-4 py-3 [scrollbar-width:none]">
        {(Object.keys(QUEUE_PRESETS) as (keyof typeof QUEUE_PRESETS)[]).map((k) => (
          <Chip key={k} size="sm" onClick={() => void preset(k)}>
            {QUEUE_PRESETS[k].label}
          </Chip>
        ))}
        {best ? (
          <Chip size="sm" onClick={() => void preset("best")}>
            Your best times
          </Chip>
        ) : null}
      </div>
      <div className="divide-y divide-line">
        {WEEK.map((day) => (
          <QueueDay
            key={day}
            day={day}
            times={slots
              .map((s, i) => ({ ...s, i }))
              .filter((s) => s.day === day)
              .sort((a, b) => a.time.localeCompare(b.time))}
            onAdd={(t) => add(day, t)}
            onRemove={remove}
          />
        ))}
      </div>
    </>
  );
}

/** One weekday: its times as small removable items, and Add time. */
function QueueDay({ day, times, onAdd, onRemove }: { day: number; times: { time: string; i: number }[]; onAdd: (time: string) => void; onRemove: (i: number) => void }) {
  const [adding, setAdding] = useState<string | null>(null);
  const commit = () => {
    if (adding && /^\d{2}:\d{2}$/.test(adding)) onAdd(adding);
    setAdding(null);
  };
  return (
    <div className="flex min-h-12 flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2">
      <span className="w-24 shrink-0 text-[13px] font-medium">{DAYS[day]}</span>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        {times.map((t) => (
          <span key={t.i} className="inline-flex h-7 items-center gap-0.5 rounded-full bg-panel pr-1 pl-2.5 text-[12px] text-body tabular-nums shadow-chip">
            {fmtTime(`2000-01-01T${t.time}:00`)}
            <button type="button" aria-label={`Remove ${DAYS[day]} ${t.time}`} onClick={() => onRemove(t.i)} className="inline-flex size-5 items-center justify-center rounded-full text-muted transition-colors hover:bg-hover hover:text-ink">
              <X size={12} />
            </button>
          </span>
        ))}
        {adding != null ? (
          <span className="inline-flex items-center gap-1">
            <input
              type="time"
              autoFocus
              aria-label={`New time on ${DAYS[day]}`}
              value={adding}
              onChange={(e) => setAdding(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") setAdding(null);
              }}
              className={`${inputLook} h-7 w-28 px-2 text-[12px]`}
            />
            <IconButton label="Add" onClick={commit}>
              <Check />
            </IconButton>
            <IconButton label="Cancel" onClick={() => setAdding(null)}>
              <X />
            </IconButton>
          </span>
        ) : (
          <Chip size="sm" dashed onClick={() => setAdding(times.length ? next(times[times.length - 1].time) : "09:00")}>
            <Plus size={12} /> Add time
          </Chip>
        )}
      </div>
    </div>
  );
}

/** An hour after `time`, kept within the day. */
const next = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return `${String(Math.min(23, h + 1)).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};
