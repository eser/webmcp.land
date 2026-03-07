import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray, or, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { categories, resources, resourceVersions, users } from "@/lib/schema";
import fs from "fs/promises";
import path from "path";

interface CsvRow {
  title: string;
  description: string;
  endpointUrl: string;
  serverType: string;
  status: string;
  category: string;
  author: string;
  url: string;
}

// Unescape literal escape sequences like \n, \t, etc.
function unescapeString(str: string): string {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\\/g, '\\');
}

function parseCSV(content: string): CsvRow[] {
  const rows: CsvRow[] = [];
  const values: string[] = [];
  let current = "";
  let inQuotes = false;
  let isFirstRow = true;

  // Parse character by character to handle multi-line quoted fields
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"' && !inQuotes) {
      inQuotes = true;
    } else if (char === '"' && inQuotes) {
      if (nextChar === '"') {
        // Escaped quote ""
        current += '"';
        i++;
      } else {
        inQuotes = false;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = "";
    } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
      // End of row (not inside quotes)
      if (char === '\r') i++; // Skip \r in \r\n

      values.push(current);
      current = "";

      if (isFirstRow) {
        // Skip header row
        isFirstRow = false;
      } else if (values.some(v => v.trim())) {
        // Only add non-empty rows
        rows.push({
          title: values[0]?.trim() || "",
          description: unescapeString(values[1] || "").trim(),
          endpointUrl: unescapeString(values[2] || "").trim(),
          serverType: values[3]?.trim() || "MCP",
          status: values[4]?.trim() || "PENDING",
          category: values[5]?.trim() || "",
          author: values[6]?.trim() || "",
          url: values[7]?.trim() || "",
        });
      }
      values.length = 0; // Clear array
    } else {
      current += char;
    }
  }

  // Handle last row if file doesn't end with newline
  if (current || values.length > 0) {
    values.push(current);
    if (!isFirstRow && values.some(v => v.trim())) {
      rows.push({
        title: values[0]?.trim() || "",
        description: unescapeString(values[1] || "").trim(),
        endpointUrl: unescapeString(values[2] || "").trim(),
        serverType: values[3]?.trim() || "MCP",
        status: values[4]?.trim() || "PENDING",
        category: values[5]?.trim() || "",
        author: values[6]?.trim() || "",
        url: values[7]?.trim() || "",
      });
    }
  }

  return rows;
}

function mapCsvServerType(csvType: string): "MCP" | "WEBMCP" {
  const type = csvType.toUpperCase();
  if (type === "WEBMCP") return "WEBMCP";
  return "MCP";
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Read the resources.csv file from the project root
    const csvPath = path.join(process.cwd(), "resources.csv");
    const csvContent = await fs.readFile(csvPath, "utf-8");

    const rows = parseCSV(csvContent);

    if (rows.length === 0) {
      return NextResponse.json({ error: "No valid rows found in CSV" }, { status: 400 });
    }

    // Get the admin user ID for fallback author assignment
    const adminUserId = session.user.id;

    // Cache for contributor users (username -> userId)
    const contributorCache = new Map<string, string>();

    // Helper to get or create contributor user
    async function getOrCreateContributorUser(username: string): Promise<string> {
      const normalizedUsername = username.toLowerCase().trim();

      // Check cache first
      if (contributorCache.has(normalizedUsername)) {
        return contributorCache.get(normalizedUsername)!;
      }

      // Check if user exists by username or pseudo email
      const pseudoEmail = `${normalizedUsername}@unclaimed.webmcp.land`;

      const [user] = await db
        .select()
        .from(users)
        .where(
          or(
            eq(users.username, normalizedUsername),
            eq(users.email, pseudoEmail),
          )
        )
        .limit(1);

      if (user) {
        contributorCache.set(normalizedUsername, user.id);
        return user.id;
      }

      // Create pseudo user - they can claim this account later by logging in with GitHub
      const [newUser] = await db
        .insert(users)
        .values({
          username: normalizedUsername,
          email: pseudoEmail,
          name: normalizedUsername,
          role: "USER",
        })
        .returning();

      contributorCache.set(normalizedUsername, newUser.id);
      return newUser.id;
    }

    // Handle multiple contributors (comma-separated), return first as primary author
    async function getOrCreateContributor(contributorField: string): Promise<string> {
      if (!contributorField) return adminUserId;

      // Split by comma for multiple contributors
      const contributors = contributorField.split(',').map(c => c.trim()).filter(Boolean);

      if (contributors.length === 0) return adminUserId;

      // Create users for all contributors, return first as primary author
      for (const username of contributors) {
        await getOrCreateContributorUser(username);
      }

      return contributorCache.get(contributors[0].toLowerCase())!;
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const row of rows) {
      try {
        // Check if resource with same title already exists
        const [existing] = await db
          .select({ id: resources.id })
          .from(resources)
          .where(eq(resources.title, row.title))
          .limit(1);

        if (existing) {
          skipped++;
          continue;
        }

        // Get or create contributor user
        const authorId = await getOrCreateContributor(row.author);

        // Determine server type
        const serverType = mapCsvServerType(row.serverType);

        // Look up category if provided
        let categoryId: string | null = null;
        if (row.category) {
          const [cat] = await db
            .select({ id: categories.id })
            .from(categories)
            .where(eq(categories.slug, row.category.toLowerCase()))
            .limit(1);
          categoryId = cat?.id ?? null;
        }

        // Create the resource
        const [resource] = await db
          .insert(resources)
          .values({
            title: row.title,
            description: row.description || null,
            endpointUrl: row.endpointUrl,
            serverType,
            isPrivate: false,
            authorId,
            categoryId,
          })
          .returning();

        // Create initial version
        await db
          .insert(resourceVersions)
          .values({
            resourceId: resource.id,
            version: 1,
            description: resource.description,
            changeNote: "Imported from resources.csv",
            createdBy: authorId,
          });

        imported++;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        errors.push(`Failed to import "${row.title}": ${errorMessage}`);
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      total: rows.length,
      errors: errors.slice(0, 10), // Only return first 10 errors
    });
  } catch (error) {
    console.error("Error importing resources:", error);
    return NextResponse.json(
      { error: "Failed to import resources" },
      { status: 500 }
    );
  }
}

// Delete all community resources (resources imported from CSV)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Read CSV to get the titles of community resources
    const csvPath = path.join(process.cwd(), "resources.csv");
    const csvContent = await fs.readFile(csvPath, "utf-8");
    const rows = parseCSV(csvContent);

    const titles = rows.map(row => row.title);

    // Delete all resources that match the CSV titles
    const result = await db
      .delete(resources)
      .where(inArray(resources.title, titles));

    // Delete all unclaimed users (users with @unclaimed.webmcp.land emails)
    const deletedUsers = await db
      .delete(users)
      .where(sql`${users.email} LIKE '%@unclaimed.webmcp.land'`);

    return NextResponse.json({
      success: true,
      deleted: result.rowCount ?? 0,
      deletedUsers: deletedUsers.rowCount ?? 0,
    });
  } catch (error) {
    console.error("Error deleting community resources:", error);
    return NextResponse.json(
      { error: "Failed to delete community resources" },
      { status: 500 }
    );
  }
}
