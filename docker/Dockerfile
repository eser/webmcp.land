# webmcp.land Bootstrap Docker Image
# Lightweight image that clones and builds on first run
#
# Usage:
#   docker run -p 4444:3000 -v webmcp-data:/data ghcr.io/eser/webmcp.land
#   docker run -p 4444:3000 -v webmcp-data:/data -e WMCP_NAME="My App" ghcr.io/eser/webmcp.land

FROM node:25-bookworm-slim

LABEL org.opencontainers.image.source="https://github.com/eser/webmcp.land"
LABEL org.opencontainers.image.description="webmcp.land - MCP/WebMCP service registry"
LABEL org.opencontainers.image.licenses="Apache-2.0"

# Install PostgreSQL, git, pnpm, and utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-15 \
    postgresql-contrib-15 \
    supervisor \
    git \
    curl \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /var/run/postgresql /var/log/supervisor \
    && chown -R postgres:postgres /var/run/postgresql

# Install pnpm globally (corepack removed from Node 25+)
RUN npm install -g pnpm

# Create directories
WORKDIR /app
RUN mkdir -p /data/postgres /data/app && chown -R postgres:postgres /data/postgres

# Copy bootstrap scripts
COPY docker/bootstrap.sh /bootstrap.sh
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
RUN chmod +x /bootstrap.sh

# Environment defaults
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="postgresql://webmcp:webmcp@localhost:5432/webmcp?schema=public"
ENV DIRECT_URL="postgresql://webmcp:webmcp@localhost:5432/webmcp?schema=public"
ENV REPO_URL="https://github.com/eser/webmcp.land.git"

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=180s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

ENTRYPOINT ["/bootstrap.sh"]
