"use client";

import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button, CardHead, Field, IconButton, Input, PaneHead, Panel, inputLook } from "./ui";
import { Select } from "./Select";
import { Loader } from "./Loader";
import { BillingSection, type BillingInfo } from "./BillingSection";
import { BrandsSection, MembersSection, type TeamInfo } from "./TeamSettings";
import { ApiSection, type ApiInfo } from "./ApiSettings";
import { saveQueue, saveWorkspace } from "@/app/(app)/settings/actions";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const zones = () => (typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : ["UTC"]);

type Tab = "general" | "brands" | "members" | "queue" | "api" | "billing";

const noSub = () => () => {};

/** A short "Saved" or the error, after a save. */
export function SaveNote({ msg }: { msg: string }) {
  return msg ? (
    <span role="status" className={`text-[12px] ${msg === "Saved" ? "text-success" : "text-danger"}`}>
      {msg}
    </span>
  ) : null;
}

/**
 * Settings, like Claritia's: a nav on the left (a row of tabs on a phone) and one pane at a time. The open pane is in
 * the address (`?tab=brands`); older links with a hash (`#brands`, `#billing`) open the same pane.
 */
export function SettingsView({ name, timezone, queue, billing, team, api }: { name: string; timezone: string; queue: { day: number; time: string }[]; billing?: BillingInfo; team?: TeamInfo; api?: ApiInfo }) {
  const [tz, setTz] = useState(timezone);
  const groups: { label: string; tabs: { id: Tab; label: string }[] }[] = [
    {
      label: "Workspace",
      tabs: [{ id: "general", label: "General" }, ...(team ? [{ id: "brands" as const, label: "Brands" }, { id: "members" as const, label: "Members" }] : []), { id: "queue", label: "Queue" }],
    },
    ...(billing ? [{ label: "Plan", tabs: [{ id: "billing" as const, label: "Billing" }] }] : []),
    ...(api ? [{ label: "Developers", tabs: [{ id: "api" as const, label: "API and MCP" }] }] : []),
  ];
  const all = groups.flatMap((g) => g.tabs.map((t) => t.id));
  const known = (v: string | null | undefined): Tab | null => (v && (all as string[]).includes(v) ? (v as Tab) : null);
  const params = useSearchParams();
  const fromQuery = known(params.get("tab"));
  const [picked, setPicked] = useState<Tab | null>(null);
  // A link to another pane (the sidebar's Manage brands) wins over the last pick.
  const [seen, setSeen] = useState(fromQuery);
  if (fromQuery !== seen) {
    setSeen(fromQuery);
    setPicked(null);
  }
  // An older link with a hash (#brands) opens that pane. Read in the browser only.
  const fromHash = known(useSyncExternalStore(noSub, () => window.location.hash.slice(1), () => ""));
  const tab: Tab = picked ?? fromQuery ?? fromHash ?? "general";
  // On a phone the panes are one row of tabs that scrolls sideways: keep the open one in view.
  const nav = useRef<HTMLElement>(null);
  useEffect(() => {
    if (window.matchMedia("(max-width: 767px)").matches) nav.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [tab]);
  const pick = (t: Tab) => {
    setPicked(t);
    window.history.replaceState(null, "", `/settings?tab=${t}`);
  };

  return (
    <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-5 md:flex-row md:gap-10">
      <nav ref={nav} aria-label="Settings" className="-mx-4 flex shrink-0 gap-1 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] md:sticky md:top-0 md:mx-0 md:w-48 md:flex-col md:gap-4 md:self-start md:overflow-visible md:px-0">
        {groups.map((g) => (
          <div key={g.label} className="contents md:flex md:flex-col md:gap-0.5">
            <span className="label-mono hidden px-3 pb-1 md:block">{g.label}</span>
            {g.tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                aria-current={tab === t.id ? "page" : undefined}
                onClick={() => pick(t.id)}
                className={`flex h-8 shrink-0 items-center rounded-md px-3 text-left text-[13px] whitespace-nowrap transition-[background-color,box-shadow,color] duration-[var(--duration-fast)] ${tab === t.id ? "bg-panel font-medium text-ink shadow-chip" : "text-body hover:bg-hover hover:text-ink"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="flex max-w-[760px] min-w-0 flex-1 flex-col gap-5">
        {tab === "general" ? <General name={name} tz={tz} setTz={setTz} /> : null}
        {tab === "brands" && team ? <BrandsSection team={team} /> : null}
        {tab === "members" && team ? <MembersSection team={team} /> : null}
        {tab === "queue" ? <Queue initial={queue} timezone={tz} /> : null}
        {tab === "api" && api ? <ApiSection api={api} /> : null}
        {tab === "billing" && billing ? <BillingSection info={billing} /> : null}
      </div>
    </div>
  );
}

function General({ name, tz, setTz }: { name: string; tz: string; setTz: (v: string) => void }) {
  const [n, setN] = useState(name);
  const [msg, setMsg] = useState("");
  const [busy, start] = useTransition();
  const save = () =>
    start(async () => {
      const r = await saveWorkspace(n, tz);
      setMsg(r.error ?? "Saved");
    });
  return (
    <>
      <PaneHead title="General" line="The name and time zone of this workspace" />
      <Panel className="flex flex-col gap-4 p-5">
        <Field label="Name">
          <Input value={n} onChange={(e) => setN(e.target.value)} />
        </Field>
        <Field label="Time zone">
          <Select ariaLabel="Time zone" value={tz} onChange={setTz} options={[...new Set([tz, ...zones()])].map((z) => ({ value: z, label: z.replace(/_/g, " ") }))} />
        </Field>
        <div className="flex items-center gap-3 pt-1">
          <Button onClick={save} disabled={busy}>
            {busy ? <Loader /> : null}
            Save
          </Button>
          <SaveNote msg={msg} />
        </div>
      </Panel>
    </>
  );
}

function Queue({ initial, timezone }: { initial: { day: number; time: string }[]; timezone: string }) {
  const [slots, setSlots] = useState(initial);
  const [msg, setMsg] = useState("");
  const [busy, start] = useTransition();
  const set = (i: number, p: Partial<{ day: number; time: string }>) => setSlots((s) => s.map((x, j) => (j === i ? { ...x, ...p } : x)));
  return (
    <>
      <PaneHead title="Queue" line={`Times that Add to queue fills, in ${timezone.replace(/_/g, " ")}`} />
      <Panel className="overflow-hidden">
        <CardHead label="Times" count={slots.length}>
          <Button variant="ghost" size="sm" onClick={() => setSlots((s) => [...s, { day: 1, time: "09:00" }])}>
            <Plus /> Add a time
          </Button>
        </CardHead>
        {slots.length ? (
          <div className="divide-y divide-line">
            {slots.map((s, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2.5">
                <Select ariaLabel="Day" className="w-44 max-w-[50%]" value={String(s.day)} onChange={(v) => set(i, { day: Number(v) })} options={DAYS.map((d, n) => ({ value: String(n), label: d }))} />
                <input type="time" aria-label="Time" value={s.time} onChange={(e) => set(i, { time: e.target.value })} className={`${inputLook} w-32`} />
                <span className="flex-1" />
                <IconButton label="Remove" align="end" onClick={() => setSlots((all) => all.filter((_, j) => j !== i))}>
                  <Trash2 />
                </IconButton>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-4 py-6 text-center text-[13px] text-muted">No times yet</p>
        )}
        <div className="flex items-center gap-3 border-t border-line bg-paper px-4 py-3">
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
          <SaveNote msg={msg} />
        </div>
      </Panel>
    </>
  );
}
