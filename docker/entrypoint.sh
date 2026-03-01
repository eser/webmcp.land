#!/bin/sh
set -e

echo "▶ Applying database schema..."
pnpm exec drizzle-kit push --force
echo "✓ Schema applied"

# Seed database on first run (when no users exist)
USER_COUNT=$(node --input-type=module -e "
import pg from 'pg';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
try {
  const r = await pool.query('SELECT count(*)::int AS c FROM users');
  console.log(r.rows[0].c);
} catch {
  console.log('0');
} finally {
  await pool.end();
}
")

if [ "$USER_COUNT" = "0" ]; then
  echo "▶ Empty database detected — running seed..."
  node drizzle/seed.ts
  echo "✓ Seed complete"
else
  echo "• Database has $USER_COUNT users — skipping seed"
fi

echo "▶ Starting webmcp.land (vinext)..."
exec node server.js
