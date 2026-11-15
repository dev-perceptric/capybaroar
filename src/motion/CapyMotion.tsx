// The CapyMotion scene kit: each scene kind animated in the brand's colors and fonts, with the brand row, the handle
// and a progress line around them. Entrances use springs, exits a short fade; only transform and opacity move.
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { AbsoluteFill, Easing, Img, Sequence, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { FPS, fitSize, type MotionProps, type Scene } from "../lib/capy/motionRules";

type Kit = MotionProps & { u: number; w: number; h: number; tall: boolean; wide: boolean };

/** Loads the brand's fonts from the bundle before the first frame is taken. */
function useFonts(p: MotionProps) {
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    const faces = [
      new FontFace(p.fonts.head, `url(${staticFile(`fonts/${p.fonts.headFile}-latin-${p.fonts.headWeight}-normal.woff2`)})`, { weight: String(p.fonts.headWeight) }),
      ...p.fonts.bodyWeights.map((w) => new FontFace(p.fonts.body, `url(${staticFile(`fonts/${p.fonts.bodyFile}-latin-${w}-normal.woff2`)})`, { weight: String(w) })),
    ];
    Promise.all(faces.map((f) => f.load().then((x) => document.fonts.add(x)).catch(() => undefined))).then(() => continueRender(handle));
  }, [handle, p.fonts]);
}

const ease = Easing.bezier(0.2, 0.8, 0.2, 1);

/** 0 to 1 as a part comes in, from `delay` frames into its scene. */
function useIn(delay = 0, damping = 200) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping, mass: 0.7 } });
}

/** A part that rises and fades in. */
function Rise({ delay = 0, children, style, dist = 40 }: { delay?: number; children: ReactNode; style?: CSSProperties; dist?: number }) {
  const t = useIn(delay);
  return <div style={{ ...style, opacity: t, transform: `translateY(${(1 - t) * dist}px)` }}>{children}</div>;
}

/** Words that come in one after another. */
function Words({ text, delay = 0, style }: { text: string; delay?: number; style: CSSProperties }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ ...style, display: "flex", flexWrap: "wrap", columnGap: "0.24em" }}>
      {text.split(" ").map((w, i) => {
        const t = spring({ frame: frame - delay - i * 2.5, fps, config: { damping: 200, mass: 0.6 } });
        return (
          <span key={i} style={{ display: "inline-block", opacity: t, transform: `translateY(${(1 - t) * 0.5}em)` }}>
            {w}
          </span>
        );
      })}
    </div>
  );
}

const head = (k: Kit, size: number): CSSProperties => ({ fontFamily: `'${k.fonts.head}'`, fontWeight: k.fonts.headWeight, letterSpacing: k.fonts.headLs, lineHeight: 1.04, fontSize: size, color: k.colors.ink });
const body = (k: Kit, size: number, weight = 400): CSSProperties => ({ fontFamily: `'${k.fonts.body}'`, fontWeight: weight, fontSize: size, lineHeight: 1.35, color: k.colors.muted });

function Kicker({ k, text, delay = 0 }: { k: Kit; text: string; delay?: number }) {
  const t = useIn(delay, 14);
  if (!text) return null;
  return (
    <div style={{ alignSelf: "flex-start", transform: `scale(${0.8 + 0.2 * t})`, transformOrigin: "left center", opacity: Math.min(1, t * 1.4), padding: `${12 * k.u}px ${24 * k.u}px`, borderRadius: Math.max(10, k.radius) * k.u, background: k.colors.accent, ...body(k, 32 * k.u, 600), color: k.colors.accentInk, lineHeight: 1 }}>
      {text}
    </div>
  );
}

// Scenes

function Title({ s, k }: { s: Scene; k: Kit }) {
  const bar = useIn(14);
  return (
    <Stack k={k} gap={32}>
      <Kicker k={k} text={s.kicker} />
      <Words text={s.headline} delay={4} style={head(k, fitSize(s.headline, (k.wide ? 132 : 176) * k.u, 84 * k.u, 14))} />
      <div style={{ height: 10 * k.u, width: 180 * k.u, borderRadius: 99, background: k.colors.accent, transform: `scaleX(${bar})`, transformOrigin: "left" }} />
      {s.sub ? (
        <Rise delay={16}>
          <div style={body(k, 44 * k.u)}>{s.sub}</div>
        </Rise>
      ) : null}
    </Stack>
  );
}

