import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { resources } from "@/lib/schema";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can restore deleted resources
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Check if resource exists and is deleted
    const [resource] = await db.select({
      id: resources.id,
      deletedAt: resources.deletedAt,
    }).from(resources).where(eq(resources.id, id));

    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    if (!resource.deletedAt) {
      return NextResponse.json({ error: "Resource is not deleted" }, { status: 400 });
    }

    // Restore the resource by setting deletedAt to null
    await db.update(resources).set({ deletedAt: null }).where(eq(resources.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Restore resource error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
