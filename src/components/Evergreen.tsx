"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Repeat } from "lucide-react";
import { Button, Field, IconButton, Switch } from "./ui";
import { Floating } from "./Floating";
import { Select } from "./Select";
import { EVERGREEN_WEEKS } from "@/lib/evergreen";
import { fmtDate } from "@/lib/format";
import type { Evergreen as State } from "@/lib/repost";
import { changeEvergreen, loadEvergreen } from "@/app/(app)/calendar/repost";

const label = (w: number) => (w === 1 ? "Every week" : `Every ${w} weeks`);

/** The composer's Evergreen control for a published post: it goes out again as a queued copy every N weeks. */
export function EvergreenButton({ postId }: { postId: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<State | null>(null);
  const [weeks, setWeeks] = useState(4);
  const [error, setError] = useState("");
  const [busy, start] = useTransition();
  useEffect(() => {
    loadEvergreen(postId).then(
      (s) => {
        setState(s);
        if (s) setWeeks(s.everyWeeks);
      },
      () => setState(null),
    );
  }, [postId]);
  const apply = (w: number | null) =>
    start(async () => {
      setError("");
      const r = await changeEvergreen(postId, w);
      if (r.error) setError(r.error);
      else setState(r.evergreen ?? null);
    });
  return (
    <span ref={ref} className="relative inline-flex">
      <IconButton label={state ? `Evergreen, ${label(state.everyWeeks).toLowerCase()}` : "Evergreen"} onClick={() => setOpen((o) => !o)} className={state ? "bg-signal-soft text-ink" : ""}>
        <Repeat size={16} />
      </IconButton>
      {open ? (
        <Floating anchor={ref} placement="bottom-end" onClose={() => setOpen(false)} role="dialog" aria-label="Evergreen" className="w-72 rounded-lg border border-frame bg-panel p-3 shadow-pop">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="flex-1 text-[13px] font-medium">Evergreen</span>
              <Switch on={!!state} label="Evergreen" disabled={busy} onChange={(on) => apply(on ? weeks : null)} />
            </div>
            <Field label="Post again">
              <Select value={weeks} onChange={(w) => (setWeeks(w), state ? apply(w) : undefined)} options={EVERGREEN_WEEKS.map((w) => ({ value: w, label: label(w) }))} disabled={busy} />
            </Field>
            {state ? <p className="text-[12px] text-muted">Next copy {fmtDate(state.nextAt, { weekday: "short" })}</p> : null}
            {state?.error ? <p className="text-[12px] text-danger">{state.error}</p> : null}
            {error ? <p className="text-[12px] text-danger">{error}</p> : null}
            {!state ? (
              <Button variant="ghost" disabled={busy} onClick={() => apply(weeks)}>
                Turn on
              </Button>
            ) : null}
          </div>
        </Floating>
      ) : null}
    </span>
  );
}
