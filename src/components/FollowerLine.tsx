"use client";

import { useState } from "react";

// One series, so one ink line with no legend (the card title names it). Hover shows the day and value.
export function FollowerLine({ points, label }: { points: { day: string; value: number }[]; label: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 480;
  const H = 96;
  const pad = 4;
  const vals = points.map((p) => p.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const x = (i: number) => pad + (i * (W - pad * 2)) / Math.max(points.length - 1, 1);
  const y = (v: number) => H - pad - ((v - min) / span) * (H - pad * 2);
  const d = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const h = hover != null ? points[hover] : null;
  return (
    <figure className="relative mt-2">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-24 w-full"
        role="img"
        aria-label={`${label}: ${points[0].value} to ${points.at(-1)!.value}`}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const i = Math.round(((e.clientX - r.left) / r.width) * (points.length - 1));
          setHover(Math.max(0, Math.min(points.length - 1, i)));
        }}
      >
        <line x1={pad} x2={W - pad} y1={H - pad} y2={H - pad} stroke="var(--border-light)" strokeWidth="1" />
        <path d={d} fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        {h ? (
          <>
            <line x1={x(hover!)} x2={x(hover!)} y1={pad} y2={H - pad} stroke="var(--border-strong)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <circle cx={x(hover!)} cy={y(h.value)} r="4" fill="var(--yolk-9)" stroke="var(--text-primary)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </>
        ) : null}
      </svg>
      {h ? (
        <figcaption className="pointer-events-none absolute top-0 right-0 border border-frame bg-panel px-2 py-1 text-[11px] tabular-nums">
          {new Date(`${h.day}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}: {h.value.toLocaleString("en-US")}
        </figcaption>
      ) : null}
    </figure>
  );
}
