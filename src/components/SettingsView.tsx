"use client";

import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Plus, X } from "lucide-react";
import { Button, CardHead, Chip, Field, IconButton, Input, PaneHead, Panel, inputLook } from "./ui";
import { askConfirm, askText, tell } from "./Dialogs";
import { Select } from "./Select";
import { Loader } from "./Loader";
import { BillingSection, type BillingInfo } from "./BillingSection";
import { BrandsSection, MembersSection, type TeamInfo } from "./TeamSettings";
import { ApiSection, type ApiInfo } from "./ApiSettings";
import { bestQueue, deleteMyAccount, deleteWorkspace, saveQueue, saveWorkspace } from "@/app/(app)/settings/actions";
import { QUEUE_PRESETS, type QueuePreset } from "@/lib/queue";
import { fmtTime } from "@/lib/format";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
/** The queue's days in the order they show: Monday first. Values are `DAYS` indexes, as saved. */
const WEEK = [1, 2, 3, 4, 5, 6, 0];

const zones = () => (typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : ["UTC"]);

type Tab = "general" | "brands" | "members" | "queue" | "api" | "billing" | "account";

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
 * the address (`?tab=brands`); older links with a hash (`#brands`, `#billing`) open the same pane. `owner` adds Delete
 * workspace to General; `accountOnly` (members who don't run the workspace) shows only Your account.
 */
export function SettingsView({ name, timezone, queue, billing, team, api, owner = false, email, accountOnly = false }: { name: string; timezone: string; queue: { day: number; time: string }[]; billing?: BillingInfo; team?: TeamInfo; api?: ApiInfo; owner?: boolean; email?: string; accountOnly?: boolean }) {
  const [tz, setTz] = useState(timezone);
  const account = email != null ? [{ label: "Account", tabs: [{ id: "account" as const, label: "Your account" }] }] : [];
  const groups: { label: string; tabs: { id: Tab; label: string }[] }[] = accountOnly
    ? account
    : [
        {
          label: "Workspace",
          tabs: [{ id: "general", label: "General" }, ...(team ? [{ id: "brands" as const, label: "Brands" }, { id: "members" as const, label: "Members" }] : []), { id: "queue", label: "Queue" }],
        },
        ...(billing ? [{ label: "Plan", tabs: [{ id: "billing" as const, label: "Billing" }] }] : []),
        ...(api ? [{ label: "Developers", tabs: [{ id: "api" as const, label: "API and MCP" }] }] : []),
        ...account,
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
  const tab: Tab = picked ?? fromQuery ?? fromHash ?? all[0] ?? "general";
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
        {tab === "general" ? <General name={name} tz={tz} setTz={setTz} owner={owner} /> : null}
        {tab === "brands" && team ? <BrandsSection team={team} /> : null}
        {tab === "members" && team ? <MembersSection team={team} /> : null}
        {tab === "queue" ? <Queue initial={queue} timezone={tz} /> : null}
        {tab === "api" && api ? <ApiSection api={api} /> : null}
        {tab === "billing" && billing ? <BillingSection info={billing} /> : null}
        {tab === "account" && email != null ? <Account email={email} /> : null}
      </div>
    </div>
  );
}

function General({ name, tz, setTz, owner }: { name: string; tz: string; setTz: (v: string) => void; owner: boolean }) {
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
      {owner ? (
        <Danger
          title="Delete workspace"
          button="Delete workspace"
          ask={`Delete ${name}?`}
          body="Its posts, channels, files and subscription end for everyone. This can't be undone."
          typeWhat={name}
          run={deleteWorkspace}
        />
      ) : null}
    </>
  );
}

function Account({ email }: { email: string }) {
  return (
    <>
      <PaneHead title="Your account" line={email} />
      <Danger
        title="Delete my account"
        button="Delete my account"
        ask="Delete your account?"
        body="You leave every workspace, and workspaces where you're the only member are deleted. This can't be undone."
        typeWhat={email}
        run={deleteMyAccount}
      />
    </>
  );
}

/** A delete that can't be undone: a confirm, then the name typed, then the server signs the person out. */
function Danger({ title, button, ask, body, typeWhat, run }: { title: string; button: string; ask: string; body: string; typeWhat: string; run: (typed: string) => Promise<{ error?: string }> }) {
  const [msg, setMsg] = useState("");
  const [busy, start] = useTransition();
  const go = async () => {
    if (!(await askConfirm(ask, { body, ok: "Continue", danger: true }))) return;
    const typed = await askText(`Type ${typeWhat} to confirm`, { placeholder: typeWhat, ok: button });
    if (typed == null) return;
    if (typed.trim().toLowerCase() !== typeWhat.trim().toLowerCase()) return setMsg("That doesn't match");
    start(async () => {
      const r = await run(typed);
      setMsg(r?.error ?? "");
    });
  };
  return (
    <Panel className="overflow-hidden">
      <CardHead label={title} />
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <Button variant="danger" disabled={busy} onClick={() => void go()}>
          {busy ? <Loader /> : null}
          {button}
        </Button>
        <SaveNote msg={msg} />
      </div>
    </Panel>
  );
}

function Queue({ initial, timezone }: { initial: { day: number; time: string }[]; timezone: string }) {
  const [slots, setSlots] = useState(initial);
  const [msg, setMsg] = useState("");
  const [busy, start] = useTransition();
  const preset = async (k: QueuePreset) => {
    const next = k === "best" ? await bestQueue().catch(() => []) : [...QUEUE_PRESETS[k].slots];
    if (!next.length) return tell("Not enough results yet", "Your best times show once 10 posts have results. Pick another set for now.");
    if (slots.length && !(await askConfirm("Replace your times?", { ok: "Replace" }))) return;
    setSlots(next);
    setMsg("");
  };
  const add = (day: number, time: string) => setSlots((s) => (s.some((x) => x.day === day && x.time === time) ? s : [...s, { day, time }]));
  const remove = (i: number) => setSlots((s) => s.filter((_, j) => j !== i));
  return (
    <>
      <PaneHead title="Queue" line={`Times that Add to queue fills, in ${timezone.replace(/_/g, " ")}`} />
      <Panel className="overflow-hidden">
        <CardHead label="Times" count={slots.length} />
        <div className="flex flex-wrap gap-1.5 border-b border-line px-4 py-3">
          {(Object.keys(QUEUE_PRESETS) as (keyof typeof QUEUE_PRESETS)[]).map((k) => (
            <Chip key={k} size="sm" onClick={() => void preset(k)}>
              {QUEUE_PRESETS[k].label}
            </Chip>
          ))}
          <Chip size="sm" onClick={() => void preset("best")}>
            Your best times
          </Chip>
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
