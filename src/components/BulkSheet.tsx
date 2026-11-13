"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Download, FileUp, ImagePlus, Sparkles, X } from "lucide-react";
import { Badge, Button, Field, IconButton, Input, Segmented, TextArea, Th, inputLook, type Tone } from "./ui";
import { ToolIntro } from "./ToolIntro";
import { Loader } from "./Loader";
import { NetworkLogo } from "./NetworkLogo";
import { MultiSelect } from "./Select";
import { askConfirm, tell } from "./Dialogs";
import { dialogIn, fadeIn } from "@/lib/motion";
import { fmtDateTime } from "@/lib/format";
import { MAX_CSV, parseBulk, TEMPLATE, type BulkRow } from "@/lib/bulk";
import type { Channel } from "@/lib/channels";
import type { PostStatus } from "@/lib/posts";
import { bulkCaption, bulkCheck, bulkCsv, bulkMedia, bulkTimes, bulkZone } from "@/app/(app)/calendar/bulk";
import { endUpload, startUpload } from "@/app/(app)/media/actions";
import { creditGate } from "./creditGate";

// Bulk upload, opened from the calendar: a CSV file (one row, one post, checked row by row before anything is saved)
// or a stack of pictures and videos (one post each, spread over the queue or one a day). Everything is saved as
// drafts or scheduled through the same savePost as the composer.

type Tab = "csv" | "media";
type Result = { status?: PostStatus; error?: string };
const ACCEPT = "image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime";
const CHUNK = 10;
const LABEL: Partial<Record<PostStatus, string>> = { draft: "Draft", review: "In review", scheduled: "Scheduled" };
const TONE: Partial<Record<PostStatus, Tone>> = { draft: "gray", review: "violet", scheduled: "yellow" };

function ResultTag({ r }: { r: Result | undefined }) {
  if (!r) return null;
  if (r.error) return <span className="text-[12px] text-danger">{r.error}</span>;
  return r.status ? <Badge tone={TONE[r.status] ?? "gray"}>{LABEL[r.status] ?? r.status}</Badge> : null;
}

export function BulkSheet({ channels, onClose, onSaved }: { channels: Channel[]; onClose: () => void; onSaved: () => void }) {
  const [tab, setTab] = useState<Tab>("csv");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const shell = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    void fadeIn(shell.current);
    void dialogIn(card.current);
  }, []);
  const close = () => {
    if (busy) return;
    if (saved) onSaved();
    else onClose();
  };
  const closeRef = useRef(close);
  useLayoutEffect(() => {
    closeRef.current = close;
  });
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented || document.querySelector('[data-dialog-open],[role="menu"],[role="listbox"]')) return;
      // A question asked on top of the sheet (tell, askConfirm) answers its own Escape.
      const t = e.target as HTMLElement | null;
      if (t?.closest?.('[role="dialog"]') && !shell.current?.contains(t)) return;
      e.preventDefault();
      closeRef.current();
    };
    window.addEventListener("keydown", key);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", key);
      document.body.style.overflow = prev;
    };
  }, []);
  const work = { busy, setBusy, onSaved: () => setSaved(true) };
  return (
    <div ref={shell} className="fixed inset-0 z-[80] flex bg-scrim md:p-4" role="dialog" aria-modal="true" aria-label="Bulk">
      <div ref={card} className="relative flex min-h-0 w-full flex-col overflow-hidden rounded-2xl bg-panel shadow-modal">
        <header className="flex min-h-14 shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-line py-2 pr-3 pl-5">
          <h2 className="text-[16px] font-semibold tracking-[-0.02em]">Bulk</h2>
          <Segmented<Tab>
            label="Import from"
            size="sm"
            value={tab}
            onChange={(t) => !busy && setTab(t)}
            options={[
              { value: "csv", label: "CSV file" },
              { value: "media", label: "Pictures and videos" },
            ]}
          />
          <span className="flex-1" />
          <IconButton label="Close (Esc)" onClick={close} disabled={busy}>
            <X size={18} />
          </IconButton>
        </header>
        {tab === "csv" ? <CsvTab channels={channels} {...work} /> : <MediaTab channels={channels} {...work} />}
      </div>
    </div>
  );
}

