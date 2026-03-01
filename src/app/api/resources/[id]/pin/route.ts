import { NextResponse } from "next/server";
import { and, count, eq, max } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { resources, pinnedResources } from "@/lib/schema";

const MAX_PINNED_RESOURCES = 3;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: resourceId } = await params;

    // Check if resource exists and belongs to user
    const [resource] = await db.select({
      authorId: resources.authorId,
      isPrivate: resources.isPrivate,
    }).from(resources).where(eq(resources.id, resourceId));

    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    if (resource.authorId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only pin your own resources" },
        { status: 403 }
      );
    }

    // Check if already pinned
    const [existingPin] = await db.select().from(pinnedResources).where(
      and(
        eq(pinnedResources.userId, session.user.id),
        eq(pinnedResources.resourceId, resourceId),
      )
    );

    if (existingPin) {
      return NextResponse.json({ error: "Resource already pinned" }, { status: 400 });
    }

    // Check pin limit
    const [{ value: pinnedCount }] = await db.select({ value: count() }).from(pinnedResources).where(eq(pinnedResources.userId, session.user.id));

    if (pinnedCount >= MAX_PINNED_RESOURCES) {
      return NextResponse.json(
        { error: `You can only pin up to ${MAX_PINNED_RESOURCES} resources` },
        { status: 400 }
      );
    }

    // Get next order number
    const [{ value: maxOrder }] = await db.select({ value: max(pinnedResources.order) }).from(pinnedResources).where(eq(pinnedResources.userId, session.user.id));

    const nextOrder = (maxOrder ?? -1) + 1;

    // Create pin
    await db.insert(pinnedResources).values({
      userId: session.user.id,
      resourceId,
      order: nextOrder,
    });

    return NextResponse.json({ success: true, pinned: true });
  } catch (error) {
    console.error("Failed to pin resource:", error);
    return NextResponse.json({ error: "Failed to pin resource" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: resourceId } = await params;

    // Delete the pin
    await db.delete(pinnedResources).where(
      and(
        eq(pinnedResources.userId, session.user.id),
        eq(pinnedResources.resourceId, resourceId),
      )
    );

    return NextResponse.json({ success: true, pinned: false });
  } catch (error) {
    console.error("Failed to unpin resource:", error);
    return NextResponse.json({ error: "Failed to unpin resource" }, { status: 500 });
  }
}
