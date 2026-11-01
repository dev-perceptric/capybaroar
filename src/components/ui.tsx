"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Check, Copy, SearchIcon } from "./Icons";
import { Drawing, type DrawingKind } from "./Drawing";
import { Tip, useTip } from "./Floating";

import { fmtDate, fmtDateTime } from "@/lib/format";
/** Whether a workspace has the content screens or the CRM ones (049). Before that migration, it has both. */
/** Which optional sign-ins the server has keys for. */
/** Goes up each time a kept page is shown again, so its data refreshes while what you typed stays. */
/**
 * A screen's tabs with their own address: `/people/<id>/emails`. Back, refresh and shared links open the same tab.
 * `base` is the screen's own path without a tab (null keeps the tab in the screen only, as in a side panel). The
 * first tab has no segment. A kept page that's shown again reads its tab from the address.
 */
/** Load data once, and again when `reload`is called, `key`changes or its page is shown again. */
export function useLoad<T>(fn: () => Promise<T>, key: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  const latest = useRef(fn);
  useEffect(() => {
    latest.current = fn;
  });
  useEffect(() => {
    let live = true;
    latest
      .current()
      .then((d) => {
        if (!live) return;
        setData(d);
        setError("");
      })
      .catch((e) => live && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      live = false;
    };
  }, [key, tick]);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  useEffect(() => {
    window.addEventListener("capybaroar:changed", reload);
    return () => window.removeEventListener("capybaroar:changed", reload);
  }, [reload]);
  return { data, error, reload, set: setData };
}

/** Throw a Supabase error so useLoad shows it. */
export function must<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

export function timeAgo(iso: string | null) {
  if (!iso) return "—";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  const future = diff < 0;
  const s = Math.abs(diff);
  const text =
    s < 60 ? "just now" : s < 3600 ? `${Math.round(s / 60)}m`: s < 86400 ? `${Math.round(s / 3600)}h`: s < 86400 * 30 ? `${Math.round(s / 86400)}d`: fmtDate(iso);
  if (text === "just now" || text.includes(" ")) return text;
  return future ? `in ${text}`: `${text} ago`;
}

export function when(iso: string) {
  return fmtDateTime(iso);
}

/** A page in the app: a slim title bar, an optional toolbar, then the content. */
export function Page({
  icon,
  title,
  count,
  actions,
  toolbar,
  tabs,
  flush = false,
  back,
  crumbs,
  dock,
  onRename,
  children,
}: {
  dock?: React.ReactNode;
  /** Makes the title editable in place: one click to edit, Enter or leaving the box saves, Escape cancels. */
  onRename?: (name: string) => void;
  tabs?: React.ReactNode;
  back?: { label: string; onClick: () => void };
  /** Where this page sits, left to right, before its own title: "Data model / People". */
  crumbs?: { label: string; onClick: () => void }[];
  icon: React.ReactNode;
  title: string;
  count?: number | string;
  actions?: React.ReactNode;
  toolbar?: React.ReactNode;
  flush?: boolean;
  children: React.ReactNode;
}) {
  const trail = [...(back ? [back] : []), ...(crumbs ?? [])];
  return (
    <div className="flex h-full min-h-0 flex-col bg-panel">
      <header className="flex h-12 shrink-0 items-center gap-1 border-b border-line bg-panel px-3">
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1">
          {trail.map((c, i) => (
            <span key={`${i}:${c.label}`} className="contents">
              <button type="button" onClick={c.onClick} className="min-w-0 truncate rounded-sm px-1 py-0.5 text-[13px] text-muted transition-colors hover:bg-hover hover:text-ink">
                {c.label}
              </button>
              <span className="text-light">/</span>
            </span>
          ))}
          <span className="flex min-w-0 items-center gap-1.5 px-1">
            <span className="flex shrink-0 items-center text-muted [&_svg]:size-4">{icon}</span>
            {onRename ? (
              <EditableTitle title={title} onRename={onRename} />
            ) : (
              <h1 aria-current="page" className="truncate text-[13px] leading-normal font-medium">
                {title}
              </h1>
            )}
            {count != null ? <span className="text-[13px] text-faint tabular-nums">{count}</span> : null}
          </span>
        </nav>
        {actions ? <div className="ml-auto flex items-center gap-2">{actions}</div> : null}
      </header>
      {tabs ? <div className="shrink-0 border-b border-line bg-panel px-3">{tabs}</div> : null}
      {toolbar ? <div className="flex min-h-10 shrink-0 flex-wrap items-center gap-2 border-b border-line bg-panel px-3 py-1">{toolbar}</div> : null}
      <div className={`min-h-0 flex-1 overflow-auto bg-panel ${flush ? "" : "p-4 md:p-6"}`}>{children}</div>
      {dock}
    </div>
  );
}

