# Single-container Dockerfile for forge-omix
# Serves frontend (nginx) + backend (Hono) in one container

FROM node:22-alpine AS builder

# e2e browser binaries are not needed to build; skip Playwright's postinstall
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Enable corepack and install dependencies (pnpm 10+: reads the v9 lockfile
# and supports the settings-only pnpm-workspace.yaml)
RUN corepack enable && corepack prepare pnpm@10 --activate && pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build frontend
RUN pnpm build

# Build backend
RUN pnpm build:server

# Production stage (Debian slim: the prebuilt libsql native binding is
# built for glibc and fails on musl/Alpine with `fcntl64: symbol not found`)
FROM node:22-bookworm-slim

# Install nginx + dumb-init (proper signal handling for the two processes)
# + git (Phase 10 workspace operations shell out to the git binary)
RUN apt-get update && apt-get install -y --no-install-recommends nginx dumb-init git && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built frontend assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy built backend (single esbuild bundle) + SQL migrations next to it:
# the server resolves its migrations folder relative to the bundle location.
COPY --from=builder /app/dist-server ./dist-server
COPY --from=builder /app/src/server/db/migrations ./dist-server/migrations
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./

# Production-only dependencies: dev toolchains (vite, vitest, esbuild)
# carry advisories and must not ship in the runtime image.
RUN corepack enable && corepack prepare pnpm@10 --activate && \
    pnpm install --frozen-lockfile --prod && \
    rm -rf /root/.cache /root/.local/share/pnpm

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create data directory
RUN mkdir -p /data/projects /data/templates /data/exports

# Expose port
EXPOSE 8080

# Start script: run nginx + hono backend
COPY start.sh /start.sh
RUN chmod +x /start.sh

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:8080/health').then((r) => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["/start.sh"]
