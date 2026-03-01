import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { tags } from "@/lib/schema";

// Create tag
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, color } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
    }

    const [tag] = await db
      .insert(tags)
      .values({
        name,
        slug,
        color: color || "#6366f1",
      })
      .returning();

    return NextResponse.json(tag);
  } catch (error) {
    console.error("Error creating tag:", error);
    return NextResponse.json({ error: "Failed to create tag" }, { status: 500 });
  }
}
