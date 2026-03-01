import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { resources, users } from "@/lib/schema";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);
  const ownerOnly = searchParams.get("ownerOnly") === "true";

  if (query.length < 2) {
    return NextResponse.json({ resources: [] });
  }

  const session = await getSession();

  try {
    // Handle comma-separated keywords
    const keywords = query.split(",").map(k => k.trim()).filter(Boolean);
    const titleConditions = keywords.length > 1
      ? keywords.map(keyword => ilike(resources.title, `%${keyword}%`))
      : [ilike(resources.title, `%${query}%`)];

    // Build conditions
    const conditions = [
      isNull(resources.deletedAt),
    ];

    // Visibility filter
    if (ownerOnly && session?.user) {
      conditions.push(eq(resources.authorId, session.user.id));
    } else {
      const visibilityConditions = [eq(resources.isPrivate, false)];
      if (session?.user) {
        visibilityConditions.push(eq(resources.authorId, session.user.id));
      }
      conditions.push(or(...visibilityConditions)!);
    }

    // Search filter
    conditions.push(or(...titleConditions)!);

    const results = await db.select({
      id: resources.id,
      title: resources.title,
      slug: resources.slug,
      author: {
        username: users.username,
      },
    })
    .from(resources)
    .innerJoin(users, eq(resources.authorId, users.id))
    .where(and(...conditions))
    .limit(limit)
    .orderBy(desc(resources.isFeatured), desc(resources.viewCount));

    return NextResponse.json({ resources: results });
  } catch (error) {
    console.error("Search failed:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
