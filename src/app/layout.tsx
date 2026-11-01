import type { Metadata, Viewport } from "next";
import { DialogHost } from "@/components/Dialogs";
import { StaleTab } from "@/components/StaleTab";
import "./globals.css";

export const metadata: Metadata = {
  title: "Capybaroar",
  description: "Schedule every post from one place.",
  applicationName: "Capybaroar",
};

export const viewport: Viewport = { themeColor: "#ffffff" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300..700&family=Geist+Mono:wght@400;500&display=swap" />
      </head>
      <body className="min-h-full font-sans antialiased">
        {children}
        <DialogHost />
        <StaleTab />
      </body>
    </html>
  );
}
