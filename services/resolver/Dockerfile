# ─── Build stage ────────────────────────────────────────────
FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ─── Runtime stage ──────────────────────────────────────────
FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# System deps: ffmpeg (ffprobe), python3 + yt-dlp, and c2patool for provenance.
RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg python3 ca-certificates curl xz-utils \
 && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
 && chmod a+rx /usr/local/bin/yt-dlp \
 && curl -L https://github.com/contentauth/c2patool/releases/latest/download/c2patool-x86_64-unknown-linux-gnu.tar.gz -o /tmp/c2patool.tar.gz \
 && tar -xzf /tmp/c2patool.tar.gz -C /usr/local/bin --strip-components=1 --wildcards '*/c2patool' 2>/dev/null || true \
 && rm -f /tmp/c2patool.tar.gz \
 && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist

# Run as non-root.
RUN useradd --create-home --shell /usr/sbin/nologin resolver \
 && chown -R resolver:resolver /app
USER resolver

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/index.js"]
