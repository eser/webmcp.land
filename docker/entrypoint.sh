#!/bin/sh
set -e

echo "▶ Applying database schema..."
pnpm exec drizzle-kit push --force
echo "✓ Schema applied"

echo "▶ Starting webmcp.land (vinext)..."
exec node server.js
