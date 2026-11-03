"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowUp, CheckCheck, ExternalLink, Eye, EyeOff, RotateCcw, Sparkles, ThumbsUp } from "lucide-react";
import { Avatar, Badge, Button, Dot, Empty, IconButton, Search, Segmented, TextArea, timeAgo, useLoad } from "./ui";
import { Select } from "./Select";
import { Loader } from "./Loader";
import { NetworkLogo } from "./NetworkLogo";
import { HoverTip } from "./Floating";
import { askConfirm } from "./Dialogs";
import { networkOf } from "@/lib/networks";
import type { Channel } from "@/lib/channels";
import type { InboxStatus, Item, Thread, ThreadRow } from "@/lib/inbox";
import type { InboxKind } from "@/lib/providers/types";
import { hide, like, loadThread, loadThreads, mark, reply, suggest } from "@/app/(app)/inbox/actions";

type Kind = InboxKind | "";
const KINDS: { value: Kind; label: string }[] = [
  { value: "", label: "All" },
  { value: "comment", label: "Comments" },
  { value: "reply", label: "Replies" },
  { value: "mention", label: "Mentions" },
  { value: "dm", label: "Messages" },
];

type Picked = { key: string; channelId: string; threadId: string };

const typing = (t: EventTarget | null) => t instanceof HTMLElement && Boolean(t.closest("input, textarea, [contenteditable='true']"));