function EditableTitle({ title, onRename }: { title: string; onRename: (name: string) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const done = () => {
    const v = (draft ?? "").trim();
    setDraft(null);
    if (v && v !== title) onRename(v);
  };
  if (draft != null)
    return (
      <input
        autoFocus
        aria-label="Name"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={done}
        onKeyDown={(e) => (e.key === "Enter" ? done() : e.key === "Escape" ? setDraft(null) : null)}
        className="h-7 w-[min(480px,60vw)] rounded-sm border border-brand bg-panel px-1.5 text-[13px] font-medium outline-none shadow-[0_0_0_3px_var(--accent-5)]"
      />
    );
  return (
    <h1 aria-current="page" className="min-w-0">
      <button type="button" title="Rename" onClick={() => setDraft(title)} className="max-w-full truncate rounded-sm px-1 py-0.5 text-left text-[13px] leading-normal font-medium hover:bg-hover">
        {title}
      </button>
    </h1>
  );
}

export function Panel({ children, className = "", frame = false }: { children: React.ReactNode; className?: string; frame?: boolean }) {
  return <div className={`border border-frame bg-panel ${frame ? "frame" : ""} ${className}`}>{children}</div>;
}

/** A card's header row: its name, a count, and room for actions on the right. */
export function CardHead({ label, count, children }: { label: string; count?: number | string; children?: React.ReactNode }) {
  return (
    <div className="flex h-10 items-center gap-2 border-b border-line px-3">
      <span className="truncate text-[13px] font-medium">{label}</span>
      {count != null ? <span className="text-[13px] text-faint tabular-nums">{count}</span> : null}
      {children ? <div className="ml-auto flex items-center gap-1.5">{children}</div> : null}
    </div>
  );
}

/** A small caption. */
export function Fig({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`fig ${className}`}>{children}</p>;
}

/** Nothing to show yet, like Twenty: a blank page with one drawing in the middle, a short title, one line and the
 *  button that makes the first one. `compact` is for a section inside a page instead of the whole page. */
export function Empty({ title, children, drawing = "search", icon, action, compact = false }: { title: string; children?: React.ReactNode; drawing?: DrawingKind; icon?: string | null; action?: React.ReactNode; compact?: boolean }) {
  return (
    <section className={`rise flex flex-col items-center justify-center px-6 text-center ${compact ? "py-12" : "min-h-[calc(100dvh-180px)] py-12"}`}>
      <Drawing kind={drawing} icon={icon} size={compact ? 160 : 220} />
      <h2 className="mt-6 text-[16px] font-medium tracking-[-0.01em]">{title}</h2>
      {children ? <div className="mt-1 max-w-sm text-[13px] text-muted">{children}</div> : null}
      {action ? <div className="mt-5 flex flex-wrap items-center justify-center gap-2">{action}</div> : null}
    </section>
  );
}

/** A small "i" with a tooltip that wraps, for a short recommendation next to a setting. */
export function Hint({ text, align = "center" }: { text: string; align?: "center" | "end" }) {
  const ref = useRef<HTMLSpanElement>(null);
  const tip = useTip(0);
  return (
    <span ref={ref} {...tip.handlers} tabIndex={0} aria-label={text} className="relative inline-flex size-4 shrink-0 cursor-help items-center justify-center text-faint outline-none hover:text-ink focus-visible:text-ink">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5M12 8h.01" />
      </svg>
      {tip.on ? <Tip anchor={ref} text={text} placement={align === "end" ? "top-end" : "top"} wrap /> : null}
    </span>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return message ? (
    <p role="alert" className="flex items-start gap-2 rounded-lg border border-danger-line bg-danger-soft px-3 py-2 text-[13px] text-ink">
      <span className="mt-[5px] size-2 shrink-0 bg-[var(--status-error)]" />
      {message}
    </p>
  ) : null;
}

export function Notice({ message }: { message: string }) {
  return message ? (
    <p role="status" className="flex items-start gap-2 rounded-lg border border-line bg-success-soft px-3 py-2 text-[13px] text-ink">
      <span className="mt-[5px] size-2 shrink-0 bg-[var(--status-success)]" />
      {message}
    </p>
  ) : null;
}

/** Skeleton rows with a light blue shimmer while a list loads. */
/**
 * The skeleton while a screen loads, in the shape of what's coming, so nothing jumps when the data lands: `rows` for
 * a short list, `table` for a list screen (a header row, then rows of cells), `record` for a record page (a header,
 * then fields beside the activity).
 */
export function Loading({ shape = "rows" }: { shape?: "rows" | "table" | "record" } = {}) {
  if (shape === "table")
    return (
      <div className="px-5 py-4" role="status" aria-label="Loading">
        <div className="mb-3 flex items-center gap-2">
          <span className="bone h-8 w-56 rounded-md" />
          <span className="bone ml-auto h-8 w-24 rounded-md" />
        </div>
        <div className="flex h-9 items-center gap-6 border-b border-line">
          {[28, 16, 14, 12, 10].map((w, i) => (
            <span key={i} className="bone h-2.5" style={{ width: `${w}%` }} />
          ))}
        </div>
        {Array.from({ length: 12 }, (_, r) => (
          <div key={r} className="flex h-10 items-center gap-6 border-b border-line-light" style={{ opacity: 1 - r * 0.06 }}>
            <span className="flex items-center gap-2" style={{ width: "28%" }}>
              <span className="bone size-5 shrink-0 rounded-full" />
              <span className="bone h-2.5" style={{ width: `${55 + ((r * 13) % 35)}%` }} />
            </span>
            {[16, 14, 12, 10].map((w, i) => (
              <span key={i} className="bone h-2.5" style={{ width: `${w - ((r + i) % 3) * 2}%` }} />
            ))}
          </div>
        ))}
      </div>
    );
  if (shape === "record")
    return (
      <div className="p-5" role="status" aria-label="Loading">
        <div className="mb-6 flex items-center gap-3">
          <span className="bone size-10 shrink-0 rounded-full" />
          <span className="space-y-2">
            <span className="bone block h-3.5 w-48" />
            <span className="bone block h-2.5 w-28" />
          </span>
        </div>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div className="space-y-4">
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="bone h-2.5 w-24" />
                <span className="bone h-2.5" style={{ width: `${30 + ((i * 11) % 30)}%` }} />
              </div>
            ))}
          </div>
          <div className="space-y-5">
            <div className="flex gap-4 border-b border-line pb-3">
              {[14, 12, 16, 10, 10].map((w, i) => (
                <span key={i} className="bone h-2.5" style={{ width: `${w}%` }} />
              ))}
            </div>
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="space-y-2">
                <span className="bone block h-2.5 w-1/3" />
                <span className="bone block h-2.5 w-4/5" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );

  return (
    <div className="space-y-4 p-5" role="status" aria-label="Loading">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3" style={{ opacity: 1 - i * 0.14 }}>
          <span className="bone size-7 shrink-0 rounded-full" />
          <span className="bone h-2.5" style={{ width: `${24 + ((i * 7) % 18)}%` }} />
          <span className="bone ml-[6%] h-2.5 w-[14%]" />
          <span className="bone ml-[4%] h-2.5 w-[10%]" />
        </div>
      ))}
    </div>
  );
}

