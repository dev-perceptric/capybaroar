"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Button, Field, Segmented, TextArea } from "./ui";
import { Select } from "./Select";
import { Loader } from "./Loader";
import { ASPECTS, MAX_PROMPT, SECONDS, defaultModel, modelsFor, type Aspect, type GenKind } from "@/lib/genRules";
import { generate, generationsStatus } from "@/app/(app)/media/actions";

// Making AI pictures and videos (fal.ai): the form, and the tiles that wait for the file. The rules live in genRules.ts.

export type Picture = { id: string; name: string; mime: string };
export type Pending = { id: string; kind: GenKind; error?: string };

const KINDS: { value: GenKind; label: string }[] = [
  { value: "image", label: "Picture" },
  { value: "video", label: "Video" },
];

/** The form. `pictures`: library pictures a video may start from. `onStarted` gets the new request. */
export function GenerateForm({ pictures, onStarted, primary = false }: { pictures: Picture[]; onStarted: (p: Pending) => void; primary?: boolean }) {
  const [kind, setKind] = useState<GenKind>("image");
  const [model, setModel] = useState(defaultModel("image").id);
  const [prompt, setPrompt] = useState("");
  const [aspect, setAspect] = useState<Aspect>("1:1");
  const [seconds, setSeconds] = useState<string>("5");
  const [source, setSource] = useState("");
  const [error, setError] = useState("");
  const [busy, start] = useTransition();
  const starts = pictures.filter((p) => /^image\/(jpeg|png|webp)$/.test(p.mime));
  const pick = (k: GenKind) => {
    setKind(k);
    setModel(defaultModel(k).id);
    setError("");
  };
  const send = () =>
    start(async () => {
      setError("");
      const r = await generate({ kind, model, prompt, aspect, seconds: kind === "video" ? Number(seconds) : undefined, source_media_id: kind === "video" && source ? source : undefined });
      if (r.error || !r.id) {
        setError(r.error ?? "Couldn't start it. Try again.");
        return;
      }
      setPrompt("");
      onStarted({ id: r.id, kind });
    });
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented value={kind} options={KINDS} onChange={pick} label="Make" size="sm" />
        <Select value={model} onChange={setModel} options={modelsFor(kind).map((m) => ({ value: m.id, label: m.name }))} ariaLabel="Model" size="sm" />
      </div>
      <TextArea value={prompt} onChange={(e) => setPrompt(e.target.value)} maxLength={MAX_PROMPT} rows={3} placeholder={kind === "image" ? "A capybara reading on a beach at sunset" : "Slow push-in on a capybara reading on a beach at sunset"} aria-label="Describe it" />
      <div className="flex flex-wrap items-end gap-4">
        {kind === "video" && starts.length ? (
          <Field label="Start from">
            <Select value={source} onChange={setSource} options={[{ value: "", label: "Nothing" }, ...starts.map((p) => ({ value: p.id, label: p.name }))]} ariaLabel="Start from" size="sm" />
          </Field>
        ) : null}
        {kind === "image" || !source ? (
          <Field label="Shape">
            <Segmented value={aspect} options={ASPECTS.map((a) => ({ value: a, label: a }))} onChange={setAspect} label="Shape" size="sm" />
          </Field>
        ) : null}
        {kind === "video" ? (
          <Field label="Length">
            <Segmented value={seconds} options={SECONDS.map((s) => ({ value: String(s), label: `${s}s` }))} onChange={setSeconds} label="Length" size="sm" />
          </Field>
        ) : null}
        <Button variant={primary ? "primary" : "ghost"} size="sm" className="ml-auto" disabled={busy || !prompt.trim()} onClick={send}>
          {busy ? <Loader /> : null}
          Generate
        </Button>
      </div>
      {error ? <p className="text-[12px] text-danger">{error}</p> : null}
    </div>
  );
}

/** Requests being made: looks every 4 seconds and hands each finished file's media id to `onDone`. */
export function useGenerations(onDone: (mediaId: string) => void | Promise<void>) {
  const [pending, setPending] = useState<Pending[]>([]);
  const done = useRef(onDone);
  const handed = useRef(new Set<string>());
  useEffect(() => {
    done.current = onDone;
  });
  const waiting = pending.filter((p) => !p.error).map((p) => p.id);
  const key = waiting.join(",");
  useEffect(() => {
    if (!key) return;
    const ids = key.split(",");
    let stop = false;
    const look = async () => {
      let rows;
      try {
        rows = await generationsStatus(ids);
      } catch {
        return; // a hiccup: look again next time
      }
      if (stop) return;
      for (const g of rows) {
        if (g.status === "done" && g.media_id) {
          if (handed.current.has(g.id)) continue;
          handed.current.add(g.id);
          await done.current(g.media_id);
          setPending((all) => all.filter((p) => p.id !== g.id));
        } else if (g.status === "failed") setPending((all) => all.map((p) => (p.id === g.id ? { ...p, error: g.error ?? "Couldn't make it. Try again." } : p)));
      }
    };
    const t = setInterval(look, 4000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [key]);
  return {
    pending,
    busy: waiting.length > 0,
    add: (p: Pending) => setPending((all) => [...all, p]),
    dismiss: (id: string) => setPending((all) => all.filter((p) => p.id !== id)),
  };
}

/** A tile for a file still being made, or the reason it failed. */
export function PendingTile({ p, onDismiss, className = "size-28" }: { p: Pending; onDismiss: () => void; className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 rounded-lg p-2 text-center text-[11px] ${className} ${p.error ? "bg-danger-soft text-danger" : "border border-dashed border-line-strong text-muted"}`}>
      {p.error ? (
        <>
          <span className="wrap-break-word">{p.error}</span>
          <Button variant="plain" size="sm" onClick={onDismiss}>
            Dismiss
          </Button>
        </>
      ) : (
        <>
          <Loader />
          <span>{p.kind === "image" ? "Picture" : "Video"}</span>
        </>
      )}
    </div>
  );
}
