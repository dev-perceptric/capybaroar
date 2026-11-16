"use client";

// The calendar's channels column: every channel with its posts in view, grouped by brand. Picking one shows only its
// posts. Each channel's menu starts a post at its next free time, edits its own queue times, renames it, copies its
// id, or sends it to Channels to reconnect. It folds down to pictures only, and gives way to a dropdown on phones.
import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { CalendarClock, Clock, Copy, MoreHorizontal, PanelLeftClose, PanelLeftOpen, Pencil, Plus, RefreshCw } from "lucide-react";
import { Button, IconButton, LinkButton, Segmented } from "./ui";
import { Floating } from "./Floating";
import { Sheet } from "./Overlay";
import { NetworkLogo } from "./NetworkLogo";
import { SlotEditor } from "./SlotEditor";
import { Loader } from "./Loader";
import { askText, tell } from "./Dialogs";
import type { Channel } from "@/lib/channels";
import type { Slot } from "@/lib/queue";
import { networkOf } from "@/lib/networks";
import { renameChannel, saveChannelQueue, workspaceQueue } from "@/app/(app)/channels/actions";

type Brand = { id: string; name: string };

export function ChannelRail({
  channels,
  brands,
  counts,
  total,
  picked,
  onPick,
  write,
  folded,
  onFold,
  onNewPost,
}: {
  channels: Channel[];
  brands: Brand[];
  counts: Map<string, number>;
  total: number;
  picked: string;
  onPick: (id: string) => void;
  write: boolean;
  folded: boolean;
  onFold: (v: boolean) => void;
  onNewPost: (channelId: string) => void;
}) {
  const [times, setTimes] = useState<Channel | null>(null);
  // Brands as headings only when the channels span more than one.
  const ids = [...new Set(channels.map((c) => c.brand_id ?? ""))];
  const names = new Map(brands.map((b) => [b.id, b.name]));
  const groups = ids.length < 2 ? [{ id: "", name: "", list: channels }] : ids.map((id) => ({ id, name: names.get(id) ?? "No brand", list: channels.filter((c) => (c.brand_id ?? "") === id) }));

  return (
    <aside aria-label="Channels" className={`hidden shrink-0 flex-col border-r border-line bg-panel md:flex ${folded ? "w-[60px]" : "w-[248px]"}`}>
      <div className={`flex h-12 shrink-0 items-center gap-1 border-b border-line ${folded ? "justify-center" : "pr-2 pl-4"}`}>
        {folded ? null : <span className="label-mono flex-1">Channels</span>}
        <IconButton label={folded ? "Show channel names" : "Hide channel names"} align={folded ? "start" : "end"} onClick={() => onFold(!folded)}>
          {folded ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
        </IconButton>
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto p-2">
        <RailRow folded={folded} on={picked === "all"} onClick={() => onPick("all")} label="All channels" count={total} face={<span className="flex size-7 items-center justify-center rounded-full bg-paper-deep text-[11px] font-semibold text-muted tabular-nums">{channels.length}</span>} />
        {groups.map((g) => (
          <div key={g.id || "one"} className="mt-1">
            {g.name ? folded ? <span className="mx-3 my-2 block border-t border-line" /> : <p className="label-mono truncate px-2 pt-3 pb-1">{g.name}</p> : null}
            {g.list.map((c) => (
              <RailRow
                key={c.id}
                folded={folded}
                on={picked === c.id}
                onClick={() => onPick(picked === c.id ? "all" : c.id)}
                label={c.name}
                sub={c.status === "reconnect" ? "Reconnect" : c.queue ? "Own queue times" : null}
                warn={c.status === "reconnect"}
                count={counts.get(c.id) ?? 0}
                face={<Face c={c} />}
                menu={<RowMenu c={c} write={write} onNewPost={() => onNewPost(c.id)} onTimes={() => setTimes(c)} />}
              />
            ))}
          </div>
        ))}
      </nav>
      {write ? (
        <div className={`shrink-0 border-t border-line p-2 ${folded ? "flex justify-center" : ""}`}>
          {folded ? (
            <Link href="/channels" aria-label="Add a channel" title="Add a channel" className="flex size-8 items-center justify-center rounded-full text-muted hover:bg-hover hover:text-ink">
              <Plus size={16} />
            </Link>
          ) : (
            <LinkButton href="/channels" variant="plain" size="sm" className="w-full !justify-start">
              <Plus /> Add a channel
            </LinkButton>
          )}
        </div>
      ) : null}
      {times ? <TimesSheet c={times} onClose={() => setTimes(null)} /> : null}
    </aside>
  );
}

function RailRow({ folded, on, onClick, label, sub, warn, count, face, menu }: { folded: boolean; on: boolean; onClick: () => void; label: string; sub?: string | null; warn?: boolean; count: number; face: React.ReactNode; menu?: React.ReactNode }) {
  return (
    <div className={`group/row relative flex items-center rounded-md transition-colors ${on ? "bg-signal-soft shadow-picked" : "hover:bg-hover"}`}>
      <button type="button" onClick={onClick} aria-pressed={on} title={folded ? `${label} (${count})` : undefined} className={`flex min-w-0 flex-1 items-center gap-2.5 text-left ${folded ? "justify-center p-1.5" : "py-1.5 pr-9 pl-1.5"}`}>
        <span className="relative shrink-0">
          {face}
          {warn ? <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-danger ring-2 ring-panel" /> : null}
        </span>
        {folded ? null : (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] leading-tight font-medium text-ink">{label}</span>
            {sub ? <span className={`block truncate text-[11.5px] leading-tight ${warn ? "text-danger" : "text-muted"}`}>{sub}</span> : null}
          </span>
        )}
      </button>
      {folded ? null : (
        <span className="absolute right-1.5 flex items-center">
          <span className={`text-[11.5px] text-faint tabular-nums ${menu ? "group-focus-within/row:hidden group-hover/row:hidden" : ""}`}>{count || ""}</span>
          {menu ? <span className="hidden group-focus-within/row:flex group-hover/row:flex">{menu}</span> : null}
        </span>
      )}
    </div>
  );
}

/** The channel's picture with its network's logo on the corner, or the logo alone. */
function Face({ c }: { c: Channel }) {
  return (
    <span className="relative flex size-7 items-center justify-center rounded-full bg-paper-deep">
      {c.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={c.avatar} alt="" className="size-7 rounded-full object-cover" />
      ) : (
        <NetworkLogo id={c.network} size={15} />
      )}
      {c.avatar ? (
        <span className="absolute -right-1 -bottom-1 flex size-4 items-center justify-center rounded-full bg-panel shadow-chip">
          <NetworkLogo id={c.network} size={10} />
        </span>
      ) : null}
    </span>
  );
}

