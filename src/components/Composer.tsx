"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Check, Copy, ImagePlus, Layers, Trash2, Type } from "lucide-react";
import { Modal } from "./Overlay";
import { Avatar, Button, Field, IconButton, Input, TextArea, inputClass } from "./ui";
import { Select } from "./Select";
import { Loader } from "./Loader";
import { NetworkLogo } from "./NetworkLogo";
import { askConfirm, askText } from "./Dialogs";
import { networkOf, type NetworkField } from "@/lib/networks";
import type { Channel } from "@/lib/channels";
import type { PostRow } from "@/lib/posts";
import { duplicate, loadMedia, remove, save, saveAlt } from "@/app/(app)/calendar/actions";

type Media = { id: string; name: string; mime: string; thumb: string | null; alt: string | null };
type Target = { text: string | null; settings: Record<string, string> };

const pad = (n: number) => String(n).padStart(2, "0");
const localValue = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const nextHour = () => {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return d;
};
const initialSettings = (c: Channel) => Object.fromEntries((networkOf(c.network).fields ?? []).filter((f) => f.initial).map((f) => [f.key, f.initial!]));
const count = (s: string) => [...s].length;

/** Write a post once, change it per channel, pick when it goes out. */
export function Composer({ channels, at, post, preset, onClose, onSaved }: { channels: Channel[]; at?: Date; post?: PostRow; preset?: string; onClose: () => void; onSaved: () => void }) {
  const locked = post ? !["draft", "scheduled", "failed"].includes(post.status) : false;
  const [targets, setTargets] = useState<Record<string, Target>>(() => {
    if (post) return Object.fromEntries(post.post_targets.map((t) => [t.channel_id, { text: t.text, settings: t.settings ?? {} }]));
    const c = channels.find((x) => x.id === preset);
    return c ? { [c.id]: { text: null, settings: initialSettings(c) } } : {};
  });
  const [text, setText] = useState(post?.text ?? "");
  const [mediaIds, setMediaIds] = useState<string[]>(post?.media_ids ?? []);
  const [when, setWhen] = useState(() => localValue(post?.publish_at ? new Date(post.publish_at) : (at ?? nextHour())));
  const [tab, setTab] = useState<string>("all");
  const [library, setLibrary] = useState<Media[] | null>(null);
  const [picking, setPicking] = useState<"media" | { cover: string } | null>(null);
  const [error, setError] = useState("");
  const [busy, start] = useTransition();

  useEffect(() => {
    if (!library) loadMedia().then((m) => setLibrary(m as Media[]), () => setLibrary([]));
  }, [library]);

  const picked = channels.filter((c) => targets[c.id]);
  const active = picked.find((c) => c.id === tab) ?? null;
  const files = mediaIds.map((id) => (library ?? []).find((m) => m.id === id)).filter((m): m is Media => Boolean(m));
  const textOf = (c: Channel) => targets[c.id]?.text ?? text;
  const problems = useMemo(
    () =>
      picked.flatMap((c) => {
        const n = networkOf(c.network);
        const out: string[] = [];
        if (count(textOf(c)) > n.limit) out.push(`${c.name}: over ${n.limit.toLocaleString("en-US")} characters`);
        for (const f of n.fields ?? []) if (f.required && !targets[c.id]?.settings[f.key]?.trim()) out.push(`${c.name}: ${f.label} is required`);
        return out;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [picked, targets, text],
  );

  const toggle = (c: Channel) =>
    setTargets((t) => {
      if (t[c.id]) {
        const rest = { ...t };
        delete rest[c.id];
        return rest;
      }
      return { ...t, [c.id]: { text: null, settings: initialSettings(c) } };
    });
  const patch = (id: string, p: Partial<Target>) => setTargets((t) => ({ ...t, [id]: { ...t[id], ...p } }));
  const setSetting = (id: string, key: string, value: string) => setTargets((t) => ({ ...t, [id]: { ...t[id], settings: { ...t[id].settings, [key]: value } } }));

  const submit = (mode: "draft" | "schedule" | "now" | "queue") =>
    start(async () => {
      setError("");
      const r = await save({
        id: post?.id,
        text,
        mediaIds,
        targets: picked.map((c) => ({ channelId: c.id, text: targets[c.id].text, settings: targets[c.id].settings })),
        publishAt: when ? new Date(when).toISOString() : null,
        mode,
      });
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
  const dup = () =>
    post &&
    start(async () => {
      const r = await duplicate(post.id);
      if (r.error) setError(r.error);
      else onSaved();
    });
  const editAlt = async (m: Media) => {
    const v = await askText("Alt text", { initial: m.alt ?? "", placeholder: "Describe the picture for people who can't see it" });
    if (v == null) return;
    const r = await saveAlt(m.id, v);
    if (r.error) setError(r.error);
    else setLibrary((lib) => (lib ?? []).map((x) => (x.id === m.id ? { ...x, alt: v.trim() || null } : x)));
  };
  const ready = picked.length > 0 && (text.trim() || mediaIds.length || picked.some((c) => targets[c.id].text?.trim())) && !problems.length;

  return (
    <Modal
      title={post ? (locked ? "Post" : "Edit post") : "New post"}
      wide
      onClose={onClose}
      footer={
        locked ? (
          <div className="flex w-full items-center gap-2">
            <IconButton label="Duplicate" onClick={dup} disabled={busy}>
              <Copy size={16} />
            </IconButton>
            <span className="flex-1" />
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          <div className="flex w-full flex-wrap items-center gap-2">
            <input type="datetime-local" aria-label="Publish time" value={when} onChange={(e) => setWhen(e.target.value)} className={inputClass.replace("w-full", "w-[210px]")} />
            {post ? (
              <>
                <IconButton label="Duplicate" onClick={dup} disabled={busy}>
                  <Copy size={16} />
                </IconButton>
                <IconButton label="Delete" onClick={del} disabled={busy}>
                  <Trash2 size={16} />
                </IconButton>
              </>
            ) : null}
            <span className="flex-1" />
            <Button variant="ghost" disabled={busy} onClick={() => submit("draft")}>
              Save draft
            </Button>
            <Button variant="ghost" disabled={busy || !ready} onClick={() => submit("queue")}>
              Add to queue
            </Button>
            <Button variant="ghost" disabled={busy || !ready} onClick={() => submit("now")}>
              Post now
            </Button>
            <Button disabled={busy || !ready} onClick={() => submit("schedule")}>
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
                  const on = Boolean(targets[c.id]);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      aria-pressed={on}
                      disabled={locked}
                      title={`${c.name}, ${networkOf(c.network).name}`}
                      onClick={() => toggle(c)}
                      className={`relative flex size-10 items-center justify-center border transition-colors ${on ? "border-frame bg-yolk" : "border-line hover:border-frame"} ${c.status === "reconnect" ? "opacity-50" : ""}`}
                    >
                      <Face c={c} size={28} />
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

          {picked.length ? (
            <div role="tablist" aria-label="Edit for" className="flex flex-wrap gap-1 border-b border-line pb-2">
              <TabButton on={!active} onClick={() => setTab("all")} label="All channels">
                <Layers size={14} /> All
              </TabButton>
              {picked.map((c) => (
                <TabButton key={c.id} on={active?.id === c.id} onClick={() => setTab(c.id)} label={c.name}>
                  <NetworkLogo id={c.network} size={14} />
                  <span className="max-w-24 truncate">{c.name}</span>
                  {targets[c.id].text != null ? <Type size={11} className="text-muted" aria-label="Own text" /> : null}
                </TabButton>
              ))}
            </div>
          ) : null}

          {active ? (
            <>
              <Field
                label={`Text for ${active.name}`}
                aside={
                  targets[active.id].text != null && !locked ? (
                    <button type="button" onClick={() => patch(active.id, { text: null })} className="text-[12px] text-muted underline underline-offset-2 hover:text-ink">
                      Use shared text
                    </button>
                  ) : null
                }
              >
                <TextArea rows={7} value={textOf(active)} readOnly={locked} onChange={(e) => patch(active.id, { text: e.target.value })} />
              </Field>
              <Counter c={active} text={textOf(active)} />
              {(networkOf(active.network).fields ?? []).map((f) => (
                <SettingField
                  key={f.key}
                  f={f}
                  value={targets[active.id].settings[f.key] ?? ""}
                  locked={locked}
                  onChange={(v) => setSetting(active.id, f.key, v)}
                  cover={(library ?? []).find((m) => m.id === targets[active.id].settings[f.key]) ?? null}
                  onPickCover={() => setPicking({ cover: active.id })}
                />
              ))}
            </>
          ) : (
            <>
              <Field label="Text">
                <TextArea rows={8} value={text} readOnly={locked} onChange={(e) => setText(e.target.value)} placeholder="What do you want to share?" />
              </Field>
              {picked.length ? (
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {picked.map((c) => (
                    <Counter key={c.id} c={c} text={textOf(c)} />
                  ))}
                </div>
              ) : null}
            </>
          )}

          {files.length ? (
            <div className="flex flex-wrap gap-2">
              {files.map((m) => (
                <div key={m.id} className="flex flex-col gap-1">
                  <Thumb m={m} on onClick={locked ? undefined : () => setMediaIds((ids) => ids.filter((x) => x !== m.id))} />
                  {!m.mime.startsWith("video/") && !locked ? (
                    <button type="button" onClick={() => editAlt(m)} className={`text-left text-[11px] underline underline-offset-2 ${m.alt ? "text-muted" : "text-ink"}`}>
                      {m.alt ? "Alt text" : "Add alt text"}
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
          {!locked ? (
            picking ? (
              <div className="border border-frame p-2">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[12px] font-medium">{picking === "media" ? "Add media" : "Pick a cover picture"}</span>
                  <button type="button" onClick={() => setPicking(null)} className="text-[12px] text-muted underline underline-offset-2 hover:text-ink">
                    Done
                  </button>
                </div>
                {library === null ? (
                  <Loader />
                ) : library.length ? (
                  <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
                    {library
                      .filter((m) => picking === "media" || !m.mime.startsWith("video/"))
                      .map((m) =>
                        picking === "media" ? (
                          <Thumb key={m.id} m={m} on={mediaIds.includes(m.id)} onClick={() => setMediaIds((ids) => (ids.includes(m.id) ? ids.filter((x) => x !== m.id) : [...ids, m.id]))} />
                        ) : (
                          <Thumb
                            key={m.id}
                            m={m}
                            on={targets[picking.cover]?.settings.cover === m.id}
                            onClick={() => {
                              setSetting(picking.cover, "cover", m.id);
                              setPicking(null);
                            }}
                          />
                        ),
                      )}
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
              <button type="button" onClick={() => setPicking("media")} className="flex h-14 items-center justify-center gap-2 border border-dashed border-line-strong text-[13px] text-muted transition-colors hover:border-frame hover:text-ink">
                <ImagePlus size={16} />
                Add media
              </button>
            )
          ) : null}
          {error ? <p className="text-[12px] text-danger">{error}</p> : problems.length && !locked ? <p className="text-[12px] text-warning">{problems[0]}</p> : null}
          {post?.post_targets.some((t) => t.error || t.url || t.note) ? (
            <div className="flex flex-col gap-1 border-t border-line pt-3">
              {post.post_targets.map((t) => {
                const c = channels.find((x) => x.id === t.channel_id);
                return (
                  <p key={t.id} className="flex flex-wrap items-center gap-2 text-[12px]">
                    {c ? <NetworkLogo id={c.network} size={12} /> : null}
                    <span className="font-medium">{c?.name ?? "Removed channel"}</span>
                    {t.url ? (
                      <a href={t.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                        Open post
                      </a>
                    ) : null}
                    {t.error ? <span className="text-danger">{t.error}</span> : null}
                    {t.note ? <span className="text-warning">{t.note}</span> : null}
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
          {picked.length ? (
            (active ? [active] : picked.slice(0, 3)).map((c) => (
              <div key={c.id} className="border border-frame bg-panel p-3">
                <div className="mb-2 flex items-center gap-2">
                  <Face c={c} size={28} />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold">{c.name}</p>
                    <p className="flex items-center gap-1 text-[11px] text-faint">
                      <NetworkLogo id={c.network} size={10} /> {networkOf(c.network).name}
                      {targets[c.id].settings.format && targets[c.id].settings.format !== "post" ? `, ${targets[c.id].settings.format}` : ""}
                    </p>
                  </div>
                </div>
                <p className="line-clamp-[12] text-[13px] break-words whitespace-pre-wrap">{textOf(c) || <span className="text-faint">Your post shows here.</span>}</p>
                {files.length ? (
                  <div className={`mt-2 grid gap-0.5 ${files.length > 1 ? "grid-cols-2" : ""}`}>
                    {files.slice(0, 4).map((m) =>
                      m.mime.startsWith("video/") ? (
                        <video key={m.id} src={m.thumb ?? undefined} className="aspect-square w-full bg-pressed object-cover" muted />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={m.id} src={m.thumb ?? ""} alt={m.alt ?? ""} className="aspect-square w-full bg-pressed object-cover" />
                      ),
                    )}
                  </div>
                ) : null}
                {targets[c.id].settings.first_comment ? <p className="mt-2 border-t border-line pt-2 text-[12px] text-muted">{targets[c.id].settings.first_comment}</p> : null}
              </div>
            ))
          ) : (
            <div className="flex h-32 items-center justify-center border border-dashed border-line text-[12px] text-faint">Pick a channel</div>
          )}
        </div>
      </div>
    </Modal>
  );
}

function Face({ c, size }: { c: Channel; size: number }) {
  return c.avatar ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={c.avatar} alt="" style={{ width: size, height: size }} className="rounded-full object-cover" />
  ) : (
    <Avatar label={c.name} size={size} />
  );
}

function TabButton({ on, onClick, label, children }: { on: boolean; onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button type="button" role="tab" aria-selected={on} title={label} onClick={onClick} className={`flex h-7 items-center gap-1.5 border px-2 text-[12px] ${on ? "border-frame bg-yolk font-medium text-on-yolk" : "border-line text-ink/85 hover:border-frame"}`}>
      {children}
    </button>
  );
}

function Counter({ c, text }: { c: Channel; text: string }) {
  const n = networkOf(c.network);
  const len = count(text);
  return (
    <span className={`inline-flex items-center gap-1.5 text-[12px] tabular-nums ${len > n.limit ? "text-danger" : "text-muted"}`}>
      <NetworkLogo id={c.network} size={12} />
      {len} / {n.limit}
    </span>
  );
}

function SettingField({ f, value, locked, onChange, cover, onPickCover }: { f: NetworkField; value: string; locked: boolean; onChange: (v: string) => void; cover: Media | null; onPickCover: () => void }) {
  const label = f.required ? `${f.label} *` : f.label;
  if (f.kind === "select")
    return (
      <Field label={label}>
        <Select value={value} onChange={onChange} disabled={locked} placeholder="Choose" options={f.options ?? []} />
      </Field>
    );
  if (f.kind === "textarea")
    return (
      <Field label={label}>
        <TextArea rows={2} value={value} readOnly={locked} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />
      </Field>
    );
  if (f.kind === "cover")
    return (
      <Field label={label}>
        <div className="flex items-center gap-2">
          {cover ? <Thumb m={cover} on={false} /> : null}
          {!locked ? (
            <>
              <Button variant="ghost" onClick={onPickCover}>
                {cover ? "Change" : "Pick a picture"}
              </Button>
              {cover ? (
                <Button variant="plain" onClick={() => onChange("")}>
                  Remove
                </Button>
              ) : null}
            </>
          ) : null}
        </div>
      </Field>
    );
  return (
    <Field label={label}>
      <Input value={value} readOnly={locked} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

function Thumb({ m, on, onClick }: { m: Media; on: boolean; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} disabled={!onClick} title={m.name} className={`relative size-16 shrink-0 overflow-hidden border ${on ? "border-frame" : "border-line"}`}>
      {m.mime.startsWith("video/") ? (
        <video src={m.thumb ?? undefined} className="size-full object-cover" muted />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={m.thumb ?? ""} alt={m.alt ?? ""} className="size-full object-cover" />
      )}
      {on ? (
        <span className="absolute top-0.5 right-0.5 flex size-4 items-center justify-center border border-frame bg-yolk">
          <Check size={11} />
        </span>
      ) : null}
    </button>
  );
}
