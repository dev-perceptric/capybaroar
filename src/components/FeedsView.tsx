"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Rss, Trash2 } from "lucide-react";
import { Badge, Button, Field, IconButton, Input, Segmented, Switch, timeAgo } from "./ui";
import { Modal } from "./Overlay";
import { Select } from "./Select";
import { ToolIntro } from "./ToolIntro";
import { Loader } from "./Loader";
import { NetworkLogo } from "./NetworkLogo";
import { askConfirm, tell } from "./Dialogs";
import { networkOf } from "@/lib/networks";
import type { Channel } from "@/lib/channels";
import type { FeedRow } from "@/lib/feeds";
import { createFeed, editFeed, removeFeed } from "@/app/(app)/channels/feeds/actions";

type Brand = { id: string; name: string };

export function FeedsView({ feeds, channels, brands, brandId }: { feeds: FeedRow[]; channels: Channel[]; brands: Brand[]; brandId: string | null }) {
  const [editing, setEditing] = useState<FeedRow | "new" | null>(null);
  const [, start] = useTransition();
  const router = useRouter();
  const byId = new Map(channels.map((c) => [c.id, c]));
  const toggle = (f: FeedRow, active: boolean) =>
    start(async () => {
      const r = await editFeed(f.id, { active });
      if (r.error) await tell("Couldn't change the feed", r.error);
      router.refresh();
    });
  const del = async (f: FeedRow) => {
    if (!(await askConfirm(`Remove ${f.title || f.url}?`, { body: "Posts it already made stay on the calendar.", ok: "Remove", danger: true }))) return;
    start(async () => {
      const r = await removeFeed(f.id);
      if (r.error) await tell("Couldn't remove the feed", r.error);
      router.refresh();
    });
  };
  const add = (
    <Button onClick={() => setEditing("new")} disabled={!channels.length}>
      <Plus size={14} /> Add feed
    </Button>
  );
  return (
    <div className="mx-auto w-full max-w-[960px]">
      {feeds.length ? (
        <>
          <div className="mb-3 flex items-center">
            <p className="label-mono flex-1">Feeds</p>
            {add}
          </div>
          <div className="overflow-hidden rounded-lg border border-frame">
            {feeds.map((f) => (
              <div key={f.id} className="flex min-h-14 items-center gap-3 border-b border-line px-3 py-2 last:border-b-0">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-hover text-muted">
                  <Rss size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">{f.title || f.url}</p>
                  <p className="truncate text-[11px] text-faint">
                    {f.url}
                    {f.fetched_at ? `, read ${timeAgo(f.fetched_at)}` : ""}
                  </p>
                  {f.error ? <p className="truncate text-[11px] text-danger">{f.error}</p> : null}
                </div>
                <span className="hidden items-center gap-1 sm:flex">
                  {f.channel_ids.map((id) => byId.get(id)).filter((c): c is Channel => !!c).slice(0, 5).map((c) => (
                    <span key={c.id} title={c.name} className="flex">
                      <NetworkLogo id={c.network} size={16} />
                    </span>
                  ))}
                </span>
                <Badge tone={f.mode === "queue" ? "yellow" : "gray"}>{f.mode === "queue" ? "Queue" : "Drafts"}</Badge>
                <Switch on={f.active} label="Active" onChange={(v) => toggle(f, v)} />
                <IconButton label="Edit" onClick={() => setEditing(f)}>
                  <Pencil size={16} />
                </IconButton>
                <IconButton label="Remove" onClick={() => del(f)}>
                  <Trash2 size={16} />
                </IconButton>
              </div>
            ))}
          </div>
        </>
      ) : (
        <ToolIntro drawing="timeline" title="Add your first feed" lead="New items from a blog or news feed become drafts or queued posts, every 30 minutes." action={add} />
      )}
      {editing ? (
        <FeedDialog
          feed={editing === "new" ? null : editing}
          channels={channels}
          brands={brands}
          brandId={brandId}
          onClose={() => setEditing(null)}
          onDone={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}

function FeedDialog({ feed, channels, brands, brandId, onClose, onDone }: { feed: FeedRow | null; channels: Channel[]; brands: Brand[]; brandId: string | null; onClose: () => void; onDone: () => void }) {
  const [brand, setBrand] = useState(feed?.brand_id ?? brandId ?? brands[0]?.id ?? "");
  const [url, setUrl] = useState(feed?.url ?? "");
  const [picked, setPicked] = useState<string[]>(feed?.channel_ids ?? []);
  const [template, setTemplate] = useState(feed?.template ?? "{title} {link}");
  const [mode, setMode] = useState<"draft" | "queue">(feed?.mode ?? "draft");
  const [error, setError] = useState("");
  const [busy, start] = useTransition();
  const mine = channels.filter((c) => c.brand_id === brand && !networkOf(c.network).needsMedia);
  const flip = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const save = () =>
    start(async () => {
      setError("");
      const channelIds = picked.filter((id) => mine.some((c) => c.id === id));
      const r = feed ? await editFeed(feed.id, { channelIds, template, mode }) : await createFeed(brand, { url, channelIds, template, mode });
      if (r.error) setError(r.error);
      else onDone();
    });
  return (
    <Modal
      title={feed ? "Edit feed" : "Add feed"}
      onClose={onClose}
      footer={
        <Button onClick={save} disabled={busy || (!feed && !url.trim())}>
          {busy ? <Loader /> : null}
          {feed ? "Save" : "Add feed"}
        </Button>
      }
    >
      {!feed && brands.length > 1 ? (
        <Field label="Brand">
          <Select value={brand} onChange={(v) => (setBrand(v), setPicked([]))} options={brands.map((b) => ({ value: b.id, label: b.name }))} />
        </Field>
      ) : null}
      <Field label="Feed URL">
        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/feed" disabled={!!feed} autoFocus={!feed} inputMode="url" />
      </Field>
      <Field label="Channels">
        <div className="flex flex-wrap gap-1.5">
          {mine.map((c) => {
            const on = picked.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={on}
                onClick={() => flip(c.id)}
                className={`flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[12px] transition-[background-color,box-shadow] ${on ? "bg-signal-soft font-medium shadow-[0_0_0_1px_var(--signal-10)]" : "bg-panel shadow-chip hover:bg-canvas"}`}
              >
                <NetworkLogo id={c.network} size={14} />
                <span className="max-w-40 truncate">{c.name}</span>
              </button>
            );
          })}
          {!mine.length ? <span className="text-[12px] text-muted">Connect a channel that posts text first</span> : null}
        </div>
      </Field>
      <Field
        label="Template"
        aside={
          <span className="flex gap-1">
            {["{title}", "{link}", "{summary}"].map((t) => (
              <button key={t} type="button" onClick={() => setTemplate((v) => `${v}${v && !v.endsWith(" ") ? " " : ""}${t}`)} className="rounded-xs bg-hover px-1.5 font-mono text-[11px] text-muted hover:text-ink">
                {t}
              </button>
            ))}
          </span>
        }
      >
        <Input value={template} onChange={(e) => setTemplate(e.target.value)} />
      </Field>
      <Field label="New items">
        <Segmented<"draft" | "queue">
          value={mode}
          onChange={setMode}
          options={[
            { value: "draft", label: "Drafts" },
            { value: "queue", label: "Add to queue" },
          ]}
        />
      </Field>
      {error ? <p className="text-[12px] text-danger">{error}</p> : null}
    </Modal>
  );
}
