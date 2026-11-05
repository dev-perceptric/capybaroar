"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Button, Chip, Field, Segmented, TextArea } from "./ui";
import { Select } from "./Select";
import { Loader } from "./Loader";
import { ASPECTS, CAPY, KINDS, MAX_PROMPT, MAX_SCRIPT, SECONDS, capyPick, modelOf, modelsFor, type Aspect, type GenKind, type Seconds } from "@/lib/genRules";
import { aiCredits, generate, generationsStatus } from "@/app/(app)/media/actions";

// Making AI pictures, videos and audio (fal.ai): people pick CapyImage, CapyVideo or CapyAudio and Capy picks the
// model, or they pick one under Other models. The rules live in genRules.ts.

export type Picture = { id: string; name: string; mime: string };
export type Pending = { id: string; kind: GenKind; error?: string };

const KIND_OPTIONS = KINDS.map((k) => ({ value: k, label: CAPY[k].name }));
const PLACEHOLDER: Record<GenKind, string> = {
  image: 'A poster that says "Grand opening Saturday" on a sunny coffee shop window',
  video: "A capybara surfing at sunset, slow push-in",
  audio: "Upbeat background music for a 15-second product reel",
};

/** The form. `pictures`: library pictures to edit or to start a video from. `onStarted` gets the new request. */
export function GenerateForm({ pictures, onStarted, primary = false }: { pictures: Picture[]; onStarted: (p: Pending) => void; primary?: boolean }) {
  const [kind, setKind] = useState<GenKind>("image");
  const [prompt, setPrompt] = useState("");
  const [aspect, setAspect] = useState<Aspect>("1:1");
  const [seconds, setSeconds] = useState<string>("5");
  const [source, setSource] = useState("");
  const [chosen, setChosen] = useState<string | null>(null);
  const [others, setOthers] = useState(false);
  const [left, setLeft] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [busy, start] = useTransition();
  const starts = pictures.filter((p) => /^image\/(jpeg|png|webp)$/.test(p.mime));
  const picture = kind !== "audio" && !!source;
  const secs = Number(seconds) as Seconds;
  const auto = capyPick(kind, prompt, picture);
  const pick = chosen ? modelOf(chosen) : null;
  const model = pick && pick.kind === kind && !(pick.picture === "needs" && !picture) && !(!pick.picture && picture) ? pick : auto.model;
  const credits = model.credits({ prompt, seconds: secs });
  const timed = kind === "video" || model.id === "elevenlabs-sfx";
  useEffect(() => {
    aiCredits().then((c) => setLeft(c.left), () => setLeft(null));
  }, []);
  const pickKind = (k: GenKind) => {
    setKind(k);
    setChosen(null);
    setError("");
  };
  const send = () =>
    start(async () => {
      setError("");
      const r = await generate({ kind, model: model === auto.model && !chosen ? undefined : model.id, prompt, aspect, seconds: kind === "image" ? undefined : secs, source_media_id: picture ? source : undefined });
      if (r.error || !r.id) {
        setError(r.error ?? "Couldn't start it. Try again.");
        return;
      }
      setPrompt("");
      if (left != null) setLeft(Math.max(0, left - credits));
      onStarted({ id: r.id, kind });
    });
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={kind} onChange={pickKind} options={KIND_OPTIONS} ariaLabel="What to make" size="sm" className="w-auto" />
        {left != null ? <span className="ml-auto text-[12px] text-muted tabular-nums">{left.toLocaleString("en-US")} credits left</span> : null}
      </div>
      <TextArea value={prompt} onChange={(e) => setPrompt(e.target.value)} maxLength={kind === "audio" ? MAX_SCRIPT : MAX_PROMPT} rows={3} placeholder={PLACEHOLDER[kind]} aria-label="Describe it" />
      <div className="flex flex-wrap items-end gap-4">
        {kind !== "audio" && starts.length ? (
          <Field label={kind === "image" ? "Edit a picture" : "Start from"}>
            <Select value={source} onChange={setSource} options={[{ value: "", label: "Nothing" }, ...starts.map((p) => ({ value: p.id, label: p.name }))]} ariaLabel={kind === "image" ? "Edit a picture" : "Start from"} size="sm" className="w-auto" />
          </Field>
        ) : null}
        {kind !== "audio" && !(kind === "video" && picture) ? (
          <Field label="Shape">
            <Segmented value={aspect} options={ASPECTS.map((a) => ({ value: a, label: a }))} onChange={setAspect} label="Shape" size="sm" />
          </Field>
        ) : null}
        {timed ? (
          <Field label="Length">
            <Segmented value={seconds} options={SECONDS.map((s) => ({ value: String(s), label: `${s}s` }))} onChange={setSeconds} label="Length" size="sm" />
          </Field>
        ) : null}
        <Button variant={primary ? "primary" : "ghost"} size="sm" className="ml-auto" disabled={busy || !prompt.trim() || (left != null && credits > left)} onClick={send}>
          {busy ? <Loader /> : null}
          Generate
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 border-t border-line pt-2.5 text-[12px] text-muted">
        <span>
          Uses <span className="font-medium text-ink">{model.name}</span>, <span className="tabular-nums">{credits}</span> credits
        </span>
        {model === auto.model && !chosen ? <span className="text-faint">because {auto.why}</span> : null}
        <button type="button" onClick={() => setOthers(!others)} className="text-ink underline underline-offset-2">
          {others ? "Hide" : "Other models"}
        </button>
      </div>
      {others ? (
        <div className="flex flex-wrap gap-1.5">
          <Chip size="sm" on={!chosen} onClick={() => setChosen(null)}>
            Let Capy pick
          </Chip>
          {modelsFor(kind)
            .filter((m) => (picture ? !!m.picture : m.picture !== "needs"))
            .map((m) => (
              <Chip key={m.id} size="sm" on={chosen === m.id} onClick={() => setChosen(m.id)}>
                {m.name} <span className="text-muted tabular-nums">{m.credits({ prompt, seconds: secs })}</span>
              </Chip>
            ))}
        </div>
      ) : null}
      {error ? <p className="text-[12px] text-danger">{error}</p> : null}
    </div>
  );
}

/** Requests being made: looks every 4 seconds and hands each finished file's media id and kind to `onDone`. */
export function useGenerations(onDone: (mediaId: string, kind: GenKind) => void | Promise<void>) {
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
          await done.current(g.media_id, g.kind as GenKind);
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
          <span>{p.kind === "image" ? "Picture" : p.kind === "video" ? "Video" : "Audio"}</span>
        </>
      )}
    </div>
  );
}
