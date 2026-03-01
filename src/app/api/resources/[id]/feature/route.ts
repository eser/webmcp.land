import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { resources, users } from "@/lib/schema";

// POST /api/resources/[id]/feature - Toggle featured status (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, session.user.id));

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Get current resource
    const [resource] = await db.select({ isFeatured: resources.isFeatured }).from(resources).where(eq(resources.id, id));

    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    // Toggle featured status
    const [updatedResource] = await db.update(resources).set({
      isFeatured: !resource.isFeatured,
      featuredAt: !resource.isFeatured ? new Date() : null,
    }).where(eq(resources.id, id)).returning();

    return NextResponse.json({
      success: true,
      isFeatured: updatedResource.isFeatured,
    });
  } catch (error) {
    console.error("Error toggling featured status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
