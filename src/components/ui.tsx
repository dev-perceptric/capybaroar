"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Check, Copy, SearchIcon } from "./Icons";
import { Drawing, type DrawingKind } from "./Drawing";
import { Tip, useTip } from "./Floating";

import { fmtDate, fmtDateTime } from "@/lib/format";

// The app's shared parts, after Claritia's (docs/brand.md version 4, the calm style): a white header bar over a paper
// work area, white cards on soft ring shadows, pill buttons and chips, 8px inputs, chip tabs beside the page title.
// Yellow (`signal`) stays Capybaroar's one accent, always a fill with ink on it.

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

/**
 * A page in the app: a white header bar (a back crumb, the icon and title, a count, the section's tabs beside the
 * title, actions on the right), an optional toolbar row, then the work area on paper. `flush` pages draw their own
 * body edge to edge (the calendar, the inbox, the agent).
 */
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
  /** The section's tabs (`TabNav`), drawn beside the title. */
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
    <div className="flex h-full min-h-0 flex-col bg-paper">
      <header className="flex min-h-[52px] shrink-0 flex-wrap items-center gap-x-2 gap-y-1.5 border-b border-line bg-panel px-3 py-2">
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
              <h1 aria-current="page" className="truncate text-[15px] leading-normal font-medium tracking-[-0.01em]">
                {title}
              </h1>
            )}
            {count != null ? <span className="text-[13px] text-faint tabular-nums">{count}</span> : null}
          </span>
        </nav>
        {tabs ? <div className="flex max-w-full min-w-0 items-center">{tabs}</div> : null}
        {actions ? <div className="ml-auto flex max-w-full min-w-0 flex-wrap items-center justify-end gap-2">{actions}</div> : null}
      </header>
      {toolbar ? <div className="flex min-h-11 shrink-0 flex-wrap items-center gap-2 border-b border-line bg-panel px-3 py-1.5">{toolbar}</div> : null}
      <div className={`min-h-0 flex-1 overflow-auto ${flush ? "" : "p-4 md:p-6"}`}>{children}</div>
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
        className="h-7 w-[min(480px,60vw)] rounded-md bg-panel px-1.5 text-[15px] font-medium shadow-focus outline-none"
      />
    );
  return (
    <h1 aria-current="page" className="min-w-0">
      <button type="button" title="Rename" onClick={() => setDraft(title)} className="max-w-full truncate rounded-sm px-1 py-0.5 text-left text-[15px] leading-normal font-medium tracking-[-0.01em] hover:bg-hover">
        {title}
      </button>
    </h1>
  );
}

/** A card: white on a soft ring shadow. `frame` gives the one frame a screen is about a deeper shadow. */
export function Panel({ children, className = "", frame = false }: { children: React.ReactNode; className?: string; frame?: boolean }) {
  return <div className={`rounded-lg bg-panel ${frame ? "shadow-hover" : "shadow-card"} ${className}`}>{children}</div>;
}

/** A card's header bar: its name, a count, and room for actions on the right. */
export function CardHead({ label, count, children }: { label: string; count?: number | string; children?: React.ReactNode }) {
  return (
    <div className="flex min-h-12 flex-wrap items-center gap-x-2 gap-y-1 border-b border-line px-4 py-2">
      <h2 className="min-w-0 truncate text-[14px] font-semibold tracking-[-0.01em]">{label}</h2>
      {count != null ? <span className="text-[12px] text-muted tabular-nums">{count}</span> : null}
      {children ? <div className="ml-auto flex flex-wrap items-center gap-1.5">{children}</div> : null}
    </div>
  );
}

/** A list inside a card: rows with hairlines between them. */
export function Rows({ children, className = "", label }: { children: React.ReactNode; className?: string; label?: string }) {
  return (
    <div role={label ? "list" : undefined} aria-label={label} className={`divide-y divide-line overflow-hidden rounded-lg bg-panel shadow-card ${className}`}>
      {children}
    </div>
  );
}

/**
 * One row of a list: a picture or icon, a name with a gray line under it, and its controls on the right. The name
 * keeps room for itself, so on a phone the controls wrap under it instead of squeezing it.
 */
