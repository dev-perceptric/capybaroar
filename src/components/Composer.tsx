"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useTransition } from "react";
import { Check, Copy, ImagePlus, Layers, Monitor, Smartphone, Trash2, Type, Upload, X } from "lucide-react";
import { Avatar, Button, Field, IconButton, Input, Segmented, TextArea, inputClass } from "./ui";
import { Select } from "./Select";
import { Loader } from "./Loader";
import { NetworkLogo } from "./NetworkLogo";
import { askConfirm, askText } from "./Dialogs";
import { Desktop, Phone } from "./Previews";
import { networkOf, type NetworkField } from "@/lib/networks";
import type { Channel } from "@/lib/channels";
import type { PostRow } from "@/lib/posts";
import { bestSlots, duplicate, loadMedia, remove, save, saveAlt } from "@/app/(app)/calendar/actions";
import { endUpload, startUpload } from "@/app/(app)/media/actions";
import { browserClient } from "@/lib/supabase/browser";
import { dialogIn, fadeIn } from "@/lib/motion";

type Media = { id: string; name: string; mime: string; thumb: string | null; alt: string | null };
type Target = { text: string | null; settings: Record<string, string> };
type Uploading = { key: string; name: string; error?: string };

const ACCEPT = "image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime";
const pad = (n: number) => String(n).padStart(2, "0");
const localValue = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const nextHour = () => {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return d;
};
const initialSettings = (c: Channel) => Object.fromEntries((networkOf(c.network).fields ?? []).filter((f) => f.initial).map((f) => [f.key, f.initial!]));
const count = (s: string) => [...s].length;
/** The next time this weekday and hour comes around (browser time, which matches the workspace for most people). */
const nextAt = (day: number, hour: number) => {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(hour);
  let add = (day - d.getDay() + 7) % 7;
  if (add === 0 && d.getTime() <= Date.now()) add = 7;
  d.setDate(d.getDate() + add);
  return d;
};

