import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { comments } from "@/lib/schema";
import { getConfig } from "@/lib/config";

// DELETE - Delete a comment (author or admin only)
export async function DELETE(
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

    const { id: resourceId, commentId } = await params;

    // Find the comment
    const [comment] = await db.select({
      id: comments.id,
      resourceId: comments.resourceId,
      authorId: comments.authorId,
    }).from(comments).where(and(eq(comments.id, commentId), isNull(comments.deletedAt)));

    if (!comment || comment.resourceId !== resourceId) {
      return NextResponse.json(
        { error: "not_found", message: "Comment not found" },
        { status: 404 }
      );
    }

    // Check if user can delete (author or admin)
    const isAuthor = comment.authorId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: "forbidden", message: "You cannot delete this comment" },
        { status: 403 }
      );
    }

    // Soft delete the comment
    await db.update(comments).set({ deletedAt: new Date() }).where(eq(comments.id, commentId));

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Delete comment error:", error);
    return NextResponse.json(
      { error: "server_error", message: "Something went wrong" },
      { status: 500 }
    );
  }
}
