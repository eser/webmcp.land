import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  pool: Pool | undefined;
};

const pool =
  globalForDb.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

// Reuse pool across hot reloads in development
globalForDb.pool = pool;

export const db = drizzle({
  client: pool,
  schema,
  logger: process.env.NODE_ENV === "development",
});
