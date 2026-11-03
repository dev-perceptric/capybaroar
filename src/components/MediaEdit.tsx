"use client";

import { useEffect, useRef, useState } from "react";
import { Modal } from "./Overlay";
import { Button } from "./ui";
import { Loader } from "./Loader";
import { trim } from "@/app/(app)/calendar/actions";

type Media = { id: string; name: string; mime: string; thumb: string | null };

const RATIOS: { label: string; value: number | null }[] = [
  { label: "Original", value: null },
  { label: "1:1", value: 1 },
  { label: "4:5", value: 4 / 5 },
  { label: "9:16", value: 9 / 16 },
  { label: "16:9", value: 16 / 9 },
  { label: "1.91:1", value: 1.91 },
];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const time = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}.${Math.floor((s % 1) * 10)}`;

/** Crop a picture to a network's shape, or trim a video. Both save a new file and leave the original in the library. */
export function MediaEdit({ m, onClose, onCropped, onTrimmed }: { m: Media; onClose: () => void; onCropped: (f: File) => Promise<void>; onTrimmed: (id: string) => void }) {
  return m.mime.startsWith("video/") ? <Trim m={m} onClose={onClose} onDone={onTrimmed} /> : <Crop m={m} onClose={onClose} onDone={onCropped} />;
}

function Crop({ m, onClose, onDone }: { m: Media; onClose: () => void; onDone: (f: File) => Promise<void> }) {
  const img = useRef<HTMLImageElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [ratio, setRatio] = useState<number | null>(1);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0.5, y: 0.5 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  // The crop box in the picture's own pixels.
  const box = (() => {
    if (!size) return null;
    const r = ratio ?? size.w / size.h;
    let w = size.w;
    let h = w / r;
    if (h > size.h) {
      h = size.h;
      w = h * r;
    }
    w /= zoom;
    h /= zoom;
    return { x: (size.w - w) * pos.x, y: (size.h - h) * pos.y, w, h };
  })();

  const save = async () => {
    if (!box || !img.current) return;
    setBusy(true);
    setError("");
    try {
      const c = document.createElement("canvas");
      c.width = Math.round(box.w);
      c.height = Math.round(box.h);
      c.getContext("2d")!.drawImage(img.current, box.x, box.y, box.w, box.h, 0, 0, c.width, c.height);
      const type = m.mime === "image/png" ? "image/png" : "image/jpeg";
      const blob = await new Promise<Blob | null>((res) => c.toBlob(res, type, 0.92));
      if (!blob) throw new Error("Couldn't make the picture");
      const base = m.name.replace(/\.[^.]+$/, "");
      await onDone(new File([blob], `${base}-crop.${type === "image/png" ? "png" : "jpg"}`, { type }));
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't crop");
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Crop"
      onClose={onClose}
      wide
      footer={
        <>
          {error ? <span className="mr-auto text-[12px] text-danger">{error}</span> : null}
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={busy || !box}>
            {busy ? <Loader /> : null}
            Save copy
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-1">
          {RATIOS.map((r) => (
            <button
              key={r.label}
              type="button"
              aria-pressed={ratio === r.value}
              onClick={() => (setRatio(r.value), setPos({ x: 0.5, y: 0.5 }))}
              className={`h-8 rounded-md border px-2.5 text-[12px] font-medium ${ratio === r.value ? "border-transparent bg-signal-soft shadow-[0_0_0_1px_var(--signal-10)]" : "border-transparent bg-panel shadow-chip hover:bg-canvas"}`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex justify-center bg-canvas p-3">
          <div
            className="relative touch-none select-none"
            onPointerDown={(e) => {
              (e.target as HTMLElement).setPointerCapture(e.pointerId);
              drag.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y };
            }}
            onPointerMove={(e) => {
              const d = drag.current;
              const el = img.current;
              if (!d || !el || !box || !size) return;
              const scale = el.clientWidth / size.w;
              const freeW = (size.w - box.w) * scale;
              const freeH = (size.h - box.h) * scale;
              setPos({ x: freeW ? clamp(d.px + (e.clientX - d.x) / freeW, 0, 1) : 0.5, y: freeH ? clamp(d.py + (e.clientY - d.y) / freeH, 0, 1) : 0.5 });
            }}
            onPointerUp={() => (drag.current = null)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img ref={img} src={m.thumb ?? ""} crossOrigin="anonymous" alt="" draggable={false} onLoad={(e) => setSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })} className="block max-h-[56vh] max-w-full" />
            {box && size ? (
              <div
                className="absolute cursor-move border-2 border-signal shadow-[0_0_0_1px_rgba(0,0,0,.5)]"
                style={{ left: `${(box.x / size.w) * 100}%`, top: `${(box.y / size.h) * 100}%`, width: `${(box.w / size.w) * 100}%`, height: `${(box.h / size.h) * 100}%`, boxShadow: "0 0 0 9999px rgb(0 0 0 / 0.5)" }}
              />
            ) : null}
          </div>
        </div>
        <label className="flex items-center gap-3 text-[12px] text-muted">
          Zoom
          <input type="range" min={1} max={4} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="flex-1 accent-[var(--color-ink)]" />
          {box ? (
            <span className="w-24 text-right tabular-nums">
              {Math.round(box.w)} × {Math.round(box.h)}
            </span>
          ) : null}
        </label>
      </div>
    </Modal>
  );
}

function Trim({ m, onClose, onDone }: { m: Media; onClose: () => void; onDone: (id: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [len, setLen] = useState(0);
  const [range, setRange] = useState<[number, number]>([0, 0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Loop the picked part while it plays.
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const tick = () => {
      if (v.currentTime >= range[1] || v.currentTime < range[0] - 0.2) v.currentTime = range[0];
    };
    v.addEventListener("timeupdate", tick);
    return () => v.removeEventListener("timeupdate", tick);
  }, [range]);

  const set = (i: 0 | 1, v: number) => {
    const next: [number, number] = i === 0 ? [Math.min(v, range[1] - 0.5), range[1]] : [range[0], Math.max(v, range[0] + 0.5)];
    setRange(next);
    if (video.current) video.current.currentTime = next[i];
  };

  const save = async () => {
    setBusy(true);
    setError("");
    const r = await trim(m.id, range[0], range[1]);
    if (r.error || !r.id) {
      setError(r.error ?? "Couldn't trim");
      setBusy(false);
      return;
    }
    onDone(r.id);
    onClose();
  };

  return (
    <Modal
      title="Trim"
      onClose={onClose}
      wide
      footer={
        <>
          {error ? <span className="mr-auto text-[12px] text-danger">{error}</span> : null}
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={busy || !len}>
            {busy ? <Loader /> : null}
            Save copy
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex justify-center bg-ink">
          <video
            ref={video}
            src={m.thumb ?? undefined}
            controls
            playsInline
            className="max-h-[52vh] max-w-full"
            onLoadedMetadata={(e) => {
              const d = e.currentTarget.duration || 0;
              setLen(d);
              setRange([0, d]);
            }}
          />
        </div>
        {len ? (
          <div className="flex flex-col gap-2 text-[12px]">
            <div className="relative h-2 bg-line">
              <div className="absolute inset-y-0 rounded-xs bg-signal/80 shadow-[0_0_0_1px_var(--signal-10)]" style={{ left: `${(range[0] / len) * 100}%`, width: `${((range[1] - range[0]) / len) * 100}%` }} />
            </div>
            <label className="flex items-center gap-3 text-muted">
              <span className="w-10">Start</span>
              <input type="range" min={0} max={len} step={0.1} value={range[0]} onChange={(e) => set(0, Number(e.target.value))} className="flex-1 accent-[var(--color-ink)]" />
              <span className="w-14 text-right text-ink tabular-nums">{time(range[0])}</span>
            </label>
            <label className="flex items-center gap-3 text-muted">
              <span className="w-10">End</span>
              <input type="range" min={0} max={len} step={0.1} value={range[1]} onChange={(e) => set(1, Number(e.target.value))} className="flex-1 accent-[var(--color-ink)]" />
              <span className="w-14 text-right text-ink tabular-nums">{time(range[1])}</span>
            </label>
            <span className="text-muted tabular-nums">Length {time(range[1] - range[0])}</span>
          </div>
        ) : (
          <Loader />
        )}
      </div>
    </Modal>
  );
}
