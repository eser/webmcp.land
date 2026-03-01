#!/bin/sh
set -e

echo "▶ Applying database schema..."
pnpm run db:push
echo "✓ Schema applied"

echo "▶ Starting webmcp.land (vinext)..."
exec node server.js
