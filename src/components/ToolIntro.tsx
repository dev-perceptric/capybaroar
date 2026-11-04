"use client";

import { Drawing, type DrawingKind } from "./Drawing";

// The first screen of a tool, before there's anything to show. Like Claritia's (and Twenty's): the page stays blank,
// with one drawing in the middle, a short title, one line under it and the button that makes the first one. A line
// break in the title turns the rest gray. The one place in the app that explains; working screens hold labels,
// buttons and real errors only.

export function ToolIntro({ drawing, title, lead, action, compact = false }: { drawing: DrawingKind; title: string; lead?: string; action?: React.ReactNode; compact?: boolean }) {
  const [first, rest = ""] = title.split("\n");
  return (
    <section className={`rise flex flex-col items-center justify-center px-6 text-center ${compact ? "py-12" : "min-h-[calc(100dvh-200px)] py-12"}`}>
      <Drawing kind={drawing} size={compact ? 180 : 240} />
      <h2 className="mt-6 max-w-md text-[22px] leading-[1.15] font-medium tracking-[-0.025em] text-balance">
        {first}
        {rest ? <span className="text-faint"> {rest}</span> : null}
      </h2>
      {lead ? <p className="mt-2 max-w-md text-[13px] leading-relaxed text-balance text-muted">{lead}</p> : null}
      {action ? <div className="mt-6 flex flex-wrap items-center justify-center gap-2">{action}</div> : null}
    </section>
  );
}
