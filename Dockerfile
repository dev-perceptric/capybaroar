# node:22-bookworm-slim, pinned by digest (the multi-arch index on Docker Hub, 2026-11-13). Update both lines together.
FROM node:26-bookworm-slim@sha256:5df79989ed685e09f0a98019db4cebfb22fb9df1a53c0161664a011f7ff6b0f1 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:26-bookworm-slim@sha256:5df79989ed685e09f0a98019db4cebfb22fb9df1a53c0161664a011f7ff6b0f1
# ffmpeg trims videos; chromium renders CapyInfographic designs (src/lib/capy/render.ts, JavaScript off, no outside requests).
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg chromium && rm -rf /var/lib/apt/lists/*
WORKDIR /app
# "::" listens on IPv4 and IPv6.
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=:: CHROMIUM_PATH=/usr/bin/chromium
# Runs as the image's "node" user (uid 1000). server.js, node_modules and public stay owned by root, read-only to
# the app. .next is the app's: Next writes the image and fetch cache to .next/cache and re-rendered pages
# (revalidatePath) to .next/server. Uploads and video trims use /tmp.
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
# The CapyMotion scene kit, bundled by scripts/build-motion.mjs during the build.
COPY --from=build /app/motion-bundle ./motion-bundle
# The newest deploy script, which the server copies out on every deploy (ops/deploy.sh).
COPY --from=build /app/ops/deploy.sh ./deploy.sh
# The commit this image is built from (build-images.yml), shown at /api/version so a deploy can check it went live.
ARG GIT_COMMIT=""
ENV GIT_COMMIT=$GIT_COMMIT
RUN mkdir -p .next/cache && chown -R node:node .next
USER node
EXPOSE 3000
CMD ["node", "server.js"]
