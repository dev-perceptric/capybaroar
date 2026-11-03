"use client";

import { Download } from "lucide-react";
import { Button, Empty } from "./ui";
import { Bars, ChannelTable, Followers, Formats, Heatmap, Section, Tiles, TopPosts } from "./Charts";
import type { ReportView as Report } from "@/lib/reports";
import type { SectionKey } from "@/lib/reportTimes";

/** A report opened from its link: the brand, the period and the picked sections, ready to print to A4. */
export function ReportView({ report: r }: { report: Report }) {
  const d = r.data;
  const accent = r.white?.accent ?? null;
  const blocks: { key: SectionKey; title: string; note?: string; body: React.ReactNode }[] = [];
  const add = (key: SectionKey, title: string, body: () => React.ReactNode, note?: string) => {
    if (r.sections.includes(key)) blocks.push({ key, title, note, body: key === "notes" || d ? body() : <Empty compact drawing="dashboards" title="No channels yet" /> });
  };
  add("summary", "Summary", () => (
    <>
      <Tiles data={d!} />
      <div className="mt-3">
        <Bars daily={d!.daily} />
      </div>
    </>
  ));
  add("growth", "Followers", () => <Followers data={d!} channels={r.channels} />);
  add("top", "Top posts", () => <TopPosts top={d!.top} channels={r.channels} timezone={r.timezone} />);
  add("best", "Best time to post", () => <Heatmap cells={d!.best} />, r.timezone.replace(/_/g, " "));
  add("formats", "By format", () => <Formats formats={d!.formats} />);
  add("channels", "By channel", () => <ChannelTable data={d!} channels={r.channels} />);
  if (r.notes) add("notes", "Notes", () => <p className="rounded-lg border border-frame p-4 text-[13px] leading-relaxed whitespace-pre-line">{r.notes}</p>);

  return (
    <div className="min-h-dvh bg-shell print:bg-panel">
      <div className="sticky top-0 z-10 flex h-12 items-center justify-end border-b border-line bg-panel px-4 print:hidden">
        <Button onClick={() => window.print()}>
          <Download size={14} /> Download PDF
        </Button>
      </div>
      <article
        className="report mx-auto w-full max-w-[880px] bg-panel px-5 py-8 md:my-6 md:rounded-lg md:border md:border-frame md:px-10 md:shadow-card print:m-0 print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none"
        style={accent ? ({ "--chart": accent } as React.CSSProperties) : undefined}
      >
        {accent ? <div aria-hidden className="mb-6 h-1 rounded-xs" style={{ background: accent }} /> : null}
        <header className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <p className="label-mono">{r.name}</p>
            <h1 className="mt-2 text-[28px] leading-tight font-semibold tracking-[-0.03em] text-balance">
              {r.title} <span className="text-faint">{r.period}</span>
            </h1>
            <p className="mt-2 text-[12px] text-muted">Prepared by {r.workspace}</p>
          </div>
          {r.white?.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={r.white.logo} alt={r.workspace} className="max-h-14 max-w-40 shrink-0 object-contain" />
          ) : !r.white ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/logo.png" alt="" width={40} height={40} className="size-10 shrink-0 rounded-sm" />
          ) : null}
        </header>
        {blocks.map((b) => (
          <Section key={b.key} title={b.title} note={b.note} className="report-section">
            {b.body}
          </Section>
        ))}
        {r.white ? null : (
          <footer className="mt-10 flex items-center gap-2 border-t border-line pt-4 text-[11px] text-faint">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" width={16} height={16} className="size-4 rounded-xs" />
            Made with Capybaroar
          </footer>
        )}
      </article>
    </div>
  );
}
