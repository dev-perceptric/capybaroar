"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Rss, Trash2 } from "lucide-react";
import { Badge, Button, CardHead, Chip, Field, IconButton, Input, Panel, Row, Segmented, Switch, timeAgo } from "./ui";
import { Modal } from "./Overlay";
import { MultiSelect, Select } from "./Select";
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
  const add = (size: "sm" | "md") => (
    <Button size={size} onClick={() => setEditing("new")} disabled={!channels.length}>
      <Plus /> Add feed
    </Button>
  );
  return (
    <div className="mx-auto w-full max-w-[960px]">
      {feeds.length ? (
        <Panel className="overflow-hidden">
          <CardHead label="Feeds" count={feeds.length}>
            {add("sm")}
          </CardHead>
          <div className="divide-y divide-line">
            {feeds.map((f) => (
              <Row
                key={f.id}
                lead={
                  <span className="flex size-8 items-center justify-center rounded-md bg-paper text-muted shadow-track">
                    <Rss size={15} />
                  </span>
                }
                title={f.title || f.url}
                sub={
                  <>
                    <span className="block truncate">
                      {f.url}
                      {f.fetched_at ? `, read ${timeAgo(f.fetched_at)}` : ""}
                    </span>
                    {f.error ? <span className="block truncate text-danger">{f.error}</span> : null}
                  </>
                }
              >
                <span className="mr-1 hidden items-center gap-1 sm:flex">
                  {f.channel_ids
                    .map((id) => byId.get(id))
                    .filter((c): c is Channel => !!c)
                    .slice(0, 5)
                    .map((c) => (
                      <span key={c.id} title={c.name} className="flex">
                        <NetworkLogo id={c.network} size={16} />
                      </span>
                    ))}
                </span>
                <Badge tone={f.mode === "queue" ? "yellow" : "gray"}>{f.mode === "queue" ? "Queue" : "Drafts"}</Badge>
                <span className="mx-1 flex">
                  <Switch on={f.active} label="Active" onChange={(v) => toggle(f, v)} />
                </span>
                <IconButton label="Edit" onClick={() => setEditing(f)}>
                  <Pencil />
                </IconButton>
                <IconButton label="Remove" align="end" onClick={() => del(f)}>
                  <Trash2 />
                </IconButton>
              </Row>
            ))}
          </div>
        </Panel>
      ) : (
        <ToolIntro drawing="timeline" title="Add your first feed" lead="New items from a blog or news feed become drafts or queued posts, every 30 minutes." action={add("md")} />
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
        {mine.length ? (
          <MultiSelect<string> ariaLabel="Channels" noun={["channel", "channels"]} placeholder="Pick channels" values={picked} onChange={setPicked} options={mine.map((c) => ({ value: c.id, label: c.name, icon: <NetworkLogo id={c.network} size={14} /> }))} />
        ) : (
          <span className="text-[12px] text-muted">Connect a channel that posts text first</span>
        )}
      </Field>
      <Field
        label="Template"
        aside={
          <span className="flex gap-1">
            {["{title}", "{link}", "{summary}"].map((t) => (
              <Chip key={t} size="sm" className="font-mono" onClick={() => setTemplate((v) => `${v}${v && !v.endsWith(" ") ? " " : ""}${t}`)}>
                {t}
              </Chip>
            ))}
          </span>
        }
      >
        <Input value={template} onChange={(e) => setTemplate(e.target.value)} />
      </Field>
      <Field label="New items">
        <Segmented<"draft" | "queue">
          label="New items"
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
