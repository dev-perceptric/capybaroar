// The link-in-bio page's looks. The public page (and the editor's preview of it) is the one place colors come from
// this table instead of the app's tokens: a visitor's page wears its own theme, not Capybaroar's. The calm themes
// keep one soft background; the bold ones bring gradients, glows and patterns for pages that should feel like a
// brand of their own.

export type BioThemeId =
  | "light" | "dark" | "paper" | "sage" | "sky" | "blush" | "sand"
  | "sunset" | "aurora" | "midnight" | "ocean" | "forest" | "noir" | "capy" | "lime" | "candy" | "lavender" | "peach";

export type BioTheme = {
  id: BioThemeId;
  name: string;
  /** The page behind everything: a color, a gradient or a pattern (any CSS background). */
  bg: string;
  /** One solid color for the same page: the window behind it, the phone's bar. */
  base: string;
  /** A solid button, a card, a tile's placeholder. */
  surface: string;
  /** Text on the page. */
  ink: string;
  /** Text on a solid button (differs from ink when light buttons sit on a dark page). */
  btnInk: string;
  muted: string;
  /** The ring around a solid button or card, and its soft shadow. */
  line: string;
  shadow: string;
  /** A light wash behind an icon under the pointer. */
  hover: string;
  /** A frosted button: its fill and its ring. */
  glass: string;
  glassLine: string;
  dark: boolean;
  /** Shown in the editor's theme picker under Bold. */
  bold?: boolean;
};

const calm = (id: BioThemeId, name: string, bg: string, surface: string, ink: string, muted: string, rgb: string, dark = false): BioTheme => ({
  id,
  name,
  bg,
  base: bg,
  surface,
  ink,
  btnInk: ink,
  muted,
  line: `rgba(${rgb},.12)`,
  shadow: dark ? "0 0 0 1px rgba(255,255,255,.1), 0 1px 3px rgba(0,0,0,.4)" : `0 0 0 1px rgba(${rgb},.1), 0 1px 3px rgba(${rgb},.08)`,
  hover: dark ? "rgba(255,255,255,.07)" : `rgba(${rgb},.06)`,
  glass: dark ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.55)",
  glassLine: dark ? "rgba(255,255,255,.16)" : `rgba(${rgb},.12)`,
  dark,
});