/** Square buttons: primary is the one black action on a view, ghost is secondary (framed), plain is tertiary. */
export function Button({ variant = "primary", className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "plain" | "danger" }) {
  const look =
    variant === "primary"
      ? "border-frame bg-yolk text-on-yolk hover:bg-yolk-hover"
      : variant === "ghost"
        ? "border-frame bg-panel text-ink hover:bg-hover"
        : variant === "danger"
          ? "border-danger-line bg-danger-soft text-danger hover:brightness-[0.98]"
          : "border-transparent bg-transparent text-muted hover:bg-hover hover:text-ink";
  return (
    <button
      {...props}
      className={`inline-flex h-8 items-center justify-center gap-1.5 border px-3.5 text-[12px] leading-none font-medium whitespace-nowrap transition-[background-color,border-color,opacity,transform] duration-[var(--duration-fast)] ease-[var(--ease-spring)] active:scale-[0.96] disabled:cursor-not-allowed disabled:active:scale-100 disabled:border-transparent disabled:bg-hover disabled:text-light [&_svg]:size-4 ${look} ${className}`}
    />
  );
}

export type Tone = "gray" | "brand" | "violet" | "green" | "amber" | "red" | "turquoise" | "sky" | "pink" | "yellow";
// Tags: a step 3 fill with step 11 text, square, framed in their own color.
const TONES: Record<Tone, { bg: string; dot: string }> = {
  gray: { bg: "bg-gray-soft text-muted", dot: "bg-[var(--gray-9)]" },
  brand: { bg: "bg-brand-soft text-brand-ink", dot: "bg-[var(--blue-9)]" },
  violet: { bg: "bg-violet-soft text-violet", dot: "bg-[var(--purple-9)]" },
  green: { bg: "bg-success-soft text-success", dot: "bg-[var(--green-9)]" },
  amber: { bg: "bg-warning-soft text-warning", dot: "bg-[var(--orange-9)]" },
  red: { bg: "bg-danger-soft text-danger", dot: "bg-[var(--red-9)]" },
  turquoise: { bg: "bg-turquoise-soft text-turquoise", dot: "bg-[var(--turquoise-9)]" },
  sky: { bg: "bg-sky-soft text-sky", dot: "bg-[var(--sky-9)]" },
  pink: { bg: "bg-pink-soft text-pink", dot: "bg-[var(--pink-9)]" },
  yellow: { bg: "bg-yellow-soft text-yellow", dot: "bg-[var(--yellow-9)]" },
};