function Stat({ s, k }: { s: Scene; k: Kit }) {
  const frame = useCurrentFrame();
  const len = Math.round(s.seconds * FPS);
  const t = interpolate(frame, [4, Math.max(20, len * 0.55)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const v = (s.value * t).toLocaleString("en-US", { minimumFractionDigits: s.decimals, maximumFractionDigits: s.decimals });
  const final = `${s.prefix}${s.value.toLocaleString("en-US", { minimumFractionDigits: s.decimals, maximumFractionDigits: s.decimals })}${s.suffix}`;
  const size = fitSize(final, (k.wide ? 300 : 340) * k.u, 150 * k.u, 4);
  return (
    <Stack k={k} gap={28}>
      <Kicker k={k} text={s.kicker} />
      <Rise delay={2} dist={60}>
        <div style={{ ...head(k, size), color: k.colors.accentText, lineHeight: 0.9, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
          {s.prefix}
          {v}
          <span style={{ fontSize: "0.55em", marginLeft: "0.04em" }}>{s.suffix}</span>
        </div>
      </Rise>
      {s.headline ? <Words text={s.headline} delay={12} style={head(k, fitSize(s.headline, 84 * k.u, 52 * k.u, 22))} /> : null}
      {s.sub ? (
        <Rise delay={22}>
          <div style={body(k, 30 * k.u)}>{s.sub}</div>
        </Rise>
      ) : null}
    </Stack>
  );
}

function Bars({ s, k }: { s: Scene; k: Kit }) {
  const frame = useCurrentFrame();
  const max = Math.max(...s.values, 1);
  const top = s.values.indexOf(max);
  return (
    <Stack k={k} gap={44}>
      <Words text={s.headline} style={head(k, fitSize(s.headline, 112 * k.u, 60 * k.u, 16))} />
      <div style={{ display: "flex", flexDirection: "column", gap: 30 * k.u }}>
        {s.items.map((label, i) => {
          const t = interpolate(frame, [8 + i * 5, 34 + i * 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
          const hot = i === top;
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 10 * k.u, opacity: Math.min(1, t * 3) }}>
              <div style={{ display: "flex", justifyContent: "space-between", ...body(k, 38 * k.u, hot ? 700 : 500), color: hot ? k.colors.ink : k.colors.muted }}>
                <span>{label}</span>
                <span style={{ fontVariantNumeric: "tabular-nums", color: hot ? k.colors.accentText : k.colors.muted }}>{Math.round(s.values[i] * t).toLocaleString("en-US")}</span>
              </div>
              <div style={{ height: 52 * k.u, borderRadius: Math.min(k.radius, 20) * k.u, background: k.colors.surface, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(s.values[i] / max) * 100}%`, transform: `scaleX(${t})`, transformOrigin: "left", borderRadius: Math.min(k.radius, 20) * k.u, background: hot ? k.colors.accent : k.colors.line }} />
              </div>
            </div>
          );
        })}
      </div>
    </Stack>
  );
}

function Check({ k, t }: { k: Kit; t: number }) {
  const d = 64 * k.u;
  return (
    <div style={{ width: d, height: d, flexShrink: 0, borderRadius: "50%", background: k.colors.accent, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${t})` }}>
      <svg width={d * 0.55} height={d * 0.55} viewBox="0 0 24 24">
        <path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke={k.colors.accentInk} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={24} strokeDashoffset={24 * (1 - t)} />
      </svg>
    </div>
  );
}

function ListScene({ s, k }: { s: Scene; k: Kit }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Stack k={k} gap={44}>
      <Words text={s.headline} style={head(k, fitSize(s.headline, 112 * k.u, 60 * k.u, 16))} />
      <div style={{ display: "flex", flexDirection: "column", gap: 30 * k.u }}>
        {s.items.map((item, i) => {
          const t = spring({ frame: frame - 10 - i * 9, fps, config: { damping: 14, mass: 0.6 } });
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 26 * k.u, padding: `${22 * k.u}px ${28 * k.u}px`, borderRadius: k.radius * k.u, background: k.colors.surface, opacity: Math.min(1, t * 1.5), transform: `translateX(${(1 - Math.min(1, t)) * 60}px)` }}>
              <Check k={k} t={Math.min(1, t)} />
              <span style={{ ...body(k, 46 * k.u, 600), color: k.colors.ink, lineHeight: 1.2 }}>{item}</span>
            </div>
          );
        })}
      </div>
    </Stack>
  );
}

function Quote({ s, k }: { s: Scene; k: Kit }) {
  const mark = useIn(0, 12);
  return (
    <Stack k={k} gap={40}>
      <svg width={120 * k.u} height={90 * k.u} viewBox="0 0 64 48" style={{ transform: `scale(${mark})`, transformOrigin: "left bottom" }}>
        <path d="M0 48V28C0 12 8 2 26 0l2 8C18 11 14 17 14 24h12v24zm36 0V28C36 12 44 2 62 0l2 8c-10 3-14 9-14 16h12v24z" fill={k.colors.accent} />
      </svg>
      <Words text={s.headline} delay={6} style={{ ...head(k, fitSize(s.headline, 96 * k.u, 56 * k.u, 30)), lineHeight: 1.14 }} />
      {s.name ? (
        <Rise delay={24}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 * k.u }}>
            <div style={{ width: 60 * k.u, height: 4 * k.u, background: k.colors.accent, borderRadius: 4 }} />
            <span style={body(k, 34 * k.u, 600)}>{s.name}</span>
          </div>
        </Rise>
      ) : null}
    </Stack>
  );
}