export const BIO_THEMES: BioTheme[] = [
  calm("light", "Light", "#f5f5f5", "#ffffff", "#171717", "#6a6a6a", "0,0,0"),
  calm("dark", "Dark", "#161614", "#242422", "#ecece8", "#9a9a95", "255,255,255", true),
  calm("paper", "Paper", "#f6f2ea", "#fffdf8", "#2b2620", "#6d6359", "43,38,32"),
  calm("sage", "Sage", "#e6ede5", "#f8fbf7", "#1f2b22", "#56665a", "31,43,34"),
  calm("sky", "Sky", "#e3ecf6", "#f8fbfe", "#172433", "#526375", "23,36,51"),
  calm("blush", "Blush", "#f6e7e5", "#fdf8f7", "#33201d", "#765954", "51,32,29"),
  calm("sand", "Sand", "#f0e8d9", "#fcf9f3", "#2e271c", "#685d4b", "46,39,28"),
  {
    id: "sunset", name: "Sunset", bold: true, dark: false,
    bg: "linear-gradient(165deg, #ffc39e 0%, #ff8fb1 48%, #b08cff 100%)", base: "#ff9fb4",
    surface: "rgba(255,255,255,.94)", ink: "#2c1232", btnInk: "#2c1232", muted: "rgba(44,18,50,.72)",
    line: "rgba(44,18,50,.14)", shadow: "0 1px 2px rgba(44,18,50,.12), 0 8px 24px -10px rgba(44,18,50,.35)", hover: "rgba(255,255,255,.3)",
    glass: "rgba(255,255,255,.28)", glassLine: "rgba(255,255,255,.6)",
  },
  {
    id: "aurora", name: "Aurora", bold: true, dark: false,
    bg: "linear-gradient(140deg, #5eead4 0%, #a5b4fc 50%, #f9a8d4 100%)", base: "#a5b4fc",
    surface: "rgba(255,255,255,.92)", ink: "#1e1b4b", btnInk: "#1e1b4b", muted: "rgba(30,27,75,.72)",
    line: "rgba(30,27,75,.14)", shadow: "0 1px 2px rgba(30,27,75,.12), 0 8px 24px -10px rgba(30,27,75,.35)", hover: "rgba(255,255,255,.3)",
    glass: "rgba(255,255,255,.3)", glassLine: "rgba(255,255,255,.65)",
  },
  {
    id: "midnight", name: "Midnight", bold: true, dark: true,
    bg: "radial-gradient(circle at 15% 0%, rgba(124,58,237,.55) 0, transparent 45%), radial-gradient(circle at 95% 35%, rgba(14,165,233,.4) 0, transparent 40%), radial-gradient(circle at 40% 100%, rgba(236,72,153,.3) 0, transparent 45%), #0a0d1f",
    base: "#0a0d1f",
    surface: "rgba(255,255,255,.1)", ink: "#f4f6ff", btnInk: "#f4f6ff", muted: "#a8b2d6",
    line: "rgba(255,255,255,.16)", shadow: "inset 0 0 0 1px rgba(255,255,255,.14), 0 8px 24px -12px rgba(0,0,0,.6)", hover: "rgba(255,255,255,.08)",
    glass: "rgba(255,255,255,.08)", glassLine: "rgba(255,255,255,.22)",
  },
  {
    id: "ocean", name: "Ocean", bold: true, dark: true,
    bg: "linear-gradient(180deg, #0e7490 0%, #134e4a 100%)", base: "#0f5f6b",
    surface: "#ecfeff", ink: "#ecfeff", btnInk: "#0b3b40", muted: "#a5f3fc",
    line: "rgba(236,254,255,.2)", shadow: "0 1px 2px rgba(0,0,0,.2), 0 10px 24px -12px rgba(0,0,0,.5)", hover: "rgba(255,255,255,.1)",
    glass: "rgba(255,255,255,.12)", glassLine: "rgba(255,255,255,.3)",
  },
  {
    id: "forest", name: "Forest", bold: true, dark: true,
    bg: "radial-gradient(circle at 50% -10%, #2f7a4b 0, transparent 60%), #0f2a1b", base: "#0f2a1b",
    surface: "#fdf8e8", ink: "#fdf8e8", btnInk: "#173d27", muted: "#b7d9c1",
    line: "rgba(253,248,232,.2)", shadow: "0 1px 2px rgba(0,0,0,.25), 0 10px 24px -12px rgba(0,0,0,.6)", hover: "rgba(255,255,255,.08)",
    glass: "rgba(253,248,232,.1)", glassLine: "rgba(253,248,232,.28)",
  },
  {
    id: "noir", name: "Noir", bold: true, dark: true,
    bg: "#0a0a0a", base: "#0a0a0a",
    surface: "#fafafa", ink: "#fafafa", btnInk: "#0a0a0a", muted: "#a3a3a3",
    line: "rgba(255,255,255,.2)", shadow: "0 0 0 1px rgba(255,255,255,.08)", hover: "rgba(255,255,255,.08)",
    glass: "rgba(255,255,255,.06)", glassLine: "rgba(255,255,255,.2)",
  },
  {
    id: "capy", name: "Capy", bold: true, dark: false,
    bg: "#ffd202", base: "#ffd202",
    surface: "#ffffff", ink: "#262209", btnInk: "#262209", muted: "#5a4f12",
    line: "rgba(38,34,9,.2)", shadow: "0 0 0 1.5px #262209", hover: "rgba(38,34,9,.08)",
    glass: "rgba(255,255,255,.4)", glassLine: "rgba(38,34,9,.25)",
  },
  {
    id: "lime", name: "Lime", bold: true, dark: false,
    bg: "#d9f99d", base: "#d9f99d",
    surface: "#ffffff", ink: "#111111", btnInk: "#111111", muted: "#3f4a1f",
    line: "rgba(17,17,17,.2)", shadow: "0 0 0 1.5px #111111", hover: "rgba(17,17,17,.06)",
    glass: "rgba(255,255,255,.45)", glassLine: "rgba(17,17,17,.2)",
  },
  {
    id: "candy", name: "Candy", bold: true, dark: false,
    bg: "radial-gradient(rgba(236,72,153,.28) 1.6px, transparent 1.6px) 0 0 / 18px 18px, #fde7f3", base: "#fde7f3",
    surface: "#ffffff", ink: "#4a1033", btnInk: "#4a1033", muted: "#8a3a66",
    line: "rgba(74,16,51,.16)", shadow: "0 0 0 1px rgba(74,16,51,.12), 0 6px 18px -8px rgba(236,72,153,.45)", hover: "rgba(236,72,153,.1)",
    glass: "rgba(255,255,255,.55)", glassLine: "rgba(236,72,153,.3)",
  },
  {
    id: "lavender", name: "Lavender", bold: true, dark: false,
    bg: "linear-gradient(180deg, #e9e3ff 0%, #fbf3ff 100%)", base: "#efe9ff",
    surface: "#ffffff", ink: "#2e1065", btnInk: "#2e1065", muted: "#6d5a9c",
    line: "rgba(46,16,101,.12)", shadow: "0 0 0 1px rgba(46,16,101,.08), 0 6px 18px -8px rgba(109,40,217,.3)", hover: "rgba(109,40,217,.08)",
    glass: "rgba(255,255,255,.6)", glassLine: "rgba(109,40,217,.2)",
  },
  {
    id: "peach", name: "Peach", bold: true, dark: false,
    bg: "radial-gradient(circle at 50% -15%, #fdba74 0, transparent 60%), #fff4e8", base: "#fff4e8",
    surface: "#ffffff", ink: "#431407", btnInk: "#431407", muted: "#9a3412",
    line: "rgba(67,20,7,.12)", shadow: "0 0 0 1px rgba(67,20,7,.08), 0 6px 18px -8px rgba(234,88,12,.35)", hover: "rgba(234,88,12,.08)",
    glass: "rgba(255,255,255,.6)", glassLine: "rgba(234,88,12,.2)",
  },
];