/** A record's state: a tag. */
export function Badge({ children, tone = "gray" }: { children: React.ReactNode; tone?: Tone }) {
  return <span className={`inline-flex h-5 items-center gap-1 border border-current px-1.5 text-[12px] leading-none font-medium whitespace-nowrap ${TONES[tone].bg}`}>{children}</span>;
}

export function Dot({ tone }: { tone: Tone }) {
  return <span className={`inline-block size-2 ${TONES[tone].dot}`} />;
}

const initialsOf = (label: string) =>
  label
    .replace(/@.*/, "")
    .split(/[\s._\-–—]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("") || "?";

// Avatars take a soft color from their name, like Twenty's.
const AVATAR_TONES = ["blue", "purple", "green", "orange", "pink", "turquoise", "sky", "red"];
const toneOf = (label: string) => AVATAR_TONES[[...label].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) % AVATAR_TONES.length]!;

/** A round avatar with initials, for people. */
export function Avatar({ label, size = 24 }: { label: string; size?: number }) {
  const t = toneOf(label);
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-full font-medium" style={{ width: size, height: size, fontSize: Math.max(9, size * 0.4), background: `var(--${t}-3)`, color: `var(--${t}-11)` }}>
      {initialsOf(label)}
    </span>
  );
}

/** A square company logo from its domain, with initials while it loads or if there is none. */
/** A company shown inline as a small chip: logo and name. */
export function Search({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="flex h-8 w-64 max-w-full items-center gap-2 rounded-sm border border-line bg-hover px-2 text-muted transition-colors hover:border-line-strong focus-within:border-brand focus-within:bg-panel focus-within:shadow-[0_0_0_3px_var(--accent-5)]">
      <SearchIcon size={14} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-faint" />
    </label>
  );
}