/** Write a post once, change it per channel, see it on a phone and a desktop, pick when it goes out. Full screen. */
export function Composer({ channels, at, post, preset, onClose, onSaved }: { channels: Channel[]; at?: Date; post?: PostRow; preset?: string; onClose: () => void; onSaved: () => void }) {
  const locked = post ? !["draft", "scheduled", "failed"].includes(post.status) : false;
  const [targets, setTargets] = useState<Record<string, Target>>(() => {
    if (post) return Object.fromEntries(post.post_targets.map((t) => [t.channel_id, { text: t.text, settings: t.settings ?? {} }]));
    const c = channels.find((x) => x.id === preset) ?? (channels.length === 1 ? channels[0] : undefined);
    return c ? { [c.id]: { text: null, settings: initialSettings(c) } } : {};
  });
  const [text, setText] = useState(post?.text ?? "");
  const [mediaIds, setMediaIds] = useState<string[]>(post?.media_ids ?? []);
  const [when, setWhen] = useState(() => localValue(post?.publish_at ? new Date(post.publish_at) : (at ?? nextHour())));
  const [tab, setTab] = useState<string>("all");
  const [view, setView] = useState<string>("");
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
  const [library, setLibrary] = useState<Media[] | null>(null);
  const [picking, setPicking] = useState<"media" | { cover: string } | null>(null);
  const [uploading, setUploading] = useState<Uploading[]>([]);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [busy, start] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    void fadeIn(shell.current);
    void dialogIn(card.current);
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !document.querySelector("[data-dialog-open]") && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const [best, setBest] = useState<{ day: number; hour: number }[]>([]);
  useEffect(() => {
    bestSlots().then(setBest, () => setBest([]));
  }, []);
  useEffect(() => {
    if (!library) loadMedia().then((m) => setLibrary(m as Media[]), () => setLibrary([]));
  }, [library]);

  const picked = channels.filter((c) => targets[c.id]);
  const active = picked.find((c) => c.id === tab) ?? null;
  const shown = picked.find((c) => c.id === view) ?? active ?? picked[0] ?? null;
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

  /** Upload straight to storage with a one-time link, then attach. Several files upload one after another. */
  const upload = async (list: FileList | File[]) => {
    const all = Array.from(list).filter((f) => ACCEPT.split(",").includes(f.type));
    if (!all.length) {
      setError("Use JPG, PNG, GIF, WebP, MP4 or MOV");
      return;
    }
    setError("");
    const sb = browserClient();
    for (const f of all) {
      const key = `${f.name}-${f.size}-${f.lastModified}`;
      setUploading((u) => [...u, { key, name: f.name }]);
      const info = { name: f.name, type: f.type, size: f.size };
      const fail = (msg: string) => setUploading((u) => u.map((x) => (x.key === key ? { ...x, error: msg } : x)));
      const s = await startUpload(info);
      if (s.error || !s.path || !s.token) {
        fail(s.error ?? "Couldn't start the upload");
        continue;
      }
      const { error: e } = await sb.storage.from("media").uploadToSignedUrl(s.path, s.token, f, { contentType: f.type });
      if (e) {
        fail(e.message);
        continue;
      }
      const done = await endUpload({ ...info, path: s.path });
      if (done.error || !done.id) {
        fail(done.error ?? "Upload didn't finish");
        continue;
      }
      const fresh = (await loadMedia()) as Media[];
      setLibrary(fresh);
      setMediaIds((ids) => [...ids, done.id!]);
      setUploading((u) => u.filter((x) => x.key !== key));
    }
  };

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
  const ready = picked.length > 0 && (text.trim() || mediaIds.length || picked.some((c) => targets[c.id].text?.trim())) && !problems.length && !uploading.some((u) => !u.error);

  return (
    <div ref={shell} className="fixed inset-0 z-[80] flex bg-scrim md:p-4" role="dialog" aria-modal="true" aria-label={post ? "Edit post" : "New post"}>
      <div
        ref={card}
        className="relative flex min-h-0 w-full flex-col border border-frame bg-panel"
        onDragOver={(e) => {
          if (locked || !e.dataTransfer.types.includes("Files")) return;
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          if (e.currentTarget === e.target) setDragging(false);
        }}
        onDrop={(e) => {
          if (locked || !e.dataTransfer.files.length) return;
          e.preventDefault();
          setDragging(false);
          void upload(e.dataTransfer.files);
        }}
      >
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line px-4">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em]">{post ? (locked ? "Post" : "Edit post") : "New post"}</h2>
          {picked.length ? (
            <span className="flex items-center gap-1 text-[12px] text-muted">
              to {picked.length} channel{picked.length === 1 ? "" : "s"}
            </span>
          ) : null}
          <span className="flex-1" />
          {post ? (
            <>
              <IconButton label="Duplicate" onClick={dup} disabled={busy}>
                <Copy size={16} />
              </IconButton>
              {!locked ? (
                <IconButton label="Delete" onClick={del} disabled={busy}>
                  <Trash2 size={16} />
                </IconButton>
              ) : null}
            </>
          ) : null}
          <IconButton label="Close" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </header>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(440px,560px)]">
          {/* Editor */}
          <div className="min-h-0 overflow-y-auto">
            <div className="mx-auto flex w-full max-w-[720px] flex-col gap-5 px-5 py-5">
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
                          className={`flex h-10 items-center gap-2 border pr-3 pl-1.5 text-[12px] transition-colors ${on ? "border-frame bg-yolk font-semibold text-on-yolk" : "border-line text-ink/85 hover:border-frame"} ${c.status === "reconnect" ? "opacity-50" : ""}`}
                        >
                          <span className="relative">
                            <Face c={c} size={26} />
                            <span className="absolute -right-1 -bottom-1 flex rounded-full bg-panel">
                              <NetworkLogo id={c.network} size={12} />
                            </span>
                          </span>
                          <span className="max-w-32 truncate">{c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <Link href="/channels" className="inline-flex h-9 w-fit items-center border border-dashed border-line-strong px-3 text-[13px] text-muted hover:border-frame hover:text-ink">
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
                    <TabButton
                      key={c.id}
                      on={active?.id === c.id}
                      onClick={() => {
                        setTab(c.id);
                        setView(c.id);
                      }}
                      label={c.name}
                    >
                      <NetworkLogo id={c.network} size={14} />
                      <span className="max-w-28 truncate">{c.name}</span>
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
                    <TextArea rows={9} value={textOf(active)} readOnly={locked} onChange={(e) => patch(active.id, { text: e.target.value })} className="text-[14px] leading-relaxed" />
                  </Field>
                  <Counter c={active} text={textOf(active)} />
                </>
              ) : (
                <>
                  <Field label="Text">
                    <TextArea
                      rows={10}
                      value={text}
                      readOnly={locked}
                      onChange={(e) => setText(e.target.value)}
                      onPaste={(e) => {
                        if (!locked && e.clipboardData.files.length) {
                          e.preventDefault();
                          void upload(e.clipboardData.files);
                        }
                      }}
                      placeholder="What do you want to share?"
                      className="text-[14px] leading-relaxed"
                    />
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

              {/* Media */}
              <div className="flex flex-col gap-2">
                <p className="text-[12px] font-medium text-muted">Media</p>
                <div className="flex flex-wrap gap-2">
                  {files.map((m) => (
                    <div key={m.id} className="group/thumb relative">
                      <Thumb m={m} />
                      {!locked ? (
                        <>
                          <button type="button" aria-label="Remove" onClick={() => setMediaIds((ids) => ids.filter((x) => x !== m.id))} className="absolute top-1 right-1 hidden size-6 items-center justify-center border border-frame bg-panel group-hover/thumb:flex">
                            <X size={13} />
                          </button>
                          {!m.mime.startsWith("video/") ? (
                            <button type="button" onClick={() => editAlt(m)} className={`absolute inset-x-1 bottom-1 border bg-panel px-1 text-[10px] font-medium ${m.alt ? "border-line text-muted" : "border-frame"}`}>
                              {m.alt ? "Alt text" : "Add alt"}
                            </button>
                          ) : null}
                        </>
                      ) : null}
                    </div>
                  ))}
                  {uploading.map((u) => (
                    <div key={u.key} className={`flex size-28 flex-col items-center justify-center gap-2 border p-2 text-center text-[11px] ${u.error ? "border-danger text-danger" : "border-dashed border-line-strong text-muted"}`}>
                      {u.error ? (
                        <>
                          <span className="line-clamp-3">{u.error}</span>
                          <button type="button" onClick={() => setUploading((all) => all.filter((x) => x.key !== u.key))} className="underline">
                            Dismiss
                          </button>
                        </>
                      ) : (
                        <>
                          <Loader />
                          <span className="line-clamp-2 break-all">{u.name}</span>
                        </>
                      )}
                    </div>
                  ))}
                  {!locked ? (
                    <button
                      type="button"
                      onClick={() => fileInput.current?.click()}
                      className="flex size-28 flex-col items-center justify-center gap-1.5 border border-dashed border-line-strong text-[12px] text-muted transition-colors hover:border-frame hover:text-ink"
                    >
                      <Upload size={18} />
                      Upload
                      <span className="text-[10px] text-faint">or drop files</span>
                    </button>
                  ) : null}
                  {!locked ? (
                    <button
                      type="button"
                      onClick={() => setPicking(picking === "media" ? null : "media")}
                      className={`flex size-28 flex-col items-center justify-center gap-1.5 border text-[12px] transition-colors ${picking === "media" ? "border-frame bg-yolk-soft text-ink" : "border-dashed border-line-strong text-muted hover:border-frame hover:text-ink"}`}
                    >
                      <ImagePlus size={18} />
                      From library
                    </button>
                  ) : null}
                </div>
                <input ref={fileInput} type="file" multiple accept={ACCEPT} className="hidden" onChange={(e) => e.target.files && void upload(e.target.files).then(() => (e.target.value = ""))} />
                {picking ? (
                  <div className="border border-frame p-2">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[12px] font-medium">{picking === "media" ? "Your library" : "Pick a cover picture"}</span>
                      <button type="button" onClick={() => setPicking(null)} className="text-[12px] text-muted underline underline-offset-2 hover:text-ink">
                        Done
                      </button>
                    </div>
                    {library === null ? (
                      <Loader />
                    ) : library.length ? (
                      <div className="flex max-h-56 flex-wrap gap-2 overflow-y-auto">
                        {library
                          .filter((m) => picking === "media" || !m.mime.startsWith("video/"))
                          .map((m) => {
                            const on = picking === "media" ? mediaIds.includes(m.id) : targets[picking.cover]?.settings.cover === m.id;
                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => {
                                  if (picking === "media") setMediaIds((ids) => (ids.includes(m.id) ? ids.filter((x) => x !== m.id) : [...ids, m.id]));
                                  else {
                                    setSetting(picking.cover, "cover", m.id);
                                    setPicking(null);
                                  }
                                }}
                                className="relative"
                              >
                                <Thumb m={m} small />
                                {on ? (
                                  <span className="absolute top-1 right-1 flex size-5 items-center justify-center border border-frame bg-yolk">
                                    <Check size={12} />
                                  </span>
                                ) : null}
                              </button>
                            );
                          })}
                      </div>
                    ) : (
                      <p className="text-[12px] text-muted">No files yet. Drop some here.</p>
                    )}
                  </div>
                ) : null}
              </div>

              {active
                ? (networkOf(active.network).fields ?? [])
                    .filter((f) => !f.when || targets[active.id].settings[f.when.key] === f.when.value)
                    .map((f) => (
                      <SettingField
                        key={f.key}
                        f={f}
                        value={targets[active.id].settings[f.key] ?? ""}
                        locked={locked}
                        onChange={(v) => setSetting(active.id, f.key, v)}
                        cover={(library ?? []).find((m) => m.id === targets[active.id].settings[f.key]) ?? null}
                        onPickCover={() => setPicking({ cover: active.id })}
                      />
                    ))
                : picked.some((c) => (networkOf(c.network).fields ?? []).length) && !locked ? (
                    <p className="text-[12px] text-muted">Open the channel tab for its own settings, like first comment or format.</p>
                  ) : null}

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
          </div>

          {/* Preview */}
          <aside className="hidden min-h-0 flex-col border-l border-line bg-hover/60 lg:flex">
            <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-line bg-panel px-4 py-2.5">
              <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
                {picked.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    title={c.name}
                    aria-pressed={shown?.id === c.id}
                    onClick={() => setView(c.id)}
                    className={`flex size-8 shrink-0 items-center justify-center border ${shown?.id === c.id ? "border-frame bg-yolk" : "border-line hover:border-frame"}`}
                  >
                    <NetworkLogo id={c.network} size={16} />
                  </button>
                ))}
              </div>
              <Segmented
                value={device}
                onChange={(v) => setDevice(v as "mobile" | "desktop")}
                options={[
                  { value: "mobile", label: "Phone", icon: <Smartphone size={14} /> },
                  { value: "desktop", label: "Desktop", icon: <Monitor size={14} /> },
                ]}
              />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              {shown ? (
                device === "mobile" ? (
                  <Phone channel={shown} text={textOf(shown)} media={files} settings={targets[shown.id]?.settings ?? {}} />
                ) : (
                  <Desktop channel={shown} text={textOf(shown)} media={files} settings={targets[shown.id]?.settings ?? {}} />
                )
              ) : (
                <div className="flex h-full items-center justify-center text-[13px] text-faint">Pick a channel to see the preview</div>
              )}
            </div>
          </aside>
        </div>

        {!locked ? (
          <footer className="flex shrink-0 flex-wrap items-center gap-2 border-t border-line px-4 py-3">
            <input type="datetime-local" aria-label="Publish time" value={when} onChange={(e) => setWhen(e.target.value)} className={inputClass.replace("w-full", "w-[210px]")} />
            {best.map((b) => {
              const at = nextAt(b.day, b.hour);
              return (
                <button
                  key={`${b.day}${b.hour}`}
                  type="button"
                  title="One of your best times, from your results"
                  onClick={() => setWhen(localValue(at))}
                  className={`h-8 border px-2 text-[11px] font-medium ${when === localValue(at) ? "border-frame bg-yolk" : "border-line hover:border-frame"}`}
                >
                  {at.toLocaleDateString("en-US", { weekday: "short" })} {at.toLocaleTimeString("en-US", { hour: "numeric" })}
                </button>
              );
            })}
            <span className="min-w-0 flex-1 truncate text-[12px]">{error ? <span className="text-danger">{error}</span> : problems.length ? <span className="text-warning">{problems[0]}</span> : null}</span>
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
          </footer>
        ) : null}

        {dragging ? (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center border-2 border-dashed border-ink bg-yolk-soft/80">
            <span className="flex items-center gap-2 border border-frame bg-panel px-4 py-3 text-[14px] font-semibold">
              <Upload size={18} /> Drop pictures or videos to add them
            </span>
          </div>
        ) : null}
      </div>
    </div>
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
    <button type="button" role="tab" aria-selected={on} title={label} onClick={onClick} className={`flex h-8 items-center gap-1.5 border px-2.5 text-[12px] ${on ? "border-frame bg-yolk font-medium text-on-yolk" : "border-line text-ink/85 hover:border-frame"}`}>
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
          {cover ? <Thumb m={cover} small /> : null}
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

function Thumb({ m, small = false }: { m: Media; small?: boolean }) {
  return (
    <span className={`relative block shrink-0 overflow-hidden border border-line ${small ? "size-20" : "size-28"}`} title={m.name}>
      {m.mime.startsWith("video/") ? (
        <video src={m.thumb ?? undefined} className="size-full object-cover" muted preload="metadata" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={m.thumb ?? ""} alt={m.alt ?? ""} className="size-full object-cover" />
      )}
    </span>
  );
}