function Compare({ s, k }: { s: Scene; k: Kit }) {
  const side = (label: string, items: string[], good: boolean, delay: number) => (
    <Rise delay={delay} style={{ flex: 1, minWidth: 0 }}>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: 20 * k.u, padding: 36 * k.u, borderRadius: k.radius * k.u, background: good ? k.colors.accent : k.colors.surface }}>
        <div style={{ ...body(k, 28 * k.u, 700), letterSpacing: "0.06em", textTransform: "uppercase", color: good ? k.colors.accentInk : k.colors.muted }}>{label || (good ? "New" : "Old")}</div>
        {items.map((x, i) => (
          <div key={i} style={{ ...body(k, 46 * k.u, good ? 700 : 500), lineHeight: 1.2, color: good ? k.colors.accentInk : k.colors.muted, textDecoration: good ? "none" : "line-through", textDecorationThickness: 3 }}>
            {x}
          </div>
        ))}
      </div>
    </Rise>
  );
  return (
    <Stack k={k} gap={40}>
      <Words text={s.headline} style={head(k, fitSize(s.headline, 108 * k.u, 58 * k.u, 16))} />
      <div style={{ display: "flex", flexDirection: k.tall ? "column" : "row", gap: 20 * k.u }}>
        {side(s.leftLabel, s.items, false, 8)}
        {side(s.rightLabel, s.right, true, 22)}
      </div>
    </Stack>
  );
}