/** A page's tabs: an underline nav where each tab is its own address, like Arrowsterr's Settings. */
export function TabNav<T extends string>({ value, tabs, onChange, label }: { value: T; tabs: { value: T; label: string; icon?: React.ReactNode; count?: number }[]; onChange: (v: T) => void; label: string }) {
  // One black underline that slides to the picked tab (200ms on the brand curve; transform only).
  const bar = useRef<HTMLElement>(null);
  const [line, setLine] = useState<{ x: number; w: number; moved: boolean } | null>(null);
  const keys = tabs.map((t) => t.value).join("|");
  useLayoutEffect(() => {
    const at = bar.current?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!at) return setLine(null);
    setLine((l) => ({ x: at.offsetLeft, w: at.offsetWidth, moved: l !== null }));
  }, [value, keys]);
  return (
    <nav ref={bar} className="relative -mb-px flex gap-2 overflow-x-auto" aria-label={label}>
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          aria-current={value === t.value ? "page" : undefined}
          onClick={() => onChange(t.value)}
          className={`relative inline-flex h-10 shrink-0 items-center gap-1.5 px-2 text-[13px] whitespace-nowrap transition-colors [&_svg]:size-4 ${value === t.value ? "font-medium text-ink" : "text-muted hover:text-ink"}`}
        >
          {t.icon}
          {t.label}
          {t.count != null ? <span className={`text-[12px] tabular-nums ${value === t.value ? "font-medium text-brand" : "font-normal text-faint"}`}>{t.count}</span> : null}
        </button>
      ))}
      {line ? (
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 h-0.5 w-px origin-left bg-ink"
          style={{ transform: `translateX(${line.x}px) scaleX(${line.w})`, transition: line.moved ? "transform var(--duration-fast) var(--ease-out)" : undefined }}
        />
      ) : null}
    </nav>
  );
}

