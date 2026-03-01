import { NextRequest, NextResponse } from "next/server";
import { and, count, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { resources, resourceVotes } from "@/lib/schema";

// POST - Upvote a resource
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "unauthorized", message: "You must be logged in" },
        { status: 401 }
      );
    }

    const { id: resourceId } = await params;

    // Check if resource exists
    const [resource] = await db.select({ id: resources.id }).from(resources).where(eq(resources.id, resourceId));

    if (!resource) {
      return NextResponse.json(
        { error: "not_found", message: "Resource not found" },
        { status: 404 }
      );
    }

    // Check if already voted
    const [existing] = await db.select().from(resourceVotes).where(
      and(
        eq(resourceVotes.userId, session.user.id),
        eq(resourceVotes.resourceId, resourceId),
      )
    );

    if (existing) {
      return NextResponse.json(
        { error: "already_voted", message: "You have already upvoted this resource" },
        { status: 400 }
      );
    }

    // Create vote
    await db.insert(resourceVotes).values({
      userId: session.user.id,
      resourceId,
    });

    // Get updated vote count
    const [{ value: voteCount }] = await db.select({ value: count() }).from(resourceVotes).where(eq(resourceVotes.resourceId, resourceId));

    return NextResponse.json({ voted: true, voteCount });
  } catch (error) {
    console.error("Vote error:", error);
    return NextResponse.json(
      { error: "server_error", message: "Something went wrong" },
      { status: 500 }
    );
  }
}

// DELETE - Remove upvote from a resource
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "unauthorized", message: "You must be logged in" },
        { status: 401 }
      );
    }

    const { id: resourceId } = await params;

    // Delete vote
    await db.delete(resourceVotes).where(
      and(
        eq(resourceVotes.userId, session.user.id),
        eq(resourceVotes.resourceId, resourceId),
      )
    );

    // Get updated vote count
    const [{ value: voteCount }] = await db.select({ value: count() }).from(resourceVotes).where(eq(resourceVotes.resourceId, resourceId));

    return NextResponse.json({ voted: false, voteCount });
  } catch (error) {
    console.error("Unvote error:", error);
    return NextResponse.json(
      { error: "server_error", message: "Something went wrong" },
      { status: 500 }
    );
  }
}
