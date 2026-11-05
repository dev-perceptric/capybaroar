import { Bricolage_Grotesque, Fraunces, JetBrains_Mono, Nunito, Space_Grotesk } from "next/font/google";

// The link-in-bio page's fonts (BIO_FONTS in src/lib/bioThemes.ts), set as CSS variables on <html> by the root layout.
// Nothing is preloaded, so a browser only downloads the one a page uses.
const serif = Fraunces({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-bio-serif" });
const grotesk = Space_Grotesk({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-bio-grotesk" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-bio-mono" });
const rounded = Nunito({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-bio-rounded" });
const display = Bricolage_Grotesque({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-bio-display" });

export const bioFontVars = [serif, grotesk, mono, rounded, display].map((f) => f.variable).join(" ");
