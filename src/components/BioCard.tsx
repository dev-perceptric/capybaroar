import { Mail, Play } from "lucide-react";
import { themeOf, themeVars } from "@/lib/bioThemes";
import type { BioView, ViewBlock } from "@/lib/bioBlocks";
import { SocialIcon } from "./BioIcons";
import { Logo } from "./Logo";

// The link-in-bio page itself: one column, phone first. Drawn by the public page (/b/<slug>) and by the editor's
// preview from the same view, so the preview is the page. Its colors come from the page's theme (src/lib/bioThemes.ts)
// as CSS variables, not from the app's tokens. No script runs on it. Blocks rise in one after another (bio-rise in
// globals.css), unless the visitor asked for less motion.

const SHAPES = { pill: "rounded-full", rounded: "rounded-xl", square: "rounded-none" } as const;
const CARDS = { pill: "rounded-2xl", rounded: "rounded-xl", square: "rounded-none" } as const;
const PICS = { pill: "rounded-full", rounded: "rounded-md", square: "rounded-none" } as const;
/** A button's fill and text color, by style. Solid buttons use the button ink; the rest sit on the page. */
const FILLS: Record<string, string> = {
  solid: "bg-[var(--bio-surface)] text-[var(--bio-btn-ink)] shadow-[var(--bio-shadow)]",
  outline: "bg-transparent text-[var(--bio-ink)] shadow-[inset_0_0_0_1.5px_var(--bio-ink)]",
  hard: "bg-[var(--bio-surface)] text-[var(--bio-btn-ink)] shadow-[inset_0_0_0_2px_var(--bio-ink),4px_4px_0_var(--bio-ink)]",
  glass: "bg-[var(--bio-glass)] text-[var(--bio-ink)] shadow-[inset_0_0_0_1px_var(--bio-glass-line),0_8px_24px_-12px_rgba(0,0,0,.35)] backdrop-blur-md",
};

export function BioCard({ view, frame = false }: { view: BioView; frame?: boolean }) {
  const a = view.appearance;
  const large = a.size === "large";
  const fill = FILLS[a.fill] ?? FILLS.solid;
  const press = `transition-[box-shadow,transform,opacity,background-color] duration-[var(--duration-fast)] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--bio-ink)] ${a.fill === "hard" ? "hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--bio-ink)]" : a.fill === "glass" ? "hover:bg-[var(--bio-hover)]" : "hover:opacity-90"}`;
  const button = `${SHAPES[a.shape]} ${fill} ${press} flex w-full items-center gap-3 px-2 ${large ? "min-h-14 py-2.5 text-[16px]" : "min-h-12 py-2 text-[14px]"}`;
  const card = `${CARDS[a.shape]} ${fill} ${press}`;
  const Main = frame ? "div" : "main";
  const theme = themeOf(a.theme);
  return (
    <div style={themeVars(theme, a.font)} className={`flex justify-center bg-fixed text-[var(--bio-ink)] ${frame ? "min-h-full px-4 py-8" : "min-h-dvh px-4 py-10 sm:py-16"}`}>
      {/* On its own the page paints the whole window, so scrolling past an edge shows the theme, not the app's gray. */}
      {frame ? null : <style>{`html,body{background:${theme.base}}`}</style>}
      <Main className="flex w-full max-w-[480px] flex-col items-center">
        {view.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={view.avatar} alt="" width={96} height={96} className={`bio-rise rounded-full bg-[var(--bio-surface)] object-cover shadow-[0_0_0_4px_var(--bio-surface),0_10px_30px_-10px_rgba(0,0,0,.35)] ${large ? "size-[112px]" : "size-24"}`} />
        ) : null}
        {view.title ? <h1 style={{ "--d": "60ms" } as React.CSSProperties} className={`bio-rise mt-5 text-center leading-tight font-bold tracking-[-0.025em] text-balance ${large ? "text-[30px]" : "text-[24px]"}`}>{view.title}</h1> : null}
        {view.bio ? <p style={{ "--d": "120ms" } as React.CSSProperties} className={`bio-rise mt-2 max-w-[400px] text-center leading-relaxed whitespace-pre-line text-[var(--bio-muted)] ${large ? "text-[16px]" : "text-[14px]"}`}>{view.bio}</p> : null}
        {view.blocks.length ? (
          <div className="mt-7 flex w-full flex-col gap-3">
            {view.blocks.map((b, i) => (
              <div key={b.id} className="bio-rise" style={{ "--d": `${180 + Math.min(i, 10) * 60}ms` } as React.CSSProperties}>
                <Block b={b} button={button} card={card} pic={PICS[a.shape]} large={large} />
              </div>
            ))}
          </div>
        ) : null}
        {view.badge ? (
          <a href="https://capybaroar.com/?ref=bio" className="mt-12 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] text-[var(--bio-muted)] transition-colors hover:bg-[var(--bio-hover)] hover:text-[var(--bio-ink)]">
            <Logo variant="icon" small title="" className="size-4" />
            Made with Capybaroar
          </a>
        ) : null}
      </Main>
    </div>
  );
}

