"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { nextDepth } from "./Floating";
import { Check, ChevronsUpDown } from "./Icons";

/** `hint` shows on the right of the menu row (a count); `dot` is a status color drawn before the label. */
export type Option<T extends string | number> = { value: T; label: string; hint?: string; dot?: string; icon?: React.ReactNode };

/**
 * The app's own dropdown, so menus look the same on every computer. The button has the input look (or a pill with
 * `size="sm"`, for filters); `className` sets its width (full by default). The menu opens in a layer above the page,
 * so tables and scrolling panels never cut it off.
 */
export function Select<T extends string | number>({
  value,
  options,
  onChange,
  className = "",
  ariaLabel,
  placeholder = "Choose…",
  autoOpen = false,
  onClose,
  disabled = false,
  lead,
  size = "md",
}: {
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
  className?: string;
  ariaLabel?: string;
  placeholder?: string;
  autoOpen?: boolean;
  onClose?: () => void;
  disabled?: boolean;
  /** A gray word before the value in the button, for filters: "Status All". */
  lead?: string;
  /** `sm`: a 32px pill on a soft ring, for filter bars. */
  size?: "sm" | "md";
}) {
  const [open, setOpen] = useState(autoOpen);
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<{ left: number; top: number; width: number; up: boolean } | null>(null);
  const [depth] = useState(nextDepth);
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLUListElement>(null);
  const current = options.find((o) => o.value === value);

  const close = (focus = true) => {
    setOpen(false);
    onClose?.();
    if (focus) button.current?.focus();
  };

  useLayoutEffect(() => {
    if (!open || !button.current) return;
    const place = () => {
      const r = button.current!.getBoundingClientRect();
      const height = Math.min(280, options.length * 32 + 12);
      const up = r.bottom + height + 8 > window.innerHeight && r.top > height + 8;
      setPos({ left: r.left, top: up ? r.top - height - 4 : r.bottom + 4, width: Math.max(r.width, 160), up });
    };
    place();
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, options, value]);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (!menu.current?.contains(e.target as Node) && !button.current?.contains(e.target as Node)) close(false);
    };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  });

  useEffect(() => {
    if (open) menu.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const pickAt = (i: number) => {
    const o = options[i];
    if (!o) return;
    close();
    if (o.value !== value) onChange(o.value);
  };

  return (
    <>
      <button
        ref={button}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        autoFocus={autoOpen}
        onClick={() => (open ? close() : setOpen(true))}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            setOpen(true);
          } else if (open) {
            if (e.key === "Escape" || e.key === "Tab") {
              // The picker takes Escape, so a dialog under it stays open.
              if (e.key === "Escape") e.preventDefault();
              close(e.key === "Escape");
            }
            else if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(options.length - 1, a + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(0, a - 1));
            } else if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              pickAt(active);
            }
          }
        }}
        className={`inline-flex min-w-0 items-center justify-between gap-2 bg-panel text-left text-[13px] text-ink outline-none transition-shadow duration-[var(--duration-fast)] focus-visible:shadow-focus disabled:pointer-events-none disabled:bg-paper disabled:text-muted disabled:shadow-none ${size === "sm" ? "h-8 rounded-full px-3 text-[12.5px] shadow-chip hover:shadow-pill" : "h-9 rounded-md px-3 shadow-input hover:shadow-input-hover"} aria-expanded:shadow-focus ${className || "w-full"}`}
      >
        <span className={`flex min-w-0 items-center gap-1.5 truncate ${current ? "" : "text-faint"}`}>
          {lead ? <span className="font-normal text-muted">{lead}</span> : null}
          {current?.icon ? <span className="flex shrink-0">{current.icon}</span> : null}
          <span className="truncate">{current?.label ?? placeholder}</span>
        </span>
        <ChevronsUpDown size={13} className="shrink-0 text-faint" />
      </button>
      {open && pos
        ? createPortal(
            <ul
              ref={menu}
              data-floating={depth}
              role="listbox"
              aria-label={ariaLabel}
              style={{ position: "fixed", left: pos.left, top: pos.top, minWidth: pos.width, maxHeight: 280 }}
              className="z-[100] overflow-y-auto rounded-lg bg-panel p-1.5 text-[13px] shadow-menu"
            >
              {options.map((o, i) => (
                <li
                  key={String(o.value)}
                  data-i={i}
                  role="option"
                  aria-selected={o.value === value}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pickAt(i)}
                  className={`flex h-8 cursor-pointer items-center gap-2 rounded-sm px-2.5 whitespace-nowrap ${i === active ? "bg-hover" : ""} ${o.value === value ? "font-medium" : ""}`}
                >
                  {o.dot ? <span className="size-2 shrink-0 rounded-full" style={{ background: o.dot }} /> : null}
                  {o.icon ? <span className="flex shrink-0">{o.icon}</span> : null}
                  <span className="flex-1">{o.label}</span>
                  {o.hint ? <span className="font-mono text-[11px] text-faint tabular-nums">{o.hint}</span> : null}
                  {o.value === value ? <Check size={13} className="shrink-0 text-ink" /> : <span className="w-[13px] shrink-0" />}
                </li>
              ))}
            </ul>,
            document.body,
          )
        : null}
    </>
  );
}

