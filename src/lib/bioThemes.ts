// The link-in-bio page's color presets. The public page (and the editor's preview of it) is the one place colors come
// from this table instead of the app's tokens: a visitor's page wears its own theme, not Capybaroar's. All of them
// stay calm: one soft background, white-ish buttons on a ring, ink text.

export type BioThemeId = "light" | "dark" | "paper" | "sage" | "sky" | "blush" | "sand";

export type BioTheme = {
  id: BioThemeId;
  name: string;
  /** The page behind everything. */
  bg: string;
  /** A solid button, a card, a tile's placeholder. */
  surface: string;
  ink: string;
  muted: string;
  /** The ring around a solid button or card, and its soft shadow. */
  line: string;
  shadow: string;
  /** A light wash behind an icon under the pointer. */
  hover: string;
  dark: boolean;
};

export const BIO_THEMES: BioTheme[] = [
  { id: "light", name: "Light", bg: "#f5f5f5", surface: "#ffffff", ink: "#171717", muted: "#6a6a6a", line: "rgba(0,0,0,.1)", shadow: "0 0 0 1px rgba(0,0,0,.08), 0 1px 3px rgba(0,0,0,.08)", hover: "rgba(0,0,0,.05)", dark: false },
  { id: "dark", name: "Dark", bg: "#161614", surface: "#242422", ink: "#ecece8", muted: "#9a9a95", line: "rgba(255,255,255,.12)", shadow: "0 0 0 1px rgba(255,255,255,.1), 0 1px 3px rgba(0,0,0,.4)", hover: "rgba(255,255,255,.07)", dark: true },
  { id: "paper", name: "Paper", bg: "#f6f2ea", surface: "#fffdf8", ink: "#2b2620", muted: "#6d6359", line: "rgba(43,38,32,.12)", shadow: "0 0 0 1px rgba(43,38,32,.1), 0 1px 3px rgba(43,38,32,.08)", hover: "rgba(43,38,32,.06)", dark: false },
  { id: "sage", name: "Sage", bg: "#e6ede5", surface: "#f8fbf7", ink: "#1f2b22", muted: "#56665a", line: "rgba(31,43,34,.12)", shadow: "0 0 0 1px rgba(31,43,34,.1), 0 1px 3px rgba(31,43,34,.08)", hover: "rgba(31,43,34,.06)", dark: false },
  { id: "sky", name: "Sky", bg: "#e3ecf6", surface: "#f8fbfe", ink: "#172433", muted: "#526375", line: "rgba(23,36,51,.12)", shadow: "0 0 0 1px rgba(23,36,51,.1), 0 1px 3px rgba(23,36,51,.08)", hover: "rgba(23,36,51,.06)", dark: false },
  { id: "blush", name: "Blush", bg: "#f6e7e5", surface: "#fdf8f7", ink: "#33201d", muted: "#765954", line: "rgba(51,32,29,.12)", shadow: "0 0 0 1px rgba(51,32,29,.1), 0 1px 3px rgba(51,32,29,.08)", hover: "rgba(51,32,29,.06)", dark: false },
  { id: "sand", name: "Sand", bg: "#f0e8d9", surface: "#fcf9f3", ink: "#2e271c", muted: "#685d4b", line: "rgba(46,39,28,.12)", shadow: "0 0 0 1px rgba(46,39,28,.1), 0 1px 3px rgba(46,39,28,.08)", hover: "rgba(46,39,28,.06)", dark: false },
];

export const themeOf = (id: string | null | undefined): BioTheme => BIO_THEMES.find((t) => t.id === id) ?? BIO_THEMES[0];

/** The theme as CSS variables, set on the page's outer box so every part reads them. */
export const themeVars = (t: BioTheme) =>
  ({
    "--bio-bg": t.bg,
    "--bio-surface": t.surface,
    "--bio-ink": t.ink,
    "--bio-muted": t.muted,
    "--bio-line": t.line,
    "--bio-shadow": t.shadow,
    "--bio-hover": t.hover,
    colorScheme: t.dark ? "dark" : "light",
  }) as React.CSSProperties;