export function Row({ lead, title, sub, children, className = "", top = false }: { lead?: React.ReactNode; title: React.ReactNode; sub?: React.ReactNode; children?: React.ReactNode; className?: string; top?: boolean }) {
  return (
    <div className={`flex min-h-14 flex-wrap gap-x-3 gap-y-2 px-4 py-2.5 ${top ? "items-start" : "items-center"} ${className}`}>
      {lead ? <span className={`flex shrink-0 items-center ${top ? "mt-0.5" : ""}`}>{lead}</span> : null}
      <div className="min-w-[10rem] flex-1">
        <div className="truncate text-[13px] font-medium">{title}</div>
        {sub ? <div className="text-[12px] text-muted">{sub}</div> : null}
      </div>
      {children ? <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-1">{children}</div> : null}
    </div>
  );
}

/** The title of a settings pane or a big section: the name, one gray line, and actions on the right. */
export function PaneHead({ title, line, children }: { title: string; line?: string; children?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-end gap-3">
      <div className="min-w-0 flex-1">
        <h2 className="text-[20px] leading-tight font-semibold tracking-[-0.02em]">{title}</h2>
        {line ? <p className="mt-1 text-[13px] text-muted">{line}</p> : null}
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </header>
  );
}

/** Nothing to show yet, like Twenty: a blank page with one drawing in the middle, a short title, one line and the
 *  button that makes the first one. `compact` is for a section inside a page instead of the whole page. */
export function Empty({ title, children, drawing = "search", icon, action, compact = false }: { title: string; children?: React.ReactNode; drawing?: DrawingKind; icon?: string | null; action?: React.ReactNode; compact?: boolean }) {
  return (
    <section className={`rise flex flex-col items-center justify-center px-6 text-center ${compact ? "py-12" : "min-h-[calc(100dvh-200px)] py-12"}`}>
      <Drawing kind={drawing} icon={icon} size={compact ? 150 : 220} />
      <h2 className="mt-5 text-[16px] font-medium tracking-[-0.01em]">{title}</h2>
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

/** A real error, in a soft red box. */
export function ErrorNote({ message, className = "" }: { message: string; className?: string }) {
  return message ? (
    <p role="alert" className={`rounded-lg bg-danger-soft px-3.5 py-2.5 text-[13px] text-danger ${className}`}>
      {message}
    </p>
  ) : null;
}

export function Notice({ message, className = "" }: { message: string; className?: string }) {
  return message ? (
    <p role="status" className={`rounded-lg bg-success-soft px-3.5 py-2.5 text-[13px] text-success ${className}`}>
      {message}
    </p>
  ) : null;
}

/**
 * The skeleton while a screen loads, in the shape of what's coming, so nothing jumps when the data lands: `rows` for
 * a short list, `table` for a list screen (a header row, then rows of cells), `record` for a record page (a header,
 * then fields beside the activity). The bars breathe (opacity only).
 */
export function Loading({ shape = "rows" }: { shape?: "rows" | "table" | "record" } = {}) {
  if (shape === "table")
    return (
      <div className="px-5 py-4" role="status" aria-label="Loading">
        <div className="mb-3 flex items-center gap-2">
          <span className="bone h-8 w-56 rounded-md" />
          <span className="bone ml-auto h-8 w-24 rounded-full" />
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
    <div className="space-y-2.5 p-5" role="status" aria-label="Loading">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="bone h-10 rounded-md" style={{ opacity: 1 - i * 0.16, animationDelay: `${i * 0.1}s` }} />
      ))}
    </div>
  );
}

export type ButtonVariant = "primary" | "ghost" | "plain" | "danger" | "destroy";
export type ButtonSize = "sm" | "md";

