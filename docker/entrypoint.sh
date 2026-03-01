#!/bin/sh
set -e

echo "▶ Running database migrations..."
pnpm run db:migrate
echo "✓ Migrations complete"

echo "▶ Starting webmcp.land (vinext)..."
exec node server.js