function RowMenu({ c, write, onNewPost, onTimes }: { c: Channel; write: boolean; onNewPost: () => void; onTimes: () => void }) {
  const btn = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const item = "flex h-8 w-full items-center gap-2 rounded-sm px-2.5 text-left hover:bg-hover [&_svg]:size-[13px] [&_svg]:text-muted";
  const run = (f: () => void) => () => {
    setOpen(false);
    f();
  };
  const rename = async () => {
    const v = await askText("Rename channel", { initial: c.name, placeholder: c.account_name ?? c.name, ok: "Save" });
    if (v == null) return;
    const r = await renameChannel(c.id, v);
    if (r.error) await tell("Couldn't rename the channel", r.error);
  };
  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(c.id);
    } catch {
      await tell("Channel ID", c.id);
    }
  };
  return (
    <>
      <button ref={btn} type="button" aria-label={`${c.name} menu`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)} className="flex size-6 items-center justify-center rounded-full text-muted hover:bg-panel hover:text-ink hover:shadow-chip">
        <MoreHorizontal size={14} />
      </button>
      {open ? (
        <Floating anchor={btn} placement="bottom-end" onClose={() => setOpen(false)} role="menu" className="min-w-56 rounded-lg bg-panel p-1.5 text-[13px] shadow-menu">
          <p className="truncate px-2.5 pt-1 pb-1.5 text-[11.5px] font-medium text-faint">{networkOf(c.network).name}</p>
          {write ? (
            <>
              <button type="button" role="menuitem" onClick={run(onNewPost)} className={item}>
                <CalendarClock /> New post at its next time
              </button>
              <button type="button" role="menuitem" onClick={run(onTimes)} className={item}>
                <Clock /> Queue times
              </button>
              <button type="button" role="menuitem" onClick={run(() => void rename())} className={item}>
                <Pencil /> Rename
              </button>
            </>
          ) : null}
          <button type="button" role="menuitem" onClick={run(() => void copyId())} className={item}>
            <Copy /> Copy channel ID
          </button>
          {c.status === "reconnect" && write ? (
            <Link href="/channels" role="menuitem" className={`${item} text-danger [&_svg]:!text-danger`}>
              <RefreshCw /> Reconnect
            </Link>
          ) : null}
        </Floating>
      ) : null}
    </>
  );
}

/** A channel's own queue times, or the workspace's. */
function TimesSheet({ c, onClose }: { c: Channel; onClose: () => void }) {
  const [own, setOwn] = useState(!!c.queue);
  const [slots, setSlots] = useState<Slot[]>(c.queue ?? []);
  const [shared, setShared] = useState<{ slots: Slot[]; timezone: string } | null>(null);
  const [error, setError] = useState("");
  const [busy, start] = useTransition();
  useEffect(() => {
    workspaceQueue().then(setShared, () => setShared({ slots: [], timezone: "UTC" }));
  }, []);
  const pickOwn = (v: boolean) => {
    setOwn(v);
    setError("");
    // Start from the workspace's times, the ones it used until now.
    if (v && !slots.length && shared) setSlots(shared.slots);
  };
  const save = () =>
    start(async () => {
      if (own && !slots.length) return setError("Add a time, or use the workspace's times");
      const r = await saveChannelQueue(c.id, own ? slots : null);
      if (r.error) setError(r.error);
      else onClose();
    });
  return (
    <Sheet open onClose={onClose} label="Queue times" title={`${c.name}: queue times`} over wide>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3">
          <Segmented<"shared" | "own">
            label="Times"
            value={own ? "own" : "shared"}
            onChange={(v) => pickOwn(v === "own")}
            options={[
              { value: "shared", label: "Workspace's times" },
              { value: "own", label: "Own times" },
            ]}
          />
          {shared ? <span className="text-[12px] text-muted">{shared.timezone.replace(/_/g, " ")}</span> : <Loader />}
        </div>
        {own ? (
          <SlotEditor slots={slots} onChange={setSlots} />
        ) : shared ? (
          <p className="px-5 py-4 text-[13px] text-body">
            {shared.slots.length ? `${shared.slots.length} time${shared.slots.length === 1 ? "" : "s"} a week, shared with the other channels.` : "The workspace has no queue times yet."}{" "}
            <Link href="/settings?tab=queue" className="font-medium text-ink underline underline-offset-2">
              Edit in Settings
            </Link>
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-3 border-t border-line bg-paper px-5 py-3">
        <Button disabled={busy} onClick={save}>
          {busy ? <Loader /> : null}
          Save
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        {error ? (
          <span role="alert" className="min-w-0 truncate text-[12px] text-danger">
            {error}
          </span>
        ) : null}
      </div>
    </Sheet>
  );
}
