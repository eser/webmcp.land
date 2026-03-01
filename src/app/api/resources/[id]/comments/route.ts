import { NextRequest, NextResponse } from "next/server";
import { and, asc, count, eq, isNull } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { resources, comments, commentVotes, users, notifications } from "@/lib/schema";
import { getConfig } from "@/lib/config";
import { z } from "zod";

const createCommentSchema = z.object({
  content: z.string().min(1).max(10000),
  parentId: z.string().optional(),
});

// GET - Get all comments for a resource
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const config = await getConfig();
    if (config.features.comments === false) {
      return NextResponse.json(
        { error: "feature_disabled", message: "Comments are disabled" },
        { status: 403 }
      );
    }

    const { id: resourceId } = await params;
    const session = await getSession();

    // Check if resource exists
    const [resource] = await db.select({
      id: resources.id,
      isPrivate: resources.isPrivate,
      authorId: resources.authorId,
    }).from(resources).where(and(eq(resources.id, resourceId), isNull(resources.deletedAt)));

    if (!resource) {
      return NextResponse.json(
        { error: "not_found", message: "Resource not found" },
        { status: 404 }
      );
    }

    // Check if user can view private resource
    if (resource.isPrivate && resource.authorId !== session?.user?.id) {
      return NextResponse.json(
        { error: "not_found", message: "Resource not found" },
        { status: 404 }
      );
    }

    const isAdmin = session?.user?.role === "ADMIN";
    const userId = session?.user?.id;

    // Get all comments with author info
    const commentRows = await db.select({
      id: comments.id,
      content: comments.content,
      score: comments.score,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,
      parentId: comments.parentId,
      authorId: comments.authorId,
      flagged: comments.flagged,
      author: {
        id: users.id,
        name: users.name,
        username: users.username,
        avatar: users.avatar,
        role: users.role,
      },
    })
    .from(comments)
    .innerJoin(users, eq(comments.authorId, users.id))
    .where(and(eq(comments.resourceId, resourceId), isNull(comments.deletedAt)))
    .orderBy(asc(comments.createdAt));

    // Get reply counts for all comments
    const replyCounts = await db.select({
      parentId: comments.parentId,
      value: count(),
    })
    .from(comments)
    .where(and(eq(comments.resourceId, resourceId), isNull(comments.deletedAt)))
    .groupBy(comments.parentId);

    const replyCountMap = new Map(replyCounts.filter(r => r.parentId !== null).map(r => [r.parentId!, r.value]));

    // Get user's votes if logged in
    let userVoteMap = new Map<string, number>();
    if (session?.user?.id) {
      const userVotes = await db.select({
        commentId: commentVotes.commentId,
        value: commentVotes.value,
      }).from(commentVotes).where(eq(commentVotes.userId, session.user.id));
      userVoteMap = new Map(userVotes.map(v => [v.commentId, v.value]));
    }

    // Transform and filter comments
    // Shadow-ban: flagged comments only visible to admins and the comment author
    const transformedComments = commentRows
      .filter((comment) => {
        if (isAdmin) return true;
        if (!comment.flagged) return true;
        return comment.authorId === userId;
      })
      .map((comment) => {
        const userVote = userVoteMap.get(comment.id) ?? 0;

        return {
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
          parentId: comment.parentId,
          flagged: isAdmin ? comment.flagged : false,
          author: comment.author,
          score: comment.score,
          userVote,
          replyCount: replyCountMap.get(comment.id) || 0,
        };
      });

    return NextResponse.json({ comments: transformedComments });
  } catch (error) {
    console.error("Get comments error:", error);
    return NextResponse.json(
      { error: "server_error", message: "Something went wrong" },
      { status: 500 }
    );
  }
}

// POST - Create a new comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: resourceId } = await params;
    const body = await request.json();

    const validation = createCommentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "validation_error", message: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { content, parentId } = validation.data;

    // Check if resource exists
    const [resource] = await db.select({
      id: resources.id,
      isPrivate: resources.isPrivate,
      authorId: resources.authorId,
    }).from(resources).where(and(eq(resources.id, resourceId), isNull(resources.deletedAt)));

    if (!resource) {
      return NextResponse.json(
        { error: "not_found", message: "Resource not found" },
        { status: 404 }
      );
    }

    // Check if user can view private resource
    if (resource.isPrivate && resource.authorId !== session.user.id) {
      return NextResponse.json(
        { error: "not_found", message: "Resource not found" },
        { status: 404 }
      );
    }

    // If replying to a comment, verify parent exists and belongs to same resource
    if (parentId) {
      const [parentComment] = await db.select({
        id: comments.id,
        resourceId: comments.resourceId,
      }).from(comments).where(and(eq(comments.id, parentId), isNull(comments.deletedAt)));

      if (!parentComment || parentComment.resourceId !== resourceId) {
        return NextResponse.json(
          { error: "invalid_parent", message: "Parent comment not found" },
          { status: 400 }
        );
      }
    }

    // Create comment
    const [comment] = await db.insert(comments).values({
      content,
      resourceId,
      authorId: session.user.id,
      parentId: parentId || null,
    }).returning();

    // Fetch author info
    const [author] = await db.select({
      id: users.id,
      name: users.name,
      username: users.username,
      avatar: users.avatar,
      role: users.role,
    }).from(users).where(eq(users.id, session.user.id));

    // Create notification for resource owner (if not commenting on own resource)
    if (resource.authorId !== session.user.id) {
      await db.insert(notifications).values({
        type: "COMMENT",
        userId: resource.authorId,
        actorId: session.user.id,
        resourceId,
        commentId: comment.id,
      });
    }

    // If replying to a comment, also notify the parent comment author
    if (parentId) {
      const [parentComment] = await db.select({
        authorId: comments.authorId,
      }).from(comments).where(eq(comments.id, parentId));

      if (parentComment &&
          parentComment.authorId !== session.user.id &&
          parentComment.authorId !== resource.authorId) {
        await db.insert(notifications).values({
          type: "REPLY",
          userId: parentComment.authorId,
          actorId: session.user.id,
          resourceId,
          commentId: comment.id,
        });
      }
    }

    return NextResponse.json({
      comment: {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        parentId: comment.parentId,
        flagged: false,
        author,
        score: 0,
        userVote: 0,
        replyCount: 0,
      },
    });
  } catch (error) {
    console.error("Create comment error:", error);
    return NextResponse.json(
      { error: "server_error", message: "Something went wrong" },
      { status: 500 }
    );
  }
}