/**
 * A dropdown that picks several: checkbox rows (with icons), and Select all or Clear on top. The button shows the
 * pick ("3 channels", or the one name). For lists that can grow, instead of a row of chips.
 */
export function MultiSelect<T extends string>({
  values,
  options,
  onChange,
  noun,
  ariaLabel,
  placeholder = "Choose…",
  disabled = false,
  className = "",
  allowAll = true,
  canPick,
}: {
  values: T[];
  options: Option<T>[];
  onChange: (v: T[]) => void;
  /** What one item is called, for "3 channels". */
  noun: [string, string];
  ariaLabel: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  allowAll?: boolean;
  /** Rows that can't be picked right now (another brand's channels), with why. */
  canPick?: (v: T) => string | null;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; width: number } | null>(null);
  const [depth] = useState(nextDepth);
  const [q, setQ] = useState("");
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const picked = options.filter((o) => values.includes(o.value));
  const shown = q.trim() ? options.filter((o) => o.label.toLowerCase().includes(q.trim().toLowerCase())) : options;
  const free = options.filter((o) => !canPick?.(o.value));

  useLayoutEffect(() => {
    if (!open || !button.current) return;
    const place = () => {
      const r = button.current!.getBoundingClientRect();
      const height = Math.min(360, options.length * 36 + 100);
      const up = r.bottom + height + 8 > window.innerHeight && r.top > height + 8;
      setPos({ left: r.left, top: up ? r.top - height - 4 : r.bottom + 4, width: Math.max(r.width, 260) });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, options.length]);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (!menu.current?.contains(e.target as Node) && !button.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc, true);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc, true);
    };
  });

  const flip = (v: T) => onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  const label = picked.length === 0 ? placeholder : picked.length === 1 ? picked[0].label : `${picked.length} ${noun[1]}`;

  return (
    <>
      <button
        ref={button}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={`inline-flex h-10 min-w-0 items-center justify-between gap-2 rounded-md bg-panel px-3 text-left text-[13px] text-ink shadow-input outline-none transition-shadow duration-[var(--duration-fast)] hover:shadow-input-hover focus-visible:shadow-focus disabled:pointer-events-none disabled:bg-paper disabled:text-muted aria-expanded:shadow-focus ${className || "w-full"}`}
      >
        <span className={`flex min-w-0 items-center gap-2 ${picked.length ? "" : "text-faint"}`}>
          {picked.slice(0, 5).map((o) => (o.icon ? <span key={String(o.value)} className="flex shrink-0">{o.icon}</span> : null))}
          <span className="truncate">{label}</span>
        </span>
        <ChevronsUpDown size={13} className="shrink-0 text-faint" />
      </button>
      {open && pos
        ? createPortal(
            <div ref={menu} data-floating={depth} role="listbox" aria-multiselectable aria-label={ariaLabel} style={{ position: "fixed", left: pos.left, top: pos.top, minWidth: pos.width, maxHeight: 360 }} className="z-[100] flex flex-col rounded-lg bg-panel p-1.5 text-[13px] shadow-menu">
              {options.length > 8 ? <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" aria-label="Search" className="mb-1 h-8 w-full shrink-0 rounded-sm bg-paper px-2.5 text-[13px] outline-none placeholder:text-faint focus:shadow-focus" /> : null}
              {allowAll && free.length > 1 ? (
                <div className="flex shrink-0 justify-between px-1 pb-1">
                  <button type="button" className="h-7 rounded-sm px-1.5 text-[12px] font-medium text-muted hover:bg-hover hover:text-ink" onClick={() => onChange([...new Set([...values, ...free.map((o) => o.value)])])}>
                    Select all
                  </button>
                  {values.length ? (
                    <button type="button" className="h-7 rounded-sm px-1.5 text-[12px] font-medium text-muted hover:bg-hover hover:text-ink" onClick={() => onChange([])}>
                      Clear
                    </button>
                  ) : null}
                </div>
              ) : null}
              <div className="min-h-0 overflow-y-auto">
                {shown.map((o) => {
                  const why = canPick?.(o.value) ?? null;
                  const on = values.includes(o.value);
                  return (
                    <button
                      key={String(o.value)}
                      type="button"
                      role="option"
                      aria-selected={on}
                      disabled={!!why && !on}
                      title={why ?? undefined}
                      onClick={() => flip(o.value)}
                      className="flex h-9 w-full items-center gap-2.5 rounded-sm px-2 text-left hover:bg-hover disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className={`flex size-4 shrink-0 items-center justify-center rounded-[4px] ${on ? "bg-signal text-on-signal" : "shadow-input"}`}>{on ? <Check size={11} /> : null}</span>
                      {o.icon ? <span className="flex shrink-0">{o.icon}</span> : null}
                      <span className="min-w-0 flex-1 truncate">{o.label}</span>
                      {o.hint ? <span className="text-[11px] text-faint">{o.hint}</span> : null}
                    </button>
                  );
                })}
                {!shown.length ? <p className="px-2.5 py-2 text-[12px] text-muted">No matches</p> : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
