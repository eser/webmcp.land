import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { comments } from "@/lib/schema";
import { getConfig } from "@/lib/config";

// POST - Flag a comment (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const config = await getConfig();
    if (config.features.comments === false) {
      return NextResponse.json(
        { error: "feature_disabled", message: "Comments are disabled" },
        { status: 403 }
      );
    }

    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "unauthorized", message: "You must be logged in" },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "forbidden", message: "Admin access required" },
        { status: 403 }
      );
    }

    const { id: resourceId, commentId } = await params;

    // Check if comment exists
    const [comment] = await db.select({
      id: comments.id,
      resourceId: comments.resourceId,
      flagged: comments.flagged,
    }).from(comments).where(and(eq(comments.id, commentId), isNull(comments.deletedAt)));

    if (!comment || comment.resourceId !== resourceId) {
      return NextResponse.json(
        { error: "not_found", message: "Comment not found" },
        { status: 404 }
      );
    }

    // Toggle flagged status
    const [updated] = await db.update(comments).set({
      flagged: !comment.flagged,
      flaggedAt: !comment.flagged ? new Date() : null,
      flaggedBy: !comment.flagged ? session.user.id : null,
    }).where(eq(comments.id, commentId)).returning();

    return NextResponse.json({
      flagged: updated.flagged,
    });
  } catch (error) {
    console.error("Flag comment error:", error);
    return NextResponse.json(
      { error: "server_error", message: "Something went wrong" },
      { status: 500 }
    );
  }
}
