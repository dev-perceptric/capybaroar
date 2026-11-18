"use client";

import { useState } from "react";
import { FileText, Play } from "lucide-react";

type ThumbMedia = { name: string; mime: string; thumb: string | null; tile?: string | null; alt?: string | null };

/**
 * A video in a tile. Nothing downloads until it plays (`preload="none"`), so a grid of videos costs nothing; the play
 * mark stands in for the first frame. With `controls` it plays in place.
 */
export function VideoTile({ src, controls = false, small = false }: { src: string | null; controls?: boolean; small?: boolean }) {
  const [played, setPlayed] = useState(false);
  return (
    <>
      <video src={src ?? undefined} className="size-full object-cover" muted controls={controls} preload="none" onPlay={() => setPlayed(true)} />
      {played ? null : (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className={`flex items-center justify-center rounded-full bg-panel text-ink shadow-chip ${small ? "size-7" : "size-9"}`}>
            <Play size={small ? 12 : 14} fill="currentColor" aria-hidden="true" className="translate-x-px" />
          </span>
        </span>
      )}
    </>
  );
}

/** A file as a square tile: a picture's thumbnail, a video's play mark, or a PDF's name. */
export function Thumb({ m, small = false }: { m: ThumbMedia; small?: boolean }) {
  return (
    <span className={`relative block shrink-0 overflow-hidden rounded-lg bg-paper shadow-chip ${small ? "size-20" : "size-28"}`} title={m.name}>
      {m.mime === "application/pdf" ? (
        <span className="flex size-full flex-col items-center justify-center gap-1.5 p-2 text-center">
          <FileText size={small ? 18 : 22} className="text-muted" />
          <span className="line-clamp-2 text-[10.5px] break-all text-body">{m.name}</span>
        </span>
      ) : m.mime.startsWith("video/") ? (
        <VideoTile src={m.thumb} small={small} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={m.tile ?? m.thumb ?? ""} alt={m.alt ?? ""} loading="lazy" decoding="async" className="size-full object-cover" />
      )}
    </span>
  );
}
