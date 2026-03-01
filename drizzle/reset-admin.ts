import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { Pool } from "pg";
import { hashPassword } from "../src/lib/crypto.ts";
import * as schema from "../src/lib/schema.ts";

const { users } = schema;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema });

async function main() {
  console.log("Resetting admin user...");

  const password = await hashPassword("password123");

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, "admin@webmcp.land"));

  if (existing) {
    await db
      .update(users)
      .set({ password, role: "ADMIN" })
      .where(eq(users.id, existing.id));
  } else {
    await db.insert(users).values({
      email: "admin@webmcp.land",
      username: "admin",
      name: "Admin User",
      password,
      role: "ADMIN",
      locale: "en",
    });
  }

  console.log("Admin user reset successfully!");
  console.log("\nCredentials:");
  console.log("   Email:    admin@webmcp.land");
  console.log("   Password: password123");
}

main()
  .catch((e) => {
    console.error("Failed to reset admin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
