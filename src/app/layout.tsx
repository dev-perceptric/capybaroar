import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { DialogHost } from "@/components/Dialogs";
import { StaleTab } from "@/components/StaleTab";
import "./globals.css";

export const metadata: Metadata = {
  title: "Capybaroar",
  description: "Schedule every post from one place.",
  applicationName: "Capybaroar",
};

// Served from our own domain with the page (no Google request before the first paint), with a size-matched fallback
// so text doesn't jump when the font arrives.
const inter = Inter({ subsets: ["latin"], axes: ["opsz"], display: "swap", variable: "--font-inter" });
const mono = Geist_Mono({ subsets: ["latin"], display: "swap", variable: "--font-geist-mono" });

export const viewport: Viewport = { themeColor: "#ffffff" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The app layout's RailScript may mark <html> collapsed before React hydrates it.
    <html lang="en" data-theme="light" suppressHydrationWarning className={`h-full ${inter.variable} ${mono.variable}`}>
      <body className="min-h-full font-sans antialiased">
        {children}
        <DialogHost />
        <StaleTab />
      </body>
    </html>
  );
}
