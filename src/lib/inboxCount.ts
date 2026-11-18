// The sidebar's inbox badge, updated from the inbox screen without re-rendering the page: Done and reply answer with the
// new open count (src/app/(app)/inbox/actions.ts), the screen announces it, and the badge (Count in Sidebar) shows it.

const EVENT = "capybaroar:inbox-count";

export function announceInboxCount(open: number | undefined) {
  if (typeof open === "number" && typeof window !== "undefined") window.dispatchEvent(new CustomEvent<number>(EVENT, { detail: open }));
}

/** Calls `on` with each new count; returns the function that stops listening. */
export function onInboxCount(on: (open: number) => void): () => void {
  const listen = (e: Event) => {
    const n = (e as CustomEvent<number>).detail;
    if (typeof n === "number") on(n);
  };
  window.addEventListener(EVENT, listen);
  return () => window.removeEventListener(EVENT, listen);
}