function Photo({ s, k }: { s: Scene; k: Kit }) {
  const frame = useCurrentFrame();
  const len = Math.round(s.seconds * FPS);
  const zoom = interpolate(frame, [0, len], [1.02, 1.14]);
  return (
    <AbsoluteFill>
      {k.photo ? <Img src={k.photo} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom})` }} /> : null}
      {s.headline ? (
        <div style={{ position: "absolute", left: 72 * k.u, right: 72 * k.u, bottom: 150 * k.u }}>
          <Rise delay={8}>
            <div style={{ padding: `${32 * k.u}px ${40 * k.u}px`, borderRadius: k.radius * k.u, background: k.colors.bg }}>
              <div style={head(k, fitSize(s.headline, 72 * k.u, 46 * k.u, 18))}>{s.headline}</div>
            </div>
          </Rise>
        </div>
      ) : null}
    </AbsoluteFill>
  );
}

function Cta({ s, k }: { s: Scene; k: Kit }) {
  const frame = useCurrentFrame();
  const pop = useIn(14, 10);
  const pulse = 1 + 0.03 * Math.sin(Math.max(0, frame - 30) / 6);
  return (
    <Stack k={k} gap={44} center>
      <Rise>
        {k.logo ? <Img src={k.logo} style={{ height: 120 * k.u, width: "auto", maxWidth: 520 * k.u, objectFit: "contain" }} /> : <div style={head(k, 64 * k.u)}>{k.brandName}</div>}
      </Rise>
      <Words text={s.headline} delay={6} style={{ ...head(k, fitSize(s.headline, 120 * k.u, 64 * k.u, 16)), justifyContent: "center", textAlign: "center" }} />
      {s.button ? (
        <div style={{ transform: `scale(${pop * pulse})`, padding: `${30 * k.u}px ${56 * k.u}px`, borderRadius: Math.max(14, k.radius) * k.u, background: k.colors.accent, ...body(k, 44 * k.u, 700), color: k.colors.accentInk, lineHeight: 1 }}>{s.button}</div>
      ) : null}
      {s.sub ? (
        <Rise delay={24}>
          <div style={body(k, 34 * k.u, 500)}>{s.sub}</div>
        </Rise>
      ) : null}
    </Stack>
  );
}

function Stack({ k, children, gap, center = false }: { k: Kit; children: ReactNode; gap: number; center?: boolean }) {
  return (
    <AbsoluteFill style={{ padding: `${(k.tall ? 260 : 170) * k.u}px ${88 * k.u}px ${(k.tall ? 260 : 150) * k.u}px`, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: center ? "center" : "stretch", textAlign: center ? "center" : "left", gap: gap * k.u }}>
      {children}
    </AbsoluteFill>
  );
}

const SCENES = { title: Title, stat: Stat, bars: Bars, list: ListScene, quote: Quote, compare: Compare, photo: Photo, cta: Cta };

/** A scene with its exit: a short fade and lift over the last frames (none on the last scene). */
function Frame({ s, k, last }: { s: Scene; k: Kit; last: boolean }) {
  const frame = useCurrentFrame();
  const len = Math.round(s.seconds * FPS);
  const out = last ? 1 : interpolate(frame, [len - 8, len], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const S = SCENES[s.kind];
  return (
    <AbsoluteFill style={{ opacity: out, transform: `translateY(${(1 - out) * -30}px)` }}>
      <S s={s} k={k} />
    </AbsoluteFill>
  );
}

function Backdrop({ k }: { k: Kit }) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const drift = frame / Math.max(1, durationInFrames);
  const r = Math.max(k.w, k.h) * 0.55;
  return (
    <AbsoluteFill style={{ background: k.colors.bg, overflow: "hidden" }}>
      <div style={{ position: "absolute", width: r, height: r, borderRadius: "50%", background: k.colors.accent, opacity: 0.09, right: -r * 0.35, top: -r * 0.3, transform: `translate(${-drift * 80}px, ${drift * 60}px)` }} />
      <div style={{ position: "absolute", width: r * 0.7, height: r * 0.7, borderRadius: "50%", background: k.colors.accent2, opacity: 0.07, left: -r * 0.3, bottom: -r * 0.25, transform: `translate(${drift * 60}px, ${-drift * 50}px)` }} />
    </AbsoluteFill>
  );
}

function Chrome({ k }: { k: Kit }) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = useIn(0);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 88 * k.u, top: (k.tall ? 120 : 64) * k.u, display: "flex", alignItems: "center", gap: 18 * k.u, opacity: t }}>
        {k.logo ? <Img src={k.logo} style={{ height: 60 * k.u, width: "auto", maxWidth: 360 * k.u, objectFit: "contain" }} /> : <span style={{ ...head(k, 40 * k.u) }}>{k.brandName}</span>}
      </div>
      {k.handle ? <div style={{ position: "absolute", left: 88 * k.u, bottom: (k.tall ? 130 : 58) * k.u, ...body(k, 28 * k.u, 500), opacity: t }}>{k.handle}</div> : null}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 10 * k.u, background: k.colors.line }}>
        <div style={{ height: "100%", width: "100%", background: k.colors.accent, transform: `scaleX(${frame / Math.max(1, durationInFrames - 1)})`, transformOrigin: "left" }} />
      </div>
    </AbsoluteFill>
  );
}

export function CapyMotion(p: MotionProps) {
  useFonts(p);
  const { width: w, height: h } = useVideoConfig();
  const k: Kit = { ...p, w, h, u: Math.min(w, h) / 1080, tall: h / w > 1.5, wide: w > h };
  // Where each scene starts, in frames.
  const starts = p.scenes.map((_, i) => p.scenes.slice(0, i).reduce((n, x) => n + Math.round(x.seconds * FPS), 0));
  return (
    <AbsoluteFill style={{ background: p.colors.bg }}>
      <Backdrop k={k} />
      {p.scenes.map((s, i) => {
        const len = Math.round(s.seconds * FPS);
        const at = starts[i];
        return (
          <Sequence key={i} from={at} durationInFrames={len}>
            <Frame s={s} k={k} last={i === p.scenes.length - 1} />
          </Sequence>
        );
      })}
      <Chrome k={k} />
    </AbsoluteFill>
  );
}