export function InboxView({ channels, errors, initial }: { channels: Channel[]; errors: Record<string, string>; initial: ThreadRow[] }) {
  const [status, setStatus] = useState<InboxStatus>("open");
  const [channel, setChannel] = useState<string | null>(null);
  const [kind, setKind] = useState<Kind>("");
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  const [threads, setThreads] = useState(initial);
  const [listBusy, setListBusy] = useState(false);
  const [error, setError] = useState("");
  const [picked, setPicked] = useState<Picked | null>(null);
  const byId = new Map(channels.map((c) => [c.id, c]));

  useEffect(() => {
    const t = setTimeout(() => setTerm(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  const refresh = useCallback(async () => {
    setListBusy(true);
    const r = await loadThreads({ status, channelId: channel, kind: kind || null, q: term });
    setListBusy(false);
    if (r.error) setError(r.error);
    else {
      setError("");
      setThreads(r.threads ?? []);
    }
  }, [status, channel, kind, term]);

  // The server sends the first list (open, every channel); later filters load here, and the list re-reads every 2 minutes.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    void refresh();
  }, [refresh]);
  useEffect(() => {
    const t = setInterval(() => document.visibilityState === "visible" && void refresh(), 120000);
    return () => clearInterval(t);
  }, [refresh]);

  const pick = (r: ThreadRow | undefined) => setPicked(r ? { key: r.key, channelId: r.channelId, threadId: r.threadId } : null);
  const at = picked ? threads.findIndex((t) => t.key === picked.key) : -1;
  const step = (d: 1 | -1) => {
    if (!threads.length) return;
    const i = at < 0 ? (d === 1 ? 0 : threads.length - 1) : Math.min(threads.length - 1, Math.max(0, at + d));
    pick(threads[i]);
  };

  /** Done (or open again): the thread leaves this list, and the next one opens. */
  const toggle = async (p: Picked) => {
    const next: InboxStatus = status === "open" ? "done" : "open";
    const i = threads.findIndex((t) => t.key === p.key);
    const rest = threads.filter((t) => t.key !== p.key);
    setThreads(rest);
    if (picked?.key === p.key) pick(rest[Math.min(Math.max(i, 0), rest.length - 1)]);
    const r = await mark(p.channelId, p.threadId, next);
    if (r.error) {
      setError(r.error);
      void refresh();
    }
  };

  const keys = useRef<(e: KeyboardEvent) => void>(() => {});
  useEffect(() => {
    keys.current = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || typing(e.target)) return;
      if (document.querySelector('[data-dialog-open],[role="listbox"],[role="menu"]')) return;
      if (e.key === "j" || e.key === "k") {
        e.preventDefault();
        step(e.key === "j" ? 1 : -1);
      } else if (e.key === "e" && picked) {
        e.preventDefault();
        void toggle(picked);
      } else if (e.key === "r" && picked) {
        e.preventDefault();
        document.getElementById("inbox-reply")?.focus();
      }
    };
  });
  useEffect(() => {
    const on = (e: KeyboardEvent) => keys.current(e);
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, []);

  // Keep the picked row in view as j and k move through the list.
  useEffect(() => {
    if (picked) document.querySelector(`[data-thread="${CSS.escape(picked.key)}"]`)?.scrollIntoView({ block: "nearest" });
  }, [picked]);

  return (
    <div className="flex h-full min-h-0">
      <section className={`${picked ? "hidden md:flex" : "flex"} w-full shrink-0 flex-col border-line md:w-[380px] md:border-r`}>
        <div className="space-y-2 border-b border-line p-3">
          <Search value={q} onChange={setQ} placeholder="Search" />
          <div className="flex items-center gap-2">
            <Segmented
              value={status}
              onChange={(v) => {
                setStatus(v);
                setPicked(null);
              }}
              options={[
                { value: "open", label: "Open" },
                { value: "done", label: "Done" },
              ]}
            />
            <Select<Kind> value={kind} options={KINDS} onChange={setKind} lead="Kind" ariaLabel="Kind" className="w-40" />
            {listBusy ? <Loader /> : null}
          </div>
          <div className="-mx-3 flex gap-1.5 overflow-x-auto px-3 pb-0.5">
            <Chip on={!channel} onClick={() => setChannel(null)}>
              All
            </Chip>
            {channels.map((c) => (
              <Chip key={c.id} on={channel === c.id} onClick={() => setChannel(channel === c.id ? null : c.id)}>
                <NetworkLogo id={c.network} size={14} />
                <span className="max-w-32 truncate">{c.name}</span>
                {errors[c.id] || c.status === "reconnect" ? (
                  <span className="relative inline-flex">
                    <Dot tone="red" />
                    <HoverTip text={c.status === "reconnect" ? "Reconnect this channel" : errors[c.id]} wrap />
                  </span>
                ) : null}
              </Chip>
            ))}
          </div>
          {error ? <p className="text-[12px] text-danger">{error}</p> : null}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {threads.length ? (
            threads.map((t) => <Row key={t.key} row={t} channel={byId.get(t.channelId)} on={picked?.key === t.key} onClick={() => pick(t)} />)
          ) : (
            <Empty compact drawing={term ? "nomatch" : "replies"} title={term || channel || kind ? "No matches" : status === "open" ? "All answered" : "Nothing done yet"} />
          )}
        </div>
      </section>
      <section className={`${picked ? "flex" : "hidden md:flex"} min-w-0 flex-1 flex-col`}>
        {picked ? (
          <ThreadPane
            key={picked.key}
            picked={picked}
            channel={byId.get(picked.channelId)}
            status={status}
            onBack={() => setPicked(null)}
            onToggle={() => void toggle(picked)}
            onSent={() => void refresh()}
          />
        ) : (
          <Empty compact drawing="inbox" title="Pick a conversation" />
        )}
      </section>
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={`flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2 text-[12px] transition-[background-color,box-shadow] ${on ? "bg-signal-soft font-medium text-ink shadow-[0_0_0_1px_var(--signal-10)]" : "bg-panel text-ink/85 shadow-chip hover:bg-canvas"}`}>
      {children}
    </button>
  );
}

function Face({ item, channel, size = 32 }: { item: Pick<Item, "author_name" | "author_avatar">; channel?: Channel; size?: number }) {
  return (
    <span className="relative shrink-0" style={{ width: size, height: size }}>
      {item.author_avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.author_avatar} alt="" width={size} height={size} className="rounded-full object-cover" style={{ width: size, height: size }} referrerPolicy="no-referrer" />
      ) : (
        <Avatar label={item.author_name || "?"} size={size} />
      )}
      {channel ? (
        <span className="absolute -right-1 -bottom-1 bg-panel">
          <NetworkLogo id={channel.network} size={14} />
        </span>
      ) : null}
    </span>
  );
}

