import type { NextConfig } from "next";

// Security headers on every page and route. The policy limits framing, <base>, plugins and where forms may send
// people; it leaves scripts and styles alone, which Next.js needs inline. Nothing frames our pages (link-in-bio pages
// included), so framing is refused everywhere.
const supabase = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin : "";
  } catch {
    return "";
  }
})();
const base = ["frame-ancestors 'none'", "base-uri 'self'", "object-src 'none'"];
// Sign in with Google posts to us and is sent on to Supabase, then Google: browsers check every step.
const formAction = `form-action 'self'${supabase ? ` ${supabase}` : ""} https://accounts.google.com`;
const common = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
];

const nextConfig: NextConfig = {
  // A self-contained server for the Docker image on Fly.
  output: "standalone",
  poweredByHeader: false,
  // Native modules that draw slides: loaded by Node as they are, not bundled.
  serverExternalPackages: ["@resvg/resvg-js", "sharp"],
  // Which build this is. Open tabs compare it with /api/version and reload after an update.
  // Tabs you just visited open from the browser's cache; saving anything refreshes them.
  experimental: { staleTimes: { dynamic: 30, static: 300 } },
  env: { NEXT_PUBLIC_BUILD: String(Date.now()) },
  async headers() {
    return [
      { source: "/:path*", headers: [...common, { key: "Content-Security-Policy", value: [...base, formAction].join("; ") }] },
      // Approving an app sends the browser on to that app's own address (any https site, localhost or an app's
      // scheme), so this one page has no form-action. The last match wins.
      { source: "/oauth/authorize", headers: [{ key: "Content-Security-Policy", value: base.join("; ") }] },
    ];
  },
};

export default nextConfig;
