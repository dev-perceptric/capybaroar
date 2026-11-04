import { EDGE, SMALL, STACKED, TILE, WAVE, WORDMARK, type Mark } from "./logoMarks";

// Capybaroar's logo, drawn from outlined paths (brand/, made from Fredoka by brand/src/build.py): "capyba" in ink,
// "roar" in yellow with a thin ink edge, and two sound waves. The wordmark goes where there's room, the stacked
// square in small square spaces, the icon on a rounded ink tile. `small` swaps the icon's words for the yellow o and
// its waves, which still reads at 16 to 32px. Tones: light for white and gray, dark for ink and photos.

type Props = {
  variant?: "wordmark" | "stacked" | "icon";
  tone?: "light" | "dark";
  small?: boolean;
  className?: string;
  /** The accessible name; pass "" when a label next to it already says Capybaroar. */
  title?: string;
};

function Paths({ mark, tone }: { mark: Mark; tone: "light" | "dark" }) {
  return (
    <>
      {mark.capyba ? <path className={tone === "dark" ? "fill-white" : "fill-on-signal"} d={mark.capyba} /> : null}
      <path className="fill-none stroke-on-signal" strokeWidth={EDGE} strokeLinejoin="round" d={mark.roar} />
      <path className="fill-none stroke-on-signal" strokeWidth={WAVE + EDGE} strokeLinecap="round" d={mark.waves} />
      <path className="fill-signal" d={mark.roar} />
      <path className="fill-none stroke-signal" strokeWidth={WAVE} strokeLinecap="round" d={mark.waves} />
    </>
  );
}

export function Logo({ variant = "wordmark", tone = "light", small = false, className = "", title = "Capybaroar" }: Props) {
  const a11y = title ? { role: "img", "aria-label": title } : { "aria-hidden": true };
  if (variant === "icon")
    return (
      <svg viewBox="0 0 48 48" className={`shrink-0 ${className}`} {...a11y}>
        <rect width="48" height="48" rx="13" className="fill-on-signal" />
        <g transform={small ? TILE.small : TILE.icon}>
          <Paths mark={small ? SMALL : STACKED} tone="dark" />
        </g>
      </svg>
    );
  const mark = variant === "stacked" ? STACKED : WORDMARK;
  return (
    <svg viewBox={mark.viewBox} className={`shrink-0 ${className}`} {...a11y}>
      <Paths mark={mark} tone={tone} />
    </svg>
  );
}