/** The look of a button, for a link that acts as one (`LinkButton`). */
function buttonLook(variant: ButtonVariant, size: ButtonSize) {
  const look =
    variant === "primary"
      ? "bg-brand text-white shadow-primary hover:bg-brand-hover"
      : variant === "ghost"
        ? "bg-panel text-ink shadow-outline hover:bg-paper"
        : variant === "danger"
          ? "bg-panel text-danger shadow-outline hover:bg-danger-soft"
          : variant === "destroy"
            ? "bg-danger text-white shadow-primary hover:brightness-110"
            : "text-body hover:bg-hover hover:text-ink";
  const box = size === "sm" ? "h-7 px-3 text-[12px] [&_svg]:size-3.5" : "h-[34px] px-4 text-[13px] [&_svg]:size-4";
  return `inline-flex max-w-full min-w-0 shrink-0 items-center justify-center gap-1.5 rounded-full leading-none font-medium whitespace-nowrap transition-[background-color,box-shadow,color,opacity,transform] duration-[var(--duration-fast)] ease-[var(--ease-spring)] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45 ${box} ${look}`;
}

/** Buttons are pills: primary is the one dark gray action on a view, ghost is secondary (a soft ring), plain is
 *  tertiary, danger is a red word on white, destroy the red button that confirms a delete. */
export function Button({ variant = "primary", size = "md", className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button type="button" {...props} className={`${buttonLook(variant, size)} ${className}`} />;
}

/** A link that looks like a button. `external` opens another site in a new tab. */
export function LinkButton({ href, variant = "primary", size = "md", external = false, className = "", children, ...rest }: { href: string; variant?: ButtonVariant; size?: ButtonSize; external?: boolean; className?: string; children: React.ReactNode; "aria-label"?: string; title?: string }) {
  const cls = `${buttonLook(variant, size)} ${className}`;
  if (external)
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cls} {...rest}>
        {children}
      </a>
    );
  return (
    <Link href={href} className={cls} {...rest}>
      {children}
    </Link>
  );
}

export type Tone = "gray" | "brand" | "violet" | "green" | "amber" | "red" | "turquoise" | "sky" | "pink" | "yellow";
// Tags: a step 3 fill with step 11 text, 6px corners, no frame. The dot is the solid step 9.
const TONES: Record<Tone, { bg: string; dot: string }> = {
  gray: { bg: "bg-gray-soft text-ink", dot: "bg-tone-gray" },
  brand: { bg: "bg-blue-soft text-blue", dot: "bg-tone-blue" },
  violet: { bg: "bg-violet-soft text-violet", dot: "bg-tone-violet" },
  green: { bg: "bg-success-soft text-success", dot: "bg-tone-green" },
  amber: { bg: "bg-warning-soft text-warning", dot: "bg-tone-amber" },
  red: { bg: "bg-danger-soft text-danger", dot: "bg-tone-red" },
  turquoise: { bg: "bg-turquoise-soft text-turquoise", dot: "bg-tone-turquoise" },
  sky: { bg: "bg-sky-soft text-sky", dot: "bg-tone-sky" },
  pink: { bg: "bg-pink-soft text-pink", dot: "bg-tone-pink" },
  yellow: { bg: "bg-yellow-soft text-yellow", dot: "bg-tone-yellow" },
};

/** A record's state: a 6px tag, soft fill and deep text, with an optional dot. */
export function Badge({ children, tone = "gray", dot = false }: { children: React.ReactNode; tone?: Tone; dot?: boolean }) {
  return (
    <span className={`inline-flex h-5 w-fit shrink-0 items-center gap-1.5 rounded-sm px-2 text-[12px] leading-none font-medium whitespace-nowrap ${TONES[tone].bg}`}>
      {dot ? <span className={`size-1.5 rounded-full ${TONES[tone].dot}`} /> : null}
      {children}
    </span>
  );
}