/** A row of choices where one is picked, like Attio's view switcher. */
export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string; icon?: React.ReactNode; count?: number }[]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex h-8 items-stretch border border-frame">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={`inline-flex items-center gap-1.5 px-3 text-[12px] font-medium transition-colors not-first:border-l not-first:border-frame [&_svg]:size-3.5 ${value === o.value ? "bg-yolk text-on-yolk" : "text-muted hover:bg-hover hover:text-ink"}`}
        >
          {o.icon}
          {o.label}
          {o.count != null ? <span className="tabular-nums opacity-60">{o.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

/** A table header cell with an icon, like Attio's attribute headers. */
export function Th({ icon, children, className = "" }: { icon?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <th className={`sticky top-0 z-10 h-8 border-r border-b border-r-line-light border-b-line bg-panel px-2 text-left text-[13px] font-medium whitespace-nowrap text-muted last:border-r-0 ${className}`}>
      <span className="inline-flex items-center gap-1">
        {icon ? <span className="text-muted [&_svg]:size-4">{icon}</span> : null}
        {children}
      </span>
    </th>
  );
}

export function Td({ children, className = "", ...rest }: React.TdHTMLAttributes<HTMLTableCellElement> & { children: React.ReactNode; className?: string }) {
  return (
    <td {...rest} className={`h-8 border-r border-b border-line-light px-2 text-[13px] whitespace-nowrap last:border-r-0 ${className}`}>
      {children}
    </td>
  );
}

/** One number in a strip of key numbers, like the top of a record page. */
export function Stat({ label, value, sub, tone, onClick }: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: "red" | "green" | "amber"; onClick?: () => void }) {
  const color = tone === "red" ? "text-danger" : tone === "green" ? "text-success" : tone === "amber" ? "text-warning" : "";
  const body = (
    <>
      <p className="truncate text-[12px] font-medium text-muted">{label}</p>
      <div className={`mt-1 truncate text-[24px] leading-[1.1] font-[350] tracking-[-0.02em] tabular-nums ${color}`}>{value}</div>
      {sub ? <p className={`mt-1 truncate text-[11px] ${tone === "red" ? "text-danger" : "text-muted"}`}>{sub}</p> : null}
    </>
  );
  return onClick ? (
    <button type="button" onClick={onClick} className="min-w-0 bg-panel px-4 py-3 text-left transition-colors hover:bg-hover">
      {body}
    </button>
  ) : (
    <div className="min-w-0 bg-panel px-4 py-3">{body}</div>
  );
}

/** A row of Stats with hairlines between them. */
export function StatStrip({ children, cols, className = "" }: { children: React.ReactNode; cols: 3 | 4 | 5 | 6; className?: string }) {
  const grid = { 3: "md:grid-cols-3", 4: "md:grid-cols-4", 5: "md:grid-cols-5", 6: "md:grid-cols-6" }[cols];
  return <div className={`grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line ${grid} ${className}`}>{children}</div>;
}

/** The key numbers on a screen, all one size. */
export const StatCards = StatStrip;

export function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="inline-flex h-4 min-w-4 items-center justify-center rounded-xs bg-pressed px-1 font-sans text-[11px] leading-none text-muted">{children}</kbd>;
}

/** Page content stays centered and no wider than this, so wide screens don't stretch one side. Body grids add their padding. */
export const WIDE = "mx-auto w-full max-w-[1280px]";
export const WIDE_BODY = "mx-auto w-full max-w-[1328px]";
/** Two columns for record pages: the story on one side, people and facts on the other. */
export const SPLIT = "grid gap-5 p-5 md:p-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]";

/** A button that is only an icon. The label shows as a tooltip on hover and keyboard focus, and is read by screen readers. */
export function IconButton({
  label,
  variant = "plain",
  tip = "bottom",
  align = "center",
  className = "",
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; variant?: "primary" | "ghost" | "plain"; tip?: "top" | "bottom"; align?: "center" | "start" | "end" }) {
  const look =
    variant === "primary"
      ? "border border-frame bg-yolk text-on-yolk hover:bg-yolk-hover"
      : variant === "ghost"
        ? "border border-line bg-panel text-muted hover:bg-hover"
        : "text-muted hover:bg-hover hover:text-ink";
  const ref = useRef<HTMLButtonElement>(null);
  const hover = useTip();
  const at = `${tip}${align === "center" ? "" : `-${align}`}` as "top" | "bottom" | "top-start" | "top-end" | "bottom-start" | "bottom-end";
  // Our tooltip handlers run first, then the caller's own.
  const on = (k: keyof typeof hover.handlers) => (e: never) => {
    (hover.handlers[k] as (e: unknown) => void)(e);
    (props[k] as ((e: unknown) => void) | undefined)?.(e);
  };
  return (
    <button
      type="button"
      {...props}
      ref={ref}
      onPointerEnter={on("onPointerEnter")}
      onPointerLeave={on("onPointerLeave")}
      onPointerDown={on("onPointerDown")}
      onFocus={on("onFocus")}
      onBlur={on("onBlur")}
      aria-label={label}
      className={`relative inline-flex size-8 shrink-0 items-center justify-center rounded-sm transition-[background-color,color,transform] duration-[var(--duration-fast)] ease-[var(--ease-spring)] active:scale-[0.94] disabled:pointer-events-none disabled:text-light [&_svg]:size-4 ${look} ${className}`}>
      {children}
      {hover.on && !props.disabled ? <Tip anchor={ref} text={label} placement={at} /> : null}
    </button>
  );
}

