import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { resources } from "@/lib/schema";

// DELETE - Hard delete a resource (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: "unauthorized", message: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "forbidden", message: "Admin access required" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Validate resource ID
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "invalid_request", message: "Valid resource ID is required" },
        { status: 400 }
      );
    }

    // Check if resource exists
    const [resource] = await db
      .select({ id: resources.id, title: resources.title })
      .from(resources)
      .where(eq(resources.id, id));

    if (!resource) {
      return NextResponse.json(
        { error: "not_found", message: "Resource not found" },
        { status: 404 }
      );
    }

    // Hard delete the resource (cascades to related records due to schema relations)
    await db.delete(resources).where(eq(resources.id, id));

    return NextResponse.json({
      success: true,
      message: "Resource deleted successfully",
      deletedResource: {
        id: resource.id,
        title: resource.title,
      },
    });
  } catch (error) {
    console.error("Admin delete resource error:", error);
    return NextResponse.json(
      { error: "server_error", message: "Failed to delete resource" },
      { status: 500 }
    );
  }
}