type Work = { busy: boolean; setBusy: (b: boolean) => void; onSaved: () => void };

function Footer({ note, busy, onDrafts, onSchedule, ready, scheduleCount }: { note: React.ReactNode; busy: boolean; onDrafts: () => void; onSchedule: () => void; ready: number; scheduleCount: number }) {
  return (
    <footer className="flex shrink-0 flex-wrap items-center gap-2 border-t border-line bg-paper px-4 py-3">
      <span role="status" className="min-w-0 flex-1 text-[12px] text-muted">
        {note}
      </span>
      <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
        <Button variant="ghost" disabled={busy || !ready} onClick={onDrafts}>
          Save {ready} as drafts
        </Button>
        <Button disabled={busy || !scheduleCount} onClick={onSchedule}>
          {busy ? <Loader /> : null}
          Schedule {scheduleCount}
        </Button>
      </div>
    </footer>
  );
}

// CSV

function CsvTab({ channels, busy, setBusy, onSaved }: { channels: Channel[] } & Work) {
  const [zone, setZone] = useState<string | null>(null);
  const [file, setFile] = useState<{ name: string; text: string } | null>(null);
  const [results, setResults] = useState<Record<number, Result>>({});
  const [progress, setProgress] = useState("");
  const [fileError, setFileError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    bulkZone().then(setZone, () => setZone("UTC"));
  }, []);
  const parsed = useMemo(() => (file && zone ? parseBulk(file.text, channels, zone) : null), [file, zone, channels]);
  const byId = useMemo(() => new Map(channels.map((c) => [c.id, c])), [channels]);
  const open = async (f: File | undefined) => {
    if (!f) return;
    setFileError("");
    if (f.size > MAX_CSV) return setFileError("CSV files are up to 900 KB");
    setResults({});
    setFile({ name: f.name, text: await f.text() });
  };
  const template = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([TEMPLATE], { type: "text/csv" }));
    a.download = "capybaroar-posts.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const rows = parsed?.rows ?? [];
  const todo = rows.filter((r) => !r.errors.length && !results[r.line]?.status);
  const schedulable = todo.filter((r) => !r.holds.length);
  const run = async (mode: "draft" | "schedule") => {
    if (!file || !todo.length) return;
    if (mode === "schedule") {
      const check = await bulkCheck(schedulable.length);
      if (check.error) return tell("Can't schedule these posts", check.error);
    }
    setBusy(true);
    let done = 0;
    try {
      for (let i = 0; i < todo.length; i += CHUNK) {
        const part = todo.slice(i, i + CHUNK);
        setProgress(`Saving ${Math.min(i + CHUNK, todo.length)} of ${todo.length}`);
        const r = await bulkCsv(file.text, part.map((x) => x.line), mode);
        if (r.error) {
          await tell("Couldn't save the posts", r.error);
          break;
        }
        const next: Record<number, Result> = {};
        for (const x of r.results ?? []) next[Number(x.key)] = { status: x.status, error: x.error };
        done += (r.results ?? []).filter((x) => x.status).length;
        setResults((all) => ({ ...all, ...next }));
      }
    } finally {
      setBusy(false);
      setProgress("");
      if (done) onSaved();
    }
  };
  const replace = async () => {
    if (Object.values(results).some((r) => r.status) || !(await askConfirm("Choose another file?", { ok: "Choose" }))) return;
    input.current?.click();
  };
  const picker = <input ref={input} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => (void open(e.target.files?.[0]), (e.target.value = ""))} />;
  if (!file)
    return (
      <div className="min-h-0 flex-1 overflow-y-auto" onDragOver={(e) => e.preventDefault()} onDrop={(e) => (e.preventDefault(), void open(e.dataTransfer.files[0]))}>
        {picker}
        <ToolIntro
          drawing="records"
          title={"Import posts\nfrom a CSV file"}
          lead="One row is one post, with the columns date, time, channels, text, media URL and first comment."
          action={
            <>
              <Button onClick={() => input.current?.click()}>
                <FileUp /> Choose file
              </Button>
              <Button variant="ghost" onClick={template}>
                <Download /> Template
              </Button>
            </>
          }
        />
        {fileError ? (
          <p role="alert" className="pb-6 text-center text-[13px] text-danger">
            {fileError}
          </p>
        ) : null}
      </div>
    );
  const errors = rows.filter((r) => r.errors.length).length;
  return (
    <>
      {picker}
      <div className="flex min-h-12 shrink-0 flex-wrap items-center gap-3 border-b border-line px-5 py-2">
        <span className="min-w-0 truncate text-[13px] font-medium">{file.name}</span>
        <span className="text-[12px] text-muted tabular-nums">{rows.length} rows</span>
        {errors ? <Badge tone="red">{errors} with errors</Badge> : null}
        <span className="flex-1" />
        <Button variant="ghost" size="sm" onClick={replace} disabled={busy}>
          <FileUp /> Choose another file
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {parsed?.error ? (
          <p className="px-6 py-16 text-center text-[13px] text-danger">{parsed.error}</p>
        ) : (
          <table className="w-full min-w-[880px] border-collapse text-left">
            <thead>
              <tr>
                {["Row", "When", "Channels", "Text", "Media", ""].map((h) => (
                  <Th key={h}>{h}</Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <CsvRow key={r.line} row={r} byId={byId} result={results[r.line]} />
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Footer
        note={progress || (zone ? `Times in ${zone.replace(/_/g, " ")}` : "")}
        busy={busy}
        ready={todo.length}
        scheduleCount={schedulable.length}
        onDrafts={() => void run("draft")}
        onSchedule={() => void run("schedule")}
      />
    </>
  );
}

function CsvRow({ row, byId, result }: { row: BulkRow; byId: Map<string, Channel>; result: Result | undefined }) {
  return (
    <tr className="border-b border-line-light align-top text-[13px]">
      <td className="px-3 py-2 text-faint tabular-nums">{row.line}</td>
      <td className="px-3 py-2 whitespace-nowrap tabular-nums">{row.at ? fmtDateTime(row.at) : "—"}</td>
      <td className="px-3 py-2">
        <span className="flex flex-wrap gap-1">
          {row.channelIds.map((id) => byId.get(id)).filter((c): c is Channel => !!c).map((c) => (
            <span key={c.id} title={c.name} className="flex">
              <NetworkLogo id={c.network} size={16} />
            </span>
          ))}
        </span>
      </td>
      <td className="max-w-[420px] px-3 py-2">
        <p className="line-clamp-2 whitespace-pre-line">{row.text || <span className="text-faint">No text</span>}</p>
        {row.firstComment ? <p className="mt-0.5 line-clamp-1 text-[12px] text-muted">First comment: {row.firstComment}</p> : null}
      </td>
      <td className="max-w-[160px] truncate px-3 py-2 text-[12px] text-muted" title={row.mediaUrl ?? undefined}>
        {row.mediaUrl ? row.mediaUrl.replace(/^https?:\/\//, "") : ""}
      </td>
      <td className="w-[260px] px-3 py-2">
        {result ? (
          <ResultTag r={result} />
        ) : row.errors.length ? (
          <span className="text-[12px] text-danger" title={row.errors.join("\n")}>
            {row.errors[0]}
            {row.errors.length > 1 ? ` and ${row.errors.length - 1} more` : ""}
          </span>
        ) : row.holds.length ? (
          <span title={row.holds.join("\n")}>
            <Badge tone="amber">Draft only</Badge>
          </span>
        ) : (
          <Badge tone="green">Ready</Badge>
        )}
      </td>
    </tr>
  );
}

// Pictures and videos

type Item = { key: string; name: string; mime: string; preview: string; mediaId?: string; uploadError?: string; text: string; result?: Result };

function MediaTab({ channels, busy, setBusy, onSaved }: { channels: Channel[] } & Work) {
  const [items, setItems] = useState<Item[]>([]);
  const [picked, setPicked] = useState<string[]>(() => (channels.length === 1 ? [channels[0].id] : []));
  const [how, setHow] = useState<"queue" | "daily">("queue");
  const [time, setTime] = useState("09:00");
  const [times, setTimes] = useState<string[]>([]);
  const [timesError, setTimesError] = useState("");
  const [notes, setNotes] = useState("");
  const [progress, setProgress] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const previews = useRef<string[]>([]);
  useEffect(() => () => previews.current.forEach((u) => URL.revokeObjectURL(u)), []);

  const waiting = items.filter((i) => !i.result?.status && !i.uploadError);
  const ready = waiting.filter((i) => i.mediaId);
  const uploading = waiting.some((i) => !i.mediaId);
  // Times follow the files still to save, in order: the queue's next free slots, or one a day.
  const count = waiting.length;
  useEffect(() => {
    if (!count) return;
    let live = true;
    bulkTimes(count, how, time).then((r) => {
      if (!live) return;
      setTimes(r.times ?? []);
      setTimesError(r.error ?? "");
    });
    return () => {
      live = false;
    };
  }, [count, how, time]);
  const timeOf = (key: string) => times[waiting.findIndex((w) => w.key === key)] ?? null;

  const patch = (key: string, p: Partial<Item>) => setItems((all) => all.map((x) => (x.key === key ? { ...x, ...p } : x)));
  const add = async (list: FileList | File[]) => {
    const files = Array.from(list).filter((f) => ACCEPT.split(",").includes(f.type));
    if (!files.length) return tell("Use JPG, PNG, GIF, WebP, MP4 or MOV");
    const room = 100 - items.length;
    if (files.length > room) await tell("Up to 100 files at a time");
    const fresh = files.slice(0, Math.max(0, room)).map((f, i) => {
      const preview = URL.createObjectURL(f);
      previews.current.push(preview);
      return { file: f, item: { key: `${Date.now()}-${i}-${f.name}`, name: f.name, mime: f.type, preview, text: "" } as Item };
    });
    setItems((all) => [...all, ...fresh.map((x) => x.item)]);
    // Straight to storage with a one-time link, one after another (as in the composer).
    const storage = import("@/lib/supabase/browser");
    for (const { file: f, item } of fresh) {
      const info = { name: f.name, type: f.type, size: f.size };
      const s = await startUpload(info);
      if (s.error || !s.path || !s.token) {
        patch(item.key, { uploadError: s.error ?? "Couldn't start the upload" });
        continue;
      }
      const { error } = await (await storage).browserClient().storage.from("media").uploadToSignedUrl(s.path, s.token, f, { contentType: f.type });
      if (error) {
        patch(item.key, { uploadError: error.message });
        continue;
      }
      const done = await endUpload({ ...info, path: s.path });
      if (done.error || !done.id) patch(item.key, { uploadError: done.error ?? "Upload didn't finish" });
      else patch(item.key, { mediaId: done.id });
    }
  };
  const network = channels.find((c) => picked.includes(c.id))?.network ?? null;
  const captions = async () => {
    const todo = ready.filter((i) => !i.text.trim());
    if (!todo.length) return;
    setBusy(true);
    try {
      for (const [n, it] of todo.entries()) {
        setProgress(`Writing ${n + 1} of ${todo.length}`);
        const r = await bulkCaption(it.mediaId!, notes, network);
        if (r.error) {
          if (!(await creditGate(r.error))) await tell("Couldn't write captions", r.error);
          break;
        }
        patch(it.key, { text: r.text ?? "" });
      }
    } finally {
      setBusy(false);
      setProgress("");
    }
  };
  const run = async (mode: "draft" | "schedule") => {
    if (!ready.length) return;
    if (!picked.length) return tell("Pick at least one channel");
    if (uploading) return tell("Wait for the uploads to finish");
    if (ready.some((i) => !timeOf(i.key))) return tell("Couldn't place every file", timesError || undefined);
    if (mode === "schedule") {
      const check = await bulkCheck(ready.length);
      if (check.error) return tell("Can't schedule these posts", check.error);
    }
    setBusy(true);
    let done = 0;
    const plan = ready.map((i) => ({ key: i.key, mediaId: i.mediaId!, text: i.text, at: timeOf(i.key)! }));
    try {
      for (let i = 0; i < plan.length; i += CHUNK) {
        setProgress(`Saving ${Math.min(i + CHUNK, plan.length)} of ${plan.length}`);
        const r = await bulkMedia(plan.slice(i, i + CHUNK), picked, mode);
        if (r.error) {
          await tell("Couldn't save the posts", r.error);
          break;
        }
        for (const x of r.results ?? []) {
          patch(x.key, { result: { status: x.status, error: x.error } });
          if (x.status) done++;
        }
      }
    } finally {
      setBusy(false);
      setProgress("");
      if (done) onSaved();
    }
  };

  const picker = <input ref={input} type="file" multiple accept={ACCEPT} className="hidden" onChange={(e) => (e.target.files && void add(e.target.files), (e.target.value = ""))} />;
  const drop = { onDragOver: (e: React.DragEvent) => e.preventDefault(), onDrop: (e: React.DragEvent) => (e.preventDefault(), void add(e.dataTransfer.files)) };
  if (!items.length)
    return (
      <div className="min-h-0 flex-1 overflow-y-auto" {...drop}>
        {picker}
        <ToolIntro
          drawing="files"
          title="Drop pictures and videos"
          lead="Each file becomes its own post, spread over your queue or one a day."
          action={
            <Button onClick={() => input.current?.click()}>
              <ImagePlus /> Choose files
            </Button>
          }
        />
      </div>
    );
  return (
    <>
      {picker}
      <div className="grid min-h-0 flex-1 lg:grid-cols-[320px_minmax(0,1fr)]" {...drop}>
        <aside className="flex flex-col gap-5 overflow-y-auto border-b border-line bg-paper p-5 lg:border-r lg:border-b-0">
          <Field label="Channels">
            <MultiSelect<string> ariaLabel="Channels" noun={["channel", "channels"]} placeholder="Pick channels" values={picked} onChange={setPicked} options={channels.map((c) => ({ value: c.id, label: c.name, icon: <NetworkLogo id={c.network} size={14} /> }))} />
          </Field>
          <Field label="When">
            <div className="flex flex-wrap items-center gap-2">
              <Segmented<"queue" | "daily">
                label="When"
                size="sm"
                value={how}
                onChange={setHow}
                options={[
                  { value: "queue", label: "Queue" },
                  { value: "daily", label: "One a day" },
                ]}
              />
              {how === "daily" ? <input type="time" aria-label="Time" value={time} onChange={(e) => setTime(e.target.value)} className={`${inputLook} w-28`} /> : null}
            </div>
            {timesError ? <p className="text-[12px] text-danger">{timesError}</p> : null}
          </Field>
          <Field label="Captions">
            <div className="flex flex-col gap-2">
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes for Claude" maxLength={1000} />
              <Button variant="ghost" onClick={() => void captions()} disabled={busy || !ready.some((i) => !i.text.trim())}>
                <Sparkles /> Write captions
              </Button>
            </div>
          </Field>
          <Button variant="ghost" onClick={() => input.current?.click()} disabled={busy || items.length >= 100}>
            <ImagePlus /> Add files
          </Button>
        </aside>
        <div className="min-h-0 overflow-y-auto">
          {items.map((it) => {
            const at = it.result ? null : timeOf(it.key);
            return (
              <div key={it.key} className="flex gap-3 border-b border-line px-5 py-3">
                <span className="size-16 shrink-0 overflow-hidden rounded-lg bg-paper shadow-chip">
                  {it.mime.startsWith("video/") ? (
                    <video src={it.preview} muted preload="metadata" className="size-full object-cover" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.preview} alt="" className="size-full object-cover" />
                  )}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-[12px]">
                    <span className="min-w-0 truncate font-medium">{it.name}</span>
                    {!it.mediaId && !it.uploadError ? <Loader /> : null}
                    <span className="flex-1" />
                    {at ? <span className="text-muted tabular-nums">{fmtDateTime(at)}</span> : null}
                    {it.uploadError ? <span className="text-danger">{it.uploadError}</span> : <ResultTag r={it.result} />}
                  </div>
                  <TextArea rows={2} value={it.text} placeholder="Caption" readOnly={!!it.result?.status} onChange={(e) => patch(it.key, { text: e.target.value })} />
                </div>
                <IconButton label="Remove" onClick={() => setItems((all) => all.filter((x) => x.key !== it.key))} disabled={busy || !!it.result?.status} align="end">
                  <X size={16} />
                </IconButton>
              </div>
            );
          })}
        </div>
      </div>
      <Footer note={progress} busy={busy || uploading} ready={ready.length} scheduleCount={ready.length} onDrafts={() => void run("draft")} onSchedule={() => void run("schedule")} />
    </>
  );
}