/** A link's row: a picture on the left when it has one, the label in the middle. */
function Label({ text, lead, large }: { text: string; lead: React.ReactNode; large: boolean }) {
  const side = large ? "w-11" : "w-9";
  return (
    <>
      <span className={`flex shrink-0 items-center justify-center ${side}`}>{lead}</span>
      <span className="min-w-0 flex-1 text-center leading-snug font-medium text-balance">{text}</span>
      <span className={`shrink-0 ${side}`} aria-hidden="true" />
    </>
  );
}

function Block({ b, button, card, pic, large }: { b: ViewBlock; button: string; card: string; pic: string; large: boolean }) {
  const thumb = `${large ? "size-11" : "size-9"} ${pic}`;
  switch (b.type) {
    case "link":
      return (
        <a href={b.href} rel="noopener" className={button}>
          <Label
            large={large}
            text={b.label}
            lead={
              b.thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.thumb} alt="" loading="lazy" decoding="async" className={`${thumb} object-cover`} />
              ) : null
            }
          />
        </a>
      );
    case "email":
      return (
        <a href={b.href} className={button}>
          <Label large={large} text={b.label} lead={<Mail size={large ? 20 : 18} aria-hidden="true" />} />
        </a>
      );
    case "header":
      return <h2 className={`mt-4 text-center font-semibold tracking-[-0.01em] text-balance ${large ? "text-[18px]" : "text-[15px]"}`}>{b.text}</h2>;
    case "text":
      return <p className={`text-center leading-relaxed whitespace-pre-line text-[var(--bio-muted)] ${large ? "text-[16px]" : "text-[14px]"}`}>{b.text}</p>;
    case "social":
      return (
        <nav aria-label="Social" className="flex flex-wrap justify-center gap-1">
          {b.items.map((it) => (
            <a key={it.network} href={it.href} rel="noopener me" aria-label={it.name} title={it.name} className="flex size-11 items-center justify-center rounded-full transition-colors hover:bg-[var(--bio-hover)] focus-visible:outline-2 focus-visible:outline-[var(--bio-ink)]">
              <SocialIcon id={it.network} size={large ? 24 : 22} />
            </a>
          ))}
        </nav>
      );
    case "posts":
      return (
        <section aria-label="Latest posts" className="mt-1 grid grid-cols-3 gap-1.5">
          {b.posts.map((p, i) => (
            <a key={`${i}:${p.href}`} href={p.href} rel="noopener" className="block aspect-square overflow-hidden rounded-md bg-[var(--bio-surface)] text-[var(--bio-btn-ink)] transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--bio-ink)]">
              {p.thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.thumb} alt={p.alt} loading="lazy" decoding="async" className="size-full object-cover" />
              ) : (
                <span className="line-clamp-5 p-2 text-[11px] leading-snug">{p.alt}</span>
              )}
            </a>
          ))}
        </section>
      );
    case "video":
      return (
        <a href={b.href} rel="noopener" className={`${card} block overflow-hidden`}>
          <span className="relative block aspect-video overflow-hidden bg-[var(--bio-hover)]">
            {b.thumb ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={b.thumb} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" className="size-full object-cover" />
            ) : null}
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-[var(--bio-surface)] text-[var(--bio-btn-ink)] shadow-[var(--bio-shadow)]">
                <Play size={20} fill="currentColor" aria-hidden="true" className="translate-x-px" />
              </span>
            </span>
          </span>
          <span className={`flex items-center gap-2.5 px-4 py-3 ${large ? "text-[16px]" : "text-[14px]"}`}>
            <SocialIcon id={b.source} size={16} />
            <span className="min-w-0 flex-1 truncate font-medium">{b.label}</span>
          </span>
        </a>
      );
  }
}
