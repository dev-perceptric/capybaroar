"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button, Field, IconButton, Input, inputClass } from "./ui";
import { Select } from "./Select";
import { Loader } from "./Loader";
import { BillingSection, type BillingInfo } from "./BillingSection";
import { saveQueue, saveWorkspace } from "@/app/(app)/settings/actions";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const zones = () => (typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : ["UTC"]);

export function SettingsView({ name, timezone, queue, billing }: { name: string; timezone: string; queue: { day: number; time: string }[]; billing?: BillingInfo }) {
  const [n, setN] = useState(name);
  const [tz, setTz] = useState(timezone);
  const [msg, setMsg] = useState("");
  const [busy, start] = useTransition();
  const save = () =>
    start(async () => {
      const r = await saveWorkspace(n, tz);
      setMsg(r.error ?? "Saved");
    });
  return (
    <div className="mx-auto w-full max-w-[640px]">
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-[15px] font-medium">Workspace</h2>
          <p className="text-[12px] text-muted">The name and time zone of this workspace</p>
        </div>
        <Field label="Name">
          <Input value={n} onChange={(e) => setN(e.target.value)} />
        </Field>
        <Field label="Time zone">
          <Select value={tz} onChange={setTz} options={[...new Set([tz, ...zones()])].map((z) => ({ value: z, label: z.replace(/_/g, " ") }))} />
        </Field>
        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={busy}>
            {busy ? <Loader /> : null}
            Save
          </Button>
          {msg ? <span className={`text-[12px] ${msg === "Saved" ? "text-success" : "text-danger"}`}>{msg}</span> : null}
        </div>
      </section>
      <Queue initial={queue} timezone={tz} />
      {billing ? <BillingSection info={billing} /> : null}
    </div>
  );
}

function Queue({ initial, timezone }: { initial: { day: number; time: string }[]; timezone: string }) {
  const [slots, setSlots] = useState(initial);
  const [msg, setMsg] = useState("");
  const [busy, start] = useTransition();
  const set = (i: number, p: Partial<{ day: number; time: string }>) => setSlots((s) => s.map((x, j) => (j === i ? { ...x, ...p } : x)));
  return (
    <section className="mt-10 flex flex-col gap-4 border-t border-line pt-8">
      <div>
        <h2 className="text-[15px] font-medium">Queue</h2>
        <p className="text-[12px] text-muted">Times that Add to queue fills, in {timezone.replace(/_/g, " ")}</p>
      </div>
      {slots.map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-44">
            <Select value={String(s.day)} onChange={(v) => set(i, { day: Number(v) })} options={DAYS.map((d, n) => ({ value: String(n), label: d }))} />
          </div>
          <input type="time" aria-label="Time" value={s.time} onChange={(e) => set(i, { time: e.target.value })} className={inputClass.replace("w-full", "w-32")} />
          <IconButton label="Remove" onClick={() => setSlots((all) => all.filter((_, j) => j !== i))}>
            <Trash2 size={16} />
          </IconButton>
        </div>
      ))}
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => setSlots((s) => [...s, { day: 1, time: "09:00" }])}>
          <Plus size={14} /> Add a time
        </Button>
        <Button
          disabled={busy}
          onClick={() =>
            start(async () => {
              const r = await saveQueue(slots);
              setMsg(r.error ?? "Saved");
            })
          }
        >
          {busy ? <Loader /> : null}
          Save
        </Button>
        {msg ? <span className={`text-[12px] ${msg === "Saved" ? "text-success" : "text-danger"}`}>{msg}</span> : null}
      </div>
    </section>
  );
}