function Row({ row, channel, on, onClick }: { row: ThreadRow; channel?: Channel; on: boolean; onClick: () => void }) {
  const it = row.last;
  return (
    <button
      type="button"
      data-thread={row.key}
      aria-current={on || undefined}
      onClick={onClick}
      className={`flex w-full gap-3 border-b border-line px-3 py-2.5 text-left transition-colors ${on ? "bg-signal-pale shadow-[inset_2px_0_0_var(--signal-9)]" : "hover:bg-hover"}`}
    >
      <Face item={it} channel={channel} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-[13px] font-medium">{it.author_name || it.author_handle || "Someone"}</span>
          {row.count > 1 ? <span className="text-[12px] text-faint tabular-nums">{row.count}</span> : null}
          <span className="ml-auto shrink-0 text-[11px] text-faint">{timeAgo(it.created_at)}</span>
        </span>
        <span className="mt-0.5 line-clamp-2 text-[12px] text-muted">{it.text || "No text"}</span>
      </span>
    </button>
  );
}

function ThreadPane({ picked, channel, status, onBack, onToggle, onSent }: { picked: Picked; channel?: Channel; status: InboxStatus; onBack: () => void; onToggle: () => void; onSent: () => void }) {
  const loaded = useLoad(async (): Promise<Thread> => {
    const r = await loadThread(picked.channelId, picked.threadId);
    if (r.error || !r.thread) throw new Error(r.error ?? "This conversation is gone");
    return r.thread;
  }, picked.key);
  const thread = loaded.data;
  const setThread = loaded.set;
  const [failed, setError] = useState("");
  const error = failed || loaded.error;
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const box = useRef<HTMLTextAreaElement>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [thread?.items.length]);

  const net = channel ? networkOf(channel.network) : null;
  const can = net?.inbox ?? {};
  const items = thread?.items ?? [];
  // Answers go to the newest message the channel didn't write.
  const target = [...items].reverse().find((i) => !i.mine) ?? null;
  const head = target ?? items[0];

  const patch = (id: string, p: Partial<Item>) => setThread((t) => (t ? { ...t, items: t.items.map((i) => (i.id === id ? { ...i, ...p } : i)) } : t));

  const send = async () => {
    const body = text.trim();
    if (!body || !target || sending) return;
    setSending(true);
    setError("");
    const r = await reply(target.id, body);
    setSending(false);
    if (r.error) return setError(r.error);
    setText("");
    loaded.reload();
    onSent();
  };

  const draft = async () => {
    if (!target || suggesting) return;
    setSuggesting(true);
    setError("");
    const r = await suggest(target.id);
    setSuggesting(false);
    if (r.error) return setError(r.error);
    setText(r.text ?? "");
    box.current?.focus();
  };

  const toggleLike = async (i: Item) => {
    patch(i.id, { liked: !i.liked });
    const r = await like(i.id, !i.liked);
    if (r.error) {
      patch(i.id, { liked: i.liked });
      setError(r.error);
    }
  };

  const toggleHide = async (i: Item) => {
    if (!i.hidden && can.hideOnce && !(await askConfirm(`Remove this comment from ${net?.name}?`, { body: `${net?.name} can't show it again.`, ok: "Remove", danger: true }))) return;
    patch(i.id, { hidden: !i.hidden });
    const r = await hide(i.id, !i.hidden);
    if (r.error) {
      patch(i.id, { hidden: i.hidden });
      setError(r.error);
    }
  };

  return (
    <>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-line px-3">
        <IconButton label="Back" onClick={onBack} className="md:hidden">
          <ArrowLeft size={16} />
        </IconButton>
        {head ? (
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium">{head.author_name || head.author_handle || "Someone"}</p>
            <p className="truncate text-[11px] text-faint">
              {channel?.name}
              {head.author_handle ? `, @${head.author_handle}` : ""}
            </p>
          </div>
        ) : (
          <span className="flex-1" />
        )}
        <IconButton label={status === "open" ? "Mark done (e)" : "Open again (e)"} align="end" onClick={onToggle}>
          {status === "open" ? <CheckCheck size={16} /> : <RotateCcw size={16} />}
        </IconButton>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {!thread && !error ? (
          <div className="flex justify-center py-12">
            <Loader />
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-[720px] flex-col gap-4 px-4 py-5">
            {thread?.post.text || thread?.post.url ? (
              <div className="rounded-lg border border-frame p-3">
                <div className="mb-1.5 flex items-center gap-2">
                  <p className="label-mono">
                    Post
                  </p>
                  <span className="flex-1" />
                  {thread.post.url ? (
                    <a href={thread.post.url} target="_blank" rel="noreferrer" aria-label="Open post" className="text-muted hover:text-ink">
                      <ExternalLink size={13} />
                    </a>
                  ) : null}
                </div>
                {thread.post.text ? <p className="line-clamp-4 text-[13px] whitespace-pre-wrap text-muted">{thread.post.text}</p> : null}
              </div>
            ) : null}
            {items.map((i) => (
              <Message key={i.id} item={i} channel={channel} like={can.like && i.kind !== "dm" && !i.mine ? () => void toggleLike(i) : undefined} hide={can.hide && i.kind !== "dm" && !i.mine && !(can.hideOnce && i.hidden) ? () => void toggleHide(i) : undefined} />
            ))}
            <div ref={end} />
          </div>
        )}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        className="mx-3 mb-3 rounded-lg bg-panel shadow-input transition-shadow focus-within:shadow-focus md:mx-4 md:mb-4"
      >
        <TextArea
          ref={box}
          id="inbox-reply"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              void send();
            }
          }}
          placeholder={target ? `Reply to ${target.author_name || "them"}` : "Reply"}
          disabled={!target}
          className="resize-none rounded-lg border-0 bg-transparent shadow-none focus:shadow-none"
        />
        <div className="flex items-center gap-2 border-t border-line px-2 py-1.5">
          {error ? <p className="min-w-0 truncate text-[12px] text-danger">{error}</p> : null}
          <span className="flex-1" />
          {net && text.length ? <span className={`text-[11px] tabular-nums ${[...text].length > net.limit ? "text-danger" : "text-faint"}`}>{net.limit - [...text].length}</span> : null}
          <Button type="button" variant="ghost" onClick={() => void draft()} disabled={!target || suggesting}>
            {suggesting ? <Loader /> : <Sparkles />}
            Suggest reply
          </Button>
          <IconButton label="Send" variant="primary" type="submit" align="end" disabled={!text.trim() || !target || sending}>
            {sending ? <Loader className="text-white" /> : <ArrowUp size={16} />}
          </IconButton>
        </div>
      </form>
    </>
  );
}

