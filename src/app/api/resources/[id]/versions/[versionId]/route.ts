import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { resources, resourceVersions } from "@/lib/schema";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "unauthorized", message: "You must be logged in" },
        { status: 401 }
      );
    }

    const { id: resourceId, versionId } = await params;

    // Check if resource exists and user is owner
    const [resource] = await db.select({ authorId: resources.authorId }).from(resources).where(eq(resources.id, resourceId));

    if (!resource) {
      return NextResponse.json(
        { error: "not_found", message: "Resource not found" },
        { status: 404 }
      );
    }

    if (resource.authorId !== session.user.id) {
      return NextResponse.json(
        { error: "forbidden", message: "You can only delete versions of your own resources" },
        { status: 403 }
      );
    }

    // Check if version exists
    const [version] = await db.select({
      id: resourceVersions.id,
      resourceId: resourceVersions.resourceId,
    }).from(resourceVersions).where(eq(resourceVersions.id, versionId));

    if (!version || version.resourceId !== resourceId) {
      return NextResponse.json(
        { error: "not_found", message: "Version not found" },
        { status: 404 }
      );
    }

    // Delete the version
    await db.delete(resourceVersions).where(eq(resourceVersions.id, versionId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete version error:", error);
    return NextResponse.json(
      { error: "server_error", message: "Something went wrong" },
      { status: 500 }
    );
  }
}
