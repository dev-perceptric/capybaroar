"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Check, ImagePlus, Trash2 } from "lucide-react";
import { Modal } from "./Overlay";
import { Avatar, Button, Field, IconButton, Segmented, TextArea, inputClass } from "./ui";
import { Loader } from "./Loader";
import { NetworkLogo } from "./NetworkLogo";
import { askConfirm } from "./Dialogs";
import { networkOf } from "@/lib/networks";
import type { Channel } from "@/lib/channels";
import type { PostRow } from "@/lib/posts";
import { loadMedia, remove, save } from "@/app/(app)/calendar/actions";

type Media = { id: string; name: string; mime: string; thumb: string | null };

const pad = (n: number) => String(n).padStart(2, "0");
const localValue = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const nextHour = () => {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return d;
};

/** Write a post once, pick where it goes and when. */
export function Composer({ channels, at, post, preset, onClose, onSaved }: { channels: Channel[]; at?: Date; post?: PostRow; preset?: string; onClose: () => void; onSaved: () => void }) {
  const locked = post ? !["draft", "scheduled", "failed"].includes(post.status) : false;
  const [picked, setPicked] = useState<string[]>(() => (post ? post.post_targets.map((t) => t.channel_id) : preset ? [preset] : []));
  const [text, setText] = useState(post?.text ?? "");
  const [mediaIds, setMediaIds] = useState<string[]>(post?.media_ids ?? []);
  const [when, setWhen] = useState(() => localValue(post?.publish_at ? new Date(post.publish_at) : (at ?? nextHour())));
  const [view, setView] = useState("");
  const [library, setLibrary] = useState<Media[] | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [error, setError] = useState("");
  const [busy, start] = useTransition();

  useEffect(() => {
    if ((showLibrary || mediaIds.length) && !library) loadMedia().then(setLibrary, () => setLibrary([]));
  }, [showLibrary, mediaIds.length, library]);

  const chosen = channels.filter((c) => picked.includes(c.id));
  const shownId = view && picked.includes(view) ? view : picked[0];
  const shown = channels.find((c) => c.id === shownId);
  const over = useMemo(() => chosen.filter((c) => text.length > networkOf(c.network).limit), [chosen, text]);
  const files = (library ?? []).filter((m) => mediaIds.includes(m.id));

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const submit = (mode: "draft" | "schedule") =>
    start(async () => {
      setError("");
      const r = await save({ id: post?.id, text, channelIds: picked, mediaIds, publishAt: when ? new Date(when).toISOString() : null, mode });
      if (r.error) setError(r.error);
      else onSaved();
    });
  const del = async () => {
    if (!post || !(await askConfirm("Delete this post?", { ok: "Delete", danger: true }))) return;
    start(async () => {
      const r = await remove(post.id);
      if (r.error) setError(r.error);
      else onSaved();
    });
  };

  return (
    <Modal
      title={post ? (locked ? "Post" : "Edit post") : "New post"}
      wide
      onClose={onClose}
      footer={
        locked ? (
          <div className="flex w-full items-center gap-2">
            <span className="flex-1" />
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          <div className="flex w-full flex-wrap items-center gap-2">
            <input type="datetime-local" aria-label="Publish time" value={when} onChange={(e) => setWhen(e.target.value)} className={inputClass.replace("w-full", "w-[220px]")} />
            {post ? (
              <IconButton label="Delete" onClick={del}>
                <Trash2 size={16} />
              </IconButton>
            ) : null}
            <span className="flex-1" />
            <Button variant="ghost" disabled={busy} onClick={() => submit("draft")}>
              Save draft
            </Button>
            <Button disabled={busy || !picked.length || (!text.trim() && !mediaIds.length) || over.length > 0} onClick={() => submit("schedule")}>
              {busy ? <Loader /> : null}
              Schedule
            </Button>
          </div>
        )
      }
    >
      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_280px]">
        <div className="flex min-w-0 flex-col gap-4">
          <Field label="Channels">
            {channels.length ? (
              <div className="flex flex-wrap gap-1.5">
                {channels.map((c) => {
                  const on = picked.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      aria-pressed={on}
                      disabled={locked}
                      title={`${c.name}, ${networkOf(c.network).name}`}
                      onClick={() => toggle(c.id)}
                      className={`relative flex size-10 items-center justify-center border transition-colors ${on ? "border-frame bg-yolk" : "border-line hover:border-frame"} ${c.status === "reconnect" ? "opacity-50" : ""}`}
                    >
                      {c.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.avatar} alt="" className="size-7 rounded-full object-cover" />
                      ) : (
                        <Avatar label={c.name} size={28} />
                      )}
                      <span className="absolute -right-1 -bottom-1 bg-panel">
                        <NetworkLogo id={c.network} size={13} />
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <Link href="/channels" className="inline-flex h-8 w-fit items-center border border-dashed border-line-strong px-3 text-[13px] text-muted hover:border-frame hover:text-ink">
                Connect a channel
              </Link>
            )}
          </Field>
          <Field label="Text">
            <TextArea rows={8} value={text} readOnly={locked} onChange={(e) => setText(e.target.value)} placeholder="What do you want to share?" />
          </Field>
          {chosen.length ? (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] tabular-nums">
              {chosen.map((c) => {
                const n = networkOf(c.network);
                return (
                  <span key={c.id} className={`inline-flex items-center gap-1.5 ${text.length > n.limit ? "text-danger" : "text-muted"}`}>
                    <NetworkLogo id={c.network} size={12} />
                    {text.length} / {n.limit}
                  </span>
                );
              })}
            </div>
          ) : null}
          {files.length ? (
            <div className="flex flex-wrap gap-2">
              {files.map((m) => (
                <Thumb key={m.id} m={m} on onClick={locked ? undefined : () => setMediaIds((ids) => ids.filter((x) => x !== m.id))} />
              ))}
            </div>
          ) : null}
          {!locked ? (
            showLibrary ? (
              <div className="border border-frame p-2">
                {library === null ? (
                  <Loader />
                ) : library.length ? (
                  <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
                    {library.map((m) => (
                      <Thumb key={m.id} m={m} on={mediaIds.includes(m.id)} onClick={() => setMediaIds((ids) => (ids.includes(m.id) ? ids.filter((x) => x !== m.id) : [...ids, m.id]))} />
                    ))}
                  </div>
                ) : (
                  <p className="text-[12px] text-muted">
                    No files yet.{" "}
                    <Link href="/media" className="font-medium text-ink underline underline-offset-2">
                      Upload in Media
                    </Link>
                  </p>
                )}
              </div>
            ) : (
              <button type="button" onClick={() => setShowLibrary(true)} className="flex h-16 items-center justify-center gap-2 border border-dashed border-line-strong text-[13px] text-muted transition-colors hover:border-frame hover:text-ink">
                <ImagePlus size={16} />
                Add media
              </button>
            )
          ) : null}
          {error ? <p className="text-[12px] text-danger">{error}</p> : null}
          {post?.post_targets.some((t) => t.error || t.url) ? (
            <div className="flex flex-col gap-1 border-t border-line pt-3">
              {post.post_targets.map((t) => {
                const c = channels.find((x) => x.id === t.channel_id);
                return (
                  <p key={t.id} className="flex items-center gap-2 text-[12px]">
                    {c ? <NetworkLogo id={c.network} size={12} /> : null}
                    <span className="font-medium">{c?.name ?? "Removed channel"}</span>
                    {t.url ? (
                      <a href={t.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                        Open post
                      </a>
                    ) : null}
                    {t.error ? <span className="text-danger">{t.error}</span> : null}
                  </p>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <p className="label-mono">
            <span className="bracket">Preview</span>
          </p>
          {shown ? (
            <>
              {chosen.length > 1 ? <Segmented value={shown.id} onChange={setView} options={chosen.map((c) => ({ value: c.id, label: "", icon: <NetworkLogo id={c.network} size={14} /> }))} /> : null}
              <div className="border border-frame bg-panel p-3">
                <div className="mb-2 flex items-center gap-2">
                  {shown.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={shown.avatar} alt="" className="size-7 rounded-full object-cover" />
                  ) : (
                    <Avatar label={shown.name} size={28} />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold">{shown.name}</p>
                    <p className="flex items-center gap-1 text-[11px] text-faint">
                      <NetworkLogo id={shown.network} size={10} /> {networkOf(shown.network).name}
                    </p>
                  </div>
                </div>
                <p className="text-[13px] break-words whitespace-pre-wrap">{text || <span className="text-faint">Your post shows here.</span>}</p>
                {files.length ? (
                  <div className={`mt-2 grid gap-0.5 ${files.length > 1 ? "grid-cols-2" : ""}`}>
                    {files.slice(0, 4).map((m) =>
                      m.mime.startsWith("video/") ? (
                        <video key={m.id} src={m.thumb ?? undefined} className="aspect-square w-full bg-pressed object-cover" muted />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={m.id} src={m.thumb ?? ""} alt="" className="aspect-square w-full bg-pressed object-cover" />
                      ),
                    )}
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <div className="flex h-32 items-center justify-center border border-dashed border-line text-[12px] text-faint">Pick a channel</div>
          )}
        </div>
      </div>
    </Modal>
  );
}

function Thumb({ m, on, onClick }: { m: Media; on: boolean; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} disabled={!onClick} title={m.name} className={`relative size-16 shrink-0 overflow-hidden border ${on ? "border-frame" : "border-line"}`}>
      {m.mime.startsWith("video/") ? (
        <video src={m.thumb ?? undefined} className="size-full object-cover" muted />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={m.thumb ?? ""} alt="" className="size-full object-cover" />
      )}
      {on ? (
        <span className="absolute top-0.5 right-0.5 flex size-4 items-center justify-center border border-frame bg-yolk">
          <Check size={11} />
        </span>
      ) : null}
    </button>
  );
}
