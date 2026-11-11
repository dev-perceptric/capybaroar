import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A self-contained server for the Docker image on Fly.
  output: "standalone",
  // Native modules that draw slides: loaded by Node as they are, not bundled.
  serverExternalPackages: ["@resvg/resvg-js", "sharp"],
  // Which build this is. Open tabs compare it with /api/version and reload after an update.
  // Tabs you just visited open from the browser's cache; saving anything refreshes them.
  experimental: { staleTimes: { dynamic: 30, static: 300 } },
  env: { NEXT_PUBLIC_BUILD: String(Date.now()) },
};

export default nextConfig;