/** Start Google's sign-in for Gmail and Calendar. `back` is "welcome" or the page to return to. */
/** Where a person is in the buying journey. Moves forward on its own as they're contacted, reply, get a deal and win. */
/** The one look for a text box: 6px corners, gray until focused, the brand halo on focus. */
export const inputClass = "h-8 w-full border border-line-strong bg-panel px-2.5 text-[13px] outline-none placeholder:text-faint hover:border-frame focus:border-brand focus:shadow-[0_0_0_1px_var(--accent-9)] disabled:bg-canvas disabled:text-muted";
export const areaClass = "w-full border border-line-strong bg-panel px-2.5 py-2 text-[13px] outline-none placeholder:text-faint hover:border-frame focus:border-brand focus:shadow-[0_0_0_1px_var(--accent-9)] disabled:bg-canvas disabled:text-muted";

export function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${className}`} />;
}

export function TextArea({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { ref?: React.Ref<HTMLTextAreaElement> }) {
  return <textarea {...props} className={`${areaClass} ${className}`} />;
}

/** A label over its control. `aside` sits on the right of the label; `row` puts them side by side. */
export function Field({ label, aside, row = false, children }: { label: string; aside?: React.ReactNode; row?: boolean; children: React.ReactNode }) {
  if (row)
    return (
      <div className="grid grid-cols-1 items-center gap-1.5 sm:grid-cols-[140px_1fr] sm:gap-3">
        <span className="text-[12px] text-muted">{label}</span>
        <div className="min-w-0">{children}</div>
      </div>
    );
  return (
    <div className="space-y-1.5">
      <div className="flex items-center">
        <span className="flex-1 text-[12px] text-muted">{label}</span>
        {aside}
      </div>
      {children}
    </div>
  );
}

/** An on/off switch. */
export function Switch({ on, label, disabled, onChange }: { on: boolean; label: string; disabled?: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} disabled={disabled} onClick={() => onChange(!on)} className={`relative h-5 w-9 shrink-0 transition-colors duration-[var(--duration-instant)] disabled:cursor-not-allowed disabled:opacity-60 ${on ? "bg-yolk ring-1 ring-frame ring-inset" : "bg-line-strong"}`}>
      <span className={`absolute top-0.5 left-0.5 size-4 bg-white transition-transform duration-[var(--duration-instant)] ease-[var(--ease-out)] ${on ? "translate-x-4" : ""}`} />
    </button>
  );
}

/** A checkbox, one size and the brand color. It can show "some picked" with `indeterminate`. */
export function Checkbox({ checked, indeterminate = false, onChange, label, disabled, className = "" }: { checked: boolean; indeterminate?: boolean; onChange: (v: boolean) => void; label?: string; disabled?: boolean; className?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate && !checked;
  }, [indeterminate, checked]);
  return <input ref={ref} type="checkbox" aria-label={label} checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} onClick={(e) => e.stopPropagation()} className={`size-4 shrink-0 cursor-pointer accent-[var(--color-brand)] disabled:cursor-not-allowed ${className}`} />;
}

/** Copies text, then shows a check for a moment. */
export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(false), 1500);
    return () => clearTimeout(t);
  }, [done]);
  return (
    <IconButton label={done ? "Copied" : label} onClick={() => void navigator.clipboard.writeText(text).then(() => setDone(true))}>
      {done ? <Check size={15} /> : <Copy size={15} />}
    </IconButton>
  );
}