export function Dot({ tone }: { tone: Tone }) {
  return <span className={`inline-block size-2 shrink-0 rounded-full ${TONES[tone].dot}`} />;
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

/** A search box: the input look with a magnifier. */
export function Search({ value, onChange, placeholder, className = "w-64" }: { value: string; onChange: (v: string) => void; placeholder: string; className?: string }) {
  return (
    <label className={`flex h-9 max-w-full items-center gap-2 rounded-md bg-panel px-3 text-muted shadow-input transition-shadow hover:shadow-input-hover focus-within:shadow-focus ${className}`}>
      <SearchIcon size={14} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-faint" />
    </label>
  );
}

/** A section's tabs, each its own address: small chips beside the page title, the open one in soft yellow. */
export function TabNav<T extends string>({ value, tabs, onChange, label }: { value: T; tabs: { value: T; label: string; icon?: React.ReactNode; count?: number }[]; onChange: (v: T) => void; label: string }) {
  return (
    <nav className="flex max-w-full min-w-0 items-center gap-1.5 overflow-x-auto p-0.5 [scrollbar-width:none]" aria-label={label}>
      {tabs.map((t) => {
        const on = value === t.value;
        return (
          <button
            key={t.value}
            type="button"
            aria-current={on ? "page" : undefined}
            onClick={() => onChange(t.value)}
            className={`inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-[13px] whitespace-nowrap transition-[background-color,box-shadow,color] duration-[var(--duration-fast)] [&_svg]:size-3.5 ${on ? "bg-signal-soft text-ink shadow-picked" : "bg-panel text-body shadow-chip hover:text-ink hover:shadow-pill"}`}
          >
            {t.icon}
            {t.label}
            {t.count != null ? <span className={`text-[12px] tabular-nums ${on ? "text-ink/60" : "text-faint"}`}>{t.count}</span> : null}
          </button>
        );
      })}
    </nav>
  );
}

/** Where the picked child sits, so a thumb can slide to it. */
function useSlide(index: number, deps: unknown[]) {
  const box = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState<{ left: number; width: number } | null>(null);
  useLayoutEffect(() => {
    const el = box.current?.querySelectorAll<HTMLElement>("[data-slide]")[index];
    setAt(el ? { left: el.offsetLeft, width: el.offsetWidth } : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, ...deps]);
  return { box, at };
}

/** A row of choices where one is picked: a pill track with a white pill thumb that slides to the pick. */
export function Segmented<T extends string>({ value, options, onChange, label, size = "md" }: { value: T; options: { value: T; label: string; icon?: React.ReactNode; count?: number; disabled?: boolean }[]; onChange: (v: T) => void; label?: string; size?: "sm" | "md" }) {
  const { box, at } = useSlide(
    options.findIndex((o) => o.value === value),
    [options.map((o) => o.label).join(), size],
  );
  const sm = size === "sm";
  return (
    <div ref={box} role="radiogroup" aria-label={label} className={`relative inline-flex w-fit max-w-full shrink-0 items-center gap-0.5 overflow-x-auto rounded-full bg-paper-deep shadow-track [scrollbar-width:none] ${sm ? "h-8 p-[3px]" : "h-9 p-1"}`}>
      {at ? (
        <span
          aria-hidden="true"
          className={`absolute left-0 rounded-full bg-panel shadow-chip transition-[transform,width] duration-[var(--duration-normal)] ease-[var(--ease-out)] ${sm ? "top-[3px] bottom-[3px]" : "top-1 bottom-1"}`}
          style={{ width: at.width, transform: `translateX(${at.left}px)` }}
        />
      ) : null}
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            data-slide=""
            type="button"
            role="radio"
            aria-checked={on}
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
            className={`relative inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium whitespace-nowrap transition-colors duration-[var(--duration-normal)] disabled:opacity-45 [&_svg]:size-3.5 ${sm ? "h-[26px]" : "h-7"} ${on ? "text-ink" : "text-muted hover:text-ink"} ${at ? "" : on ? "bg-panel shadow-chip" : ""}`}
          >
            {o.icon}
            {o.label}
            {o.count != null ? <span className="tabular-nums opacity-60">{o.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

/**
 * A chip that can be picked: channel filters, channels to post to, a suggested time. A pill on a soft ring; picked,
 * it takes the soft yellow with a yellow ring and ink on it. `lg` fits a channel's picture.
 */
export function Chip({ on, size = "md", dashed = false, className = "", children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { on?: boolean; size?: "sm" | "md" | "lg"; dashed?: boolean }) {
  const box = size === "sm" ? "h-7 gap-1.5 px-2.5 text-[12px]" : size === "lg" ? "h-10 gap-2 pr-3.5 pl-1.5 text-[13px]" : "h-8 gap-1.5 px-3 text-[12.5px]";
  const look = dashed
    ? "border border-dashed border-line-strong text-muted hover:border-ink/40 hover:text-ink"
    : on
      ? "bg-signal-soft text-ink shadow-picked"
      : "bg-panel text-body shadow-chip hover:text-ink hover:shadow-pill";
  return (
    <button
      type="button"
      aria-pressed={props.role || props["aria-expanded"] !== undefined || on == null ? undefined : on}
      {...props}
      className={`inline-flex max-w-full shrink-0 items-center rounded-full whitespace-nowrap transition-[background-color,box-shadow,color,opacity] duration-[var(--duration-fast)] disabled:pointer-events-none disabled:opacity-45 [&_svg]:shrink-0 ${box} ${look} ${className}`}
    >
      {children}
    </button>
  );
}

/** A table header cell. */
export function Th({ icon, children, className = "" }: { icon?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <th className={`sticky top-0 z-10 h-10 border-b border-line bg-panel px-3 text-left text-[12px] font-medium whitespace-nowrap text-muted ${className}`}>
      <span className="inline-flex items-center gap-1">
        {icon ? <span className="text-muted [&_svg]:size-4">{icon}</span> : null}
        {children}
      </span>
    </th>
  );
}

export function Td({ children, className = "", ...rest }: React.TdHTMLAttributes<HTMLTableCellElement> & { children: React.ReactNode; className?: string }) {
  return (
    <td {...rest} className={`border-b border-line-light px-3 py-2 text-[13px] ${className}`}>
      {children}
    </td>
  );
}

export type StatCard = { label: string; value: React.ReactNode; note?: React.ReactNode; tone?: "red" | "green" | "amber" };

/** The key numbers on a screen: separate cards, each a label, a big number and an optional line under it. */
export function StatCards({ cards, className = "" }: { cards: StatCard[]; className?: string }) {
  return (
    <div className={`grid grid-cols-2 gap-3 ${cards.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"} ${className}`}>
      {cards.map((c) => (
        <div key={c.label} className="flex min-w-0 flex-col gap-1.5 rounded-xl bg-panel px-4 py-3.5 shadow-card break-inside-avoid">
          <span className="truncate text-[12px] text-muted">{c.label}</span>
          <span className={`truncate text-[26px] leading-none font-semibold tracking-[-0.03em] tabular-nums ${c.tone === "red" ? "text-danger" : c.tone === "green" ? "text-success" : c.tone === "amber" ? "text-warning" : ""}`}>{c.value}</span>
          {c.note !== undefined ? <span className="min-h-4 truncate text-[12px] text-faint tabular-nums">{c.note}</span> : null}
        </div>
      ))}
    </div>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="inline-flex h-4 min-w-4 items-center justify-center rounded-xs bg-hover px-1 font-sans text-[11px] leading-none text-muted shadow-track">{children}</kbd>;
}

/** A round button that is only an icon. The label shows as a tooltip on hover and keyboard focus, and is read by screen readers. */
export function IconButton({
  label,
  variant = "plain",
  tip = "bottom",
  align = "center",
  className = "",
  children,
  on: picked = false,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; variant?: "primary" | "ghost" | "plain"; tip?: "top" | "bottom"; align?: "center" | "start" | "end"; on?: boolean }) {
  const look = picked
    ? "bg-signal-soft text-ink shadow-picked"
    : variant === "primary"
      ? "bg-brand text-white shadow-primary hover:bg-brand-hover"
      : variant === "ghost"
        ? "bg-panel text-muted shadow-outline hover:bg-paper hover:text-ink"
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
      className={`relative inline-flex size-8 shrink-0 items-center justify-center rounded-full transition-[background-color,color,box-shadow,transform] duration-[var(--duration-fast)] ease-[var(--ease-spring)] active:scale-[0.94] disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-4 ${look} ${className}`}>
      {children}
      {hover.on && !props.disabled ? <Tip anchor={ref} text={label} placement={at} /> : null}
    </button>
  );
}

/** A round icon that opens a link in a new tab (a post on its network, the docs, a live page), with a tooltip. */
export function IconLink({ href, label, children, className = "" }: { href: string; label: string; children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const hover = useTip();
  return (
    <a
      ref={ref}
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      {...hover.handlers}
      className={`relative inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors duration-[var(--duration-fast)] hover:bg-hover hover:text-ink [&_svg]:size-4 ${className}`}
    >
      {children}
      {hover.on ? <Tip anchor={ref} text={label} placement="bottom" /> : null}
    </a>
  );
}

/** The one look for a text box: 8px corners, a soft ring, the yellow ring and halo on focus. `inputLook` has no
 *  width, for boxes that set their own (a time, a date). */
export const inputLook = "h-9 rounded-md bg-panel px-3 text-[13px] text-ink shadow-input outline-none transition-shadow duration-[var(--duration-fast)] placeholder:text-faint hover:shadow-input-hover focus:shadow-focus disabled:bg-paper disabled:text-muted disabled:shadow-none";
export const inputClass = `${inputLook} w-full`;
export const areaClass = "w-full rounded-md bg-panel px-3 py-2 text-[13px] text-ink shadow-input outline-none transition-shadow duration-[var(--duration-fast)] placeholder:text-faint hover:shadow-input-hover focus:shadow-focus disabled:bg-paper disabled:text-muted disabled:shadow-none";
/** A box that holds a text area with a bar of tools above or below it (the composer, a reply, the agent's prompt).
 *  The text area inside takes `bareArea`: no box of its own. */
export const boxClass = "overflow-hidden rounded-lg bg-panel shadow-input transition-shadow duration-[var(--duration-fast)] focus-within:shadow-focus";
export const bareArea = "block w-full resize-none bg-transparent px-3 py-2.5 text-[13px] text-ink outline-none placeholder:text-faint disabled:text-muted";

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
      <div className="grid grid-cols-1 items-center gap-1.5 sm:grid-cols-[160px_1fr] sm:gap-3">
        <span className="text-[12.5px] font-medium text-body">{label}</span>
        <div className="min-w-0">{children}</div>
      </div>
    );
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex min-h-5 items-center gap-2">
        <span className="flex-1 text-[12.5px] font-medium text-body">{label}</span>
        {aside}
      </div>
      {children}
    </div>
  );
}

/** An on/off switch: a pill with a thumb, yellow when on. */
export function Switch({ on, label, disabled, onChange }: { on: boolean; label: string; disabled?: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} disabled={disabled} onClick={() => onChange(!on)} className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-[var(--duration-normal)] disabled:cursor-not-allowed disabled:opacity-45 ${on ? "bg-signal" : "bg-line-strong"}`}>
      <span className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-chip transition-transform duration-[var(--duration-normal)] ease-[var(--ease-spring)] ${on ? "translate-x-4" : ""}`} />
    </button>
  );
}

/** A checkbox, one size and the yellow. It can show "some picked" with `indeterminate`. */
export function Checkbox({ checked, indeterminate = false, onChange, label, disabled, className = "" }: { checked: boolean; indeterminate?: boolean; onChange: (v: boolean) => void; label?: string; disabled?: boolean; className?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate && !checked;
  }, [indeterminate, checked]);
  return <input ref={ref} type="checkbox" aria-label={label} checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} onClick={(e) => e.stopPropagation()} className={`size-4 shrink-0 cursor-pointer accent-signal disabled:cursor-not-allowed ${className}`} />;
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

/** A label, a value to copy in a quiet well, and the copy button: an address, a key, a command. Sits in `Rows`. */
export function CopyField({ label, value, copyLabel }: { label: string; value: string; copyLabel?: string }) {
  return (
    <div className="flex min-h-12 flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2">
      <span className="w-24 shrink-0 text-[12px] text-muted">{label}</span>
      <code className="min-w-[12rem] flex-1 rounded-sm bg-paper px-2.5 py-1.5 font-mono text-[12px] wrap-anywhere shadow-track">{value}</code>
      <CopyButton text={value} label={copyLabel ?? `Copy ${label}`} />
    </div>
  );
}
