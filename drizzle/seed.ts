import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { Pool } from "pg";
import { hashPassword } from "../src/lib/crypto.ts";
import * as schema from "../src/lib/schema.ts";

const {
  users,
  categories,
  tags,
  resources,
  resourceTags,
  resourceVersions,
} = schema;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema });

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROMPTS_JSON_PATH = resolve(__dirname, "../etc/prompts.json");

interface RemoteEntry {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  content: string;
  type: string;
  viewCount: number;
  voteCount: number;
  commentCount: number;
  isFeatured: boolean;
  featuredAt: string | null;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
  } | null;
  author: {
    username: string;
    name: string | null;
    avatar: string | null;
    identifier: string;
    verified: boolean;
  };
  tags: Array<{
    id: string;
    name: string;
    slug: string;
    color: string;
  }>;
}

interface RemoteDataResponse {
  count: number;
  prompts: RemoteEntry[];
}

function loadData(): RemoteDataResponse {
  console.log(`Loading seed data from ${PROMPTS_JSON_PATH}...`);
  const raw = readFileSync(PROMPTS_JSON_PATH, "utf-8");
  const data = JSON.parse(raw);
  console.log(`Loaded ${data.count} entries`);
  return data;
}

async function main() {
  console.log("Seeding database for webmcp.land...");

  // Create admin user
  const password = await hashPassword("password123");

  const [admin] = await db
    .insert(users)
    .values({
      email: "admin@webmcp.land",
      username: "admin",
      name: "Admin User",
      password: password,
      role: "ADMIN",
      locale: "en",
    })
    .onConflictDoUpdate({
      target: users.email,
      set: { name: "Admin User" },
    })
    .returning();

  console.log("Created admin user");

  // Load data from local JSON
  const { prompts: remoteEntries } = loadData();

  // Extract unique categories
  const categoryMap = new Map<
    string,
    { name: string; slug: string; icon: string | null }
  >();
  for (const entry of remoteEntries) {
    if (entry.category) {
      categoryMap.set(entry.category.slug, {
        name: entry.category.name,
        slug: entry.category.slug,
        icon: entry.category.icon,
      });
    }
  }

  // Create categories
  console.log(`Creating ${categoryMap.size} categories...`);
  const categoryIdMap = new Map<string, string>();
  let categoryOrder = 1;
  for (const [slug, cat] of categoryMap) {
    const [category] = await db
      .insert(categories)
      .values({
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        order: categoryOrder++,
      })
      .onConflictDoUpdate({
        target: categories.slug,
        set: { name: cat.name, icon: cat.icon },
      })
      .returning();
    categoryIdMap.set(slug, category.id);
  }
  console.log(`Created ${categoryMap.size} categories`);

  // Extract unique tags
  const tagMap = new Map<
    string,
    { name: string; slug: string; color: string }
  >();
  for (const entry of remoteEntries) {
    for (const tag of entry.tags) {
      tagMap.set(tag.slug, {
        name: tag.name,
        slug: tag.slug,
        color: tag.color,
      });
    }
  }

  // Create tags
  console.log(`Creating ${tagMap.size} tags...`);
  const tagIdMap = new Map<string, string>();
  for (const [slug, tag] of tagMap) {
    const [createdTag] = await db
      .insert(tags)
      .values({
        name: tag.name,
        slug: tag.slug,
        color: tag.color,
      })
      .onConflictDoUpdate({
        target: tags.slug,
        set: { name: tag.name, color: tag.color },
      })
      .returning();
    tagIdMap.set(slug, createdTag.id);
  }
  console.log(`Created ${tagMap.size} tags`);

  // Extract unique authors and create users
  const authorMap = new Map<
    string,
    {
      username: string;
      name: string | null;
      avatar: string | null;
      verified: boolean;
    }
  >();
  for (const entry of remoteEntries) {
    if (!authorMap.has(entry.author.username)) {
      authorMap.set(entry.author.username, {
        username: entry.author.username,
        name: entry.author.name,
        avatar: entry.author.avatar,
        verified: entry.author.verified,
      });
    }
  }

  // Create users for authors
  console.log(`Creating ${authorMap.size} users...`);
  const userIdMap = new Map<string, string>();
  for (const [username, author] of authorMap) {
    // Skip creating if it's the admin
    if (username === "admin") {
      userIdMap.set(username, admin.id);
      continue;
    }

    const [user] = await db
      .insert(users)
      .values({
        email: `${username}@webmcp.land`,
        username: author.username,
        name: author.name,
        avatar: author.avatar,
        password: password,
        role: "USER",
        locale: "en",
      })
      .onConflictDoUpdate({
        target: users.username,
        set: { name: author.name, avatar: author.avatar },
      })
      .returning();
    userIdMap.set(username, user.id);
  }
  console.log(`Created ${authorMap.size} users`);

  // Create resources
  console.log(`Creating ${remoteEntries.length} resources...`);
  let resourcesCreated = 0;
  let resourcesSkipped = 0;

  for (const entry of remoteEntries) {
    const authorId = userIdMap.get(entry.author.username);
    if (!authorId) {
      console.warn(
        `Skipping resource "${entry.title}" - author not found`,
      );
      resourcesSkipped++;
      continue;
    }

    const categoryId = entry.category
      ? categoryIdMap.get(entry.category.slug)
      : null;

    // Check if resource already exists
    const [existingResource] = await db
      .select({ id: resources.id })
      .from(resources)
      .where(eq(resources.slug, entry.slug));

    if (existingResource) {
      resourcesSkipped++;
      continue;
    }

    try {
      // Create resource — legacy prompts are imported as WEBMCP type with PENDING status
      const [resource] = await db
        .insert(resources)
        .values({
          title: entry.title,
          slug: entry.slug,
          description: entry.description || entry.content?.slice(0, 500) || null,
          endpointUrl: "",
          serverType: "WEBMCP",
          status: "PENDING",
          viewCount: entry.viewCount,
          isFeatured: entry.isFeatured,
          featuredAt: entry.featuredAt
            ? new Date(entry.featuredAt)
            : null,
          authorId: authorId,
          categoryId: categoryId,
        })
        .returning();

      // Create tag associations
      const tagValues = entry.tags
        .filter((tag) => tagIdMap.has(tag.slug))
        .map((tag) => ({
          resourceId: resource.id,
          tagId: tagIdMap.get(tag.slug)!,
        }));

      if (tagValues.length > 0) {
        await db.insert(resourceTags).values(tagValues);
      }

      // Create initial version
      await db.insert(resourceVersions).values({
        resourceId: resource.id,
        version: 1,
        description: entry.description || entry.content?.slice(0, 500) || null,
        changeNote: "Initial version",
        createdBy: authorId,
      });

      resourcesCreated++;
    } catch (error) {
      console.warn(
        `Failed to create resource "${entry.title}":`,
        error,
      );
      resourcesSkipped++;
    }
  }

  console.log(
    `Created ${resourcesCreated} resources (${resourcesSkipped} skipped)`,
  );
  console.log("\nSeeding complete!");
  console.log("\nTest credentials (password: password123):");
  console.log("   Admin: admin@webmcp.land");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
