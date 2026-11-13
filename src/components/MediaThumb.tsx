"use client";

import { FileText } from "lucide-react";

type ThumbMedia = { name: string; mime: string; thumb: string | null; alt?: string | null };

/** A file as a square tile: a picture, the first frame of a video, or a PDF's name. */
export function Thumb({ m, small = false }: { m: ThumbMedia; small?: boolean }) {
  return (
    <span className={`relative block shrink-0 overflow-hidden rounded-lg bg-paper shadow-chip ${small ? "size-20" : "size-28"}`} title={m.name}>
      {m.mime === "application/pdf" ? (
        <span className="flex size-full flex-col items-center justify-center gap-1.5 p-2 text-center">
          <FileText size={small ? 18 : 22} className="text-muted" />
          <span className="line-clamp-2 text-[10.5px] break-all text-body">{m.name}</span>
        </span>
      ) : m.mime.startsWith("video/") ? (
        <video src={m.thumb ?? undefined} className="size-full object-cover" muted preload="metadata" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={m.thumb ?? ""} alt={m.alt ?? ""} loading="lazy" decoding="async" className="size-full object-cover" />
      )}
    </span>
  );
}
