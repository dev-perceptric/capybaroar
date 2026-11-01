import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A self-contained server for the Docker image on Fly.
  output: "standalone",
  // Which build this is. Open tabs compare it with /api/version and reload after an update.
  env: { NEXT_PUBLIC_BUILD: String(Date.now()) },
};

export default nextConfig;
