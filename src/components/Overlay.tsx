"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { dialogIn, fadeIn, sheetIn } from "@/lib/motion";
import { X } from "./Icons";
import { IconButton } from "./ui";

// The app's one Modal and one Sheet. Both close on Escape and the X, keep the keyboard inside while they cover the
// page, and hand focus back to where it was when they close. Only the top one answers Escape, so a modal opened from
// a sheet closes first.

const stack: symbol[] = [];
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

function useOverlay(box: React.RefObject<HTMLElement | null>, on: boolean, onClose: () => void, trap: boolean) {
  const close = useRef(onClose);
  useLayoutEffect(() => {
    close.current = onClose;
  });
  useEffect(() => {
    if (!on) return;
    const me = Symbol();
    stack.push(me);
    const node = box.current;
    const before = document.activeElement as HTMLElement | null;
    // Children with autoFocus have taken focus by now; otherwise the box takes it, so Tab starts inside.
    if (trap && box.current && !box.current.contains(document.activeElement)) box.current.focus({ preventScroll: true });
    const key = (e: KeyboardEvent) => {
      if (stack[stack.length - 1] !== me || e.defaultPrevented) return;
      const t = e.target as HTMLElement | null;
      // A question asked from inside it (askConfirm) answers its own keys.
      if (t && box.current && !box.current.contains(t) && t.closest?.("[role=dialog]")) return;
      if (e.key === "Escape") {
        // An open menu or picker on top closes first.
        if (t?.closest?.("[role=listbox], [role=menu]") || document.querySelector('[data-floating]:not([role="tooltip"])')) return;
        e.preventDefault();
        close.current();
      } else if (e.key === "Tab" && trap && box.current) {
        const all = [...box.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
        if (!all.length) return;
        const first = all[0];
        const last = all[all.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === box.current)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      stack.splice(stack.indexOf(me), 1);
      const now = document.activeElement;
      if (before?.isConnected && (!now || now === document.body || node?.contains(now))) before.focus({ preventScroll: true });
    };
  }, [on, trap, box]);
}

/** A dialog: a title and close in the header, the body, and buttons in the footer when given. */
export function Modal({ title, onClose, children, footer, wide = false }: { title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode; wide?: boolean }) {
  const layer = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    void fadeIn(layer.current);
    void dialogIn(card.current);
  }, []);
  useOverlay(card, true, onClose, true);
  return (
    <div ref={layer} className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-scrim px-4 pt-[10vh] pb-6" onMouseDown={onClose}>
      <div
        ref={card}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
        className={`w-full overflow-hidden rounded-2xl border border-frame bg-panel shadow-modal outline-none ${wide ? "max-w-2xl" : "max-w-md"}`}
      >
        <div className="flex h-12 items-center border-b border-line pr-2 pl-5">
          <h2 className="flex-1 truncate text-[15px] font-medium">{title}</h2>
          <IconButton label="Close" align="end" onClick={onClose}>
            <X size={15} />
          </IconButton>
        </div>
        <div className="space-y-3 px-5 py-4">{children}</div>
        {footer ? <div className="flex justify-end gap-2 border-t border-line bg-canvas px-5 py-3">{footer}</div> : null}
      </div>
    </div>
  );
}

/**
 * A side panel, 480px or 640px (`wide`). On wide screens it sits in the layout, or over the content when `over`; on
 * phones it's a bottom sheet over the page. With a `title` it draws its own header and close button.
 */
export function Sheet({ open, onClose, side = "right", label, title, over = false, wide = false, peek = false, children }: { open: boolean; onClose: () => void; side?: "left" | "right"; label: string; title?: React.ReactNode; over?: boolean; wide?: boolean; peek?: boolean; children: React.ReactNode }) {
  const panel = useRef<HTMLElement>(null);
  // It slides in from its edge when it opens (brand motion, 320ms).
  useLayoutEffect(() => {
    if (open) void sheetIn(panel.current, side);
  }, [open, side]);
  // A `peek` sheet floats over a list without dimming it, so another row can be clicked to swap what it shows.
  useOverlay(panel, open, onClose, over && !peek);
  if (!open) return null;
  return (
    <>
      <div className={`fixed inset-0 z-40 bg-scrim ${over && !peek ? "" : "lg:hidden"}`} onMouseDown={onClose} aria-hidden />
      <aside
        ref={panel}
        aria-label={label}
        role={over ? "dialog" : undefined}
        aria-modal={(over && !peek) || undefined}
        tabIndex={-1}
        className={`fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] w-full flex-col rounded-t-2xl border-t border-frame bg-panel shadow-pop outline-none md:inset-x-auto md:inset-y-0 md:max-h-none md:max-w-[92vw] md:rounded-none md:border-t-0 ${wide ? "md:w-[640px]" : "md:w-[480px]"} ${side === "right" ? "md:right-0 md:border-l" : "md:left-0 md:border-r"} ${over ? "" : "lg:static lg:z-auto lg:max-w-none lg:shadow-none"}`}
      >
        {title ? (
          <div className="flex h-12 shrink-0 items-center border-b border-line pr-2 pl-4">
            <h2 className="min-w-0 flex-1 truncate text-[13px] font-medium">{title}</h2>
            <IconButton label="Close" align="end" onClick={onClose}>
              <X size={15} />
            </IconButton>
          </div>
        ) : null}
        {children}
      </aside>
    </>
  );
}
