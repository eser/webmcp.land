# webmcp.land Multi-Stage Dockerfile
# For use with compose.yml (multi-service setup)
#
# Targets:
#   development  - Hot reload dev server (used by docker compose)
#   runner       - Production standalone server

FROM node:25-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm
WORKDIR /app

# ── Stage 1: Install dependencies ──────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ── Stage 2: Development (target for docker compose) ───────────────────────
FROM base AS development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["sh", "-c", "pnpm run db:push && pnpm run dev"]

# ── Stage 3: Build for production ──────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build

# ── Stage 4: Production runner ─────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 appuser

# Copy built application (vinext outputs to dist/)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=appuser:nodejs /app/dist ./dist
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/package.json ./package.json
COPY --from=builder --chown=appuser:nodejs /app/server.js ./server.js

# Copy Drizzle schema & config for runtime db:push
COPY --from=builder /app/src/lib/schema.ts ./src/lib/schema.ts
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts

# Copy entrypoint
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER appuser
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

ENTRYPOINT ["/entrypoint.sh"]