export const themeOf = (id: string | null | undefined): BioTheme => BIO_THEMES.find((t) => t.id === id) ?? BIO_THEMES[0];

/** The page's fonts. The CSS variables come from next/font in BioCard; family is the fallback stack. */
export type BioFontId = "inter" | "serif" | "grotesk" | "mono" | "rounded" | "display";
export const BIO_FONTS: { id: BioFontId; name: string; family: string }[] = [
  { id: "inter", name: "Clean", family: 'var(--font-inter), "Inter", system-ui, sans-serif' },
  { id: "serif", name: "Editorial", family: 'var(--font-bio-serif), "Fraunces", Georgia, serif' },
  { id: "grotesk", name: "Geometric", family: 'var(--font-bio-grotesk), "Space Grotesk", system-ui, sans-serif' },
  { id: "mono", name: "Mono", family: 'var(--font-bio-mono), "JetBrains Mono", ui-monospace, monospace' },
  { id: "rounded", name: "Friendly", family: 'var(--font-bio-rounded), "Nunito", system-ui, sans-serif' },
  { id: "display", name: "Display", family: 'var(--font-bio-display), "Bricolage Grotesque", system-ui, sans-serif' },
];
export const fontOf = (id: string | null | undefined) => BIO_FONTS.find((f) => f.id === id) ?? BIO_FONTS[0];

/** The theme as CSS variables, set on the page's outer box so every part reads them. */
export const themeVars = (t: BioTheme, font?: string) =>
  ({
    "--bio-bg": t.base,
    "--bio-surface": t.surface,
    "--bio-ink": t.ink,
    "--bio-btn-ink": t.btnInk,
    "--bio-muted": t.muted,
    "--bio-line": t.line,
    "--bio-shadow": t.shadow,
    "--bio-hover": t.hover,
    "--bio-glass": t.glass,
    "--bio-glass-line": t.glassLine,
    background: t.bg,
    fontFamily: fontOf(font).family,
    colorScheme: t.dark ? "dark" : "light",
  }) as React.CSSProperties;