function Message({ item, channel, like, hide }: { item: Item; channel?: Channel; like?: () => void; hide?: () => void }) {
  if (item.mine)
    return (
      <div className="ml-auto max-w-[85%]">
        <p className="rounded-lg bg-hover px-3 py-2 text-[13px] whitespace-pre-wrap">{item.text}</p>
        <p className="mt-1 text-right text-[11px] text-faint">
          {channel?.name}, {timeAgo(item.created_at)}
        </p>
      </div>
    );
  return (
    <div className={`flex gap-3 ${item.hidden ? "opacity-60" : ""}`}>
      <Face item={item} size={28} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[13px] font-medium">{item.author_name || item.author_handle || "Someone"}</span>
          <span className="shrink-0 text-[11px] text-faint">{timeAgo(item.created_at)}</span>
          {item.hidden ? <Badge>Hidden</Badge> : null}
        </div>
        <p className="mt-0.5 text-[13px] leading-relaxed whitespace-pre-wrap">{item.text || "No text"}</p>
        <div className="mt-1 -ml-2 flex items-center gap-0.5">
          {like ? (
            <IconButton label={item.liked ? "Unlike" : "Like"} onClick={like} aria-pressed={item.liked} className={item.liked ? "text-ink" : ""}>
              <ThumbsUp size={15} fill={item.liked ? "currentColor" : "none"} />
            </IconButton>
          ) : null}
          {hide ? (
            <IconButton label={item.hidden ? "Show" : "Hide"} onClick={hide}>
              {item.hidden ? <Eye size={15} /> : <EyeOff size={15} />}
            </IconButton>
          ) : null}
          {item.url ? (
            <a href={item.url} target="_blank" rel="noreferrer" aria-label="Open on the network" className="inline-flex size-8 items-center justify-center text-muted hover:bg-hover hover:text-ink">
              <ExternalLink size={14} />
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
