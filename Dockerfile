# node:22-bookworm-slim, pinned by digest (the multi-arch index on Docker Hub, 2026-11-13). Update both lines together.
FROM node:22-bookworm-slim@sha256:e9f565d32859f0cbfb52125eafe8be39390f24dac302dc3cdf566e8ba3ab21ee AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-bookworm-slim@sha256:e9f565d32859f0cbfb52125eafe8be39390f24dac302dc3cdf566e8ba3ab21ee
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg && rm -rf /var/lib/apt/lists/*
WORKDIR /app
# "::" listens on IPv4 and IPv6.
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=::
# Runs as the image's "node" user (uid 1000). server.js, node_modules and public stay owned by root, read-only to
# the app. .next is the app's: Next writes the image and fetch cache to .next/cache and re-rendered pages
# (revalidatePath) to .next/server. Uploads and video trims use /tmp.
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
RUN mkdir -p .next/cache && chown -R node:node .next
USER node
EXPOSE 3000
CMD ["node", "server.js"]
