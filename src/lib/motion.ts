// Motion on the brand's tokens (`--duration-*` and `--ease-*` in globals.css), played with the Web Animations API, so
// a part can move in and out without new CSS. Only transform and opacity move, as docs/brand.md asks, and nothing
// moves when someone has asked their computer to reduce motion.

const token = (name: string, fallback: string) => (typeof document === "undefined" ? fallback : getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback);
const ms = (v: string) => (v.endsWith("ms") ? parseFloat(v) : parseFloat(v) * 1000);

/** The three speeds: small things, normal things, panels and dialogs. */
export const speed = {
  instant: () => ms(token("--duration-instant", "120ms")),
  fast: () => ms(token("--duration-fast", "200ms")),
  normal: () => ms(token("--duration-normal", "320ms")),
};
export const ease = { out: () => token("--ease-out", "cubic-bezier(0.2, 0.8, 0.2, 1)") };

export const still = () => typeof window === "undefined" || !("animate" in Element.prototype) || window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Plays frames on an element. Resolves when done, at once when motion is reduced or the element is gone. */
export function play(el: Element | null | undefined, frames: Keyframe[], duration: number, leaving = false): Promise<void> {
  if (!el || still()) return Promise.resolve();
  return el
    .animate(frames, { duration, easing: ease.out(), fill: leaving ? "forwards" : "backwards" })
    .finished.then(
      () => {},
      () => {},
    );
}

/** A menu, picker or tooltip appears: a fade and a 2px move from the side it opens on. */
export const popIn = (el: Element | null | undefined, from: "above" | "below" | "side" = "below") =>
  play(el, [{ opacity: 0, transform: from === "side" ? "translateX(-2px)" : `translateY(${from === "below" ? -2 : 2}px)` }, { opacity: 1, transform: "none" }], speed.instant());

/** A dialog appears: it fades and grows from 98%. */
export const dialogIn = (el: Element | null | undefined) => play(el, [{ opacity: 0, transform: "scale(0.98)" }, { opacity: 1, transform: "none" }], speed.fast());
/** A dialog leaves, quicker than it came. */
export const dialogOut = (el: Element | null | undefined) => play(el, [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "scale(0.98)" }], speed.instant(), true);

/** The dim layer behind a dialog or sheet. */
export const fadeIn = (el: Element | null | undefined) => play(el, [{ opacity: 0 }, { opacity: 1 }], speed.fast());
export const fadeOut = (el: Element | null | undefined) => play(el, [{ opacity: 1 }, { opacity: 0 }], speed.instant(), true);

/** A side sheet slides in from its edge; on a phone, where it's a bottom sheet, it rises from the bottom. */
export const sheetIn = (el: Element | null | undefined, side: "left" | "right" = "right") => {
  const phone = typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
  const from = phone ? "translateY(24px)" : `translateX(${side === "right" ? 16 : -16}px)`;
  return play(el, [{ opacity: 0, transform: from }, { opacity: 1, transform: "none" }], speed.normal());
};
