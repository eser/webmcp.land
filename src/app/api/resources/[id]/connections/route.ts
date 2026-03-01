import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { and, asc, desc, eq, isNull, ne } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { resources, resourceConnections } from "@/lib/schema";

const createConnectionSchema = z.object({
  targetId: z.string().min(1),
  label: z.string().min(1).max(100),
  order: z.number().int().min(0).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const [resource] = await db.select({
      id: resources.id,
      isPrivate: resources.isPrivate,
      authorId: resources.authorId,
    }).from(resources).where(and(eq(resources.id, id), isNull(resources.deletedAt)));

    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    // Get all outgoing connections (exclude "related" label)
    const outgoingRaw = await db.select({
      id: resourceConnections.id,
      sourceId: resourceConnections.sourceId,
      targetId: resourceConnections.targetId,
      label: resourceConnections.label,
      order: resourceConnections.order,
      createdAt: resourceConnections.createdAt,
      updatedAt: resourceConnections.updatedAt,
      target: {
        id: resources.id,
        title: resources.title,
        slug: resources.slug,
        isPrivate: resources.isPrivate,
        authorId: resources.authorId,
      },
    })
    .from(resourceConnections)
    .innerJoin(resources, eq(resourceConnections.targetId, resources.id))
    .where(and(eq(resourceConnections.sourceId, id), ne(resourceConnections.label, "related")))
    .orderBy(asc(resourceConnections.order));

    // Get all incoming connections (exclude "related" label)
    const incomingRaw = await db.select({
      id: resourceConnections.id,
      sourceId: resourceConnections.sourceId,
      targetId: resourceConnections.targetId,
      label: resourceConnections.label,
      order: resourceConnections.order,
      createdAt: resourceConnections.createdAt,
      updatedAt: resourceConnections.updatedAt,
      source: {
        id: resources.id,
        title: resources.title,
        slug: resources.slug,
        isPrivate: resources.isPrivate,
        authorId: resources.authorId,
      },
    })
    .from(resourceConnections)
    .innerJoin(resources, eq(resourceConnections.sourceId, resources.id))
    .where(and(eq(resourceConnections.targetId, id), ne(resourceConnections.label, "related")))
    .orderBy(asc(resourceConnections.order));

    // Filter out private resources the user can't see
    const session = await getSession();
    const userId = session?.user?.id;

    const filteredOutgoing = outgoingRaw.filter(
      (c) => !c.target.isPrivate || c.target.authorId === userId
    );

    const filteredIncoming = incomingRaw.filter(
      (c) => !c.source.isPrivate || c.source.authorId === userId
    );

    return NextResponse.json({
      outgoing: filteredOutgoing,
      incoming: filteredIncoming,
    });
  } catch (error) {
    console.error("Failed to fetch connections:", error);
    return NextResponse.json(
      { error: "Failed to fetch connections" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { targetId, label, order } = createConnectionSchema.parse(body);

    // Verify source resource exists and user owns it
    const [sourceResource] = await db.select({
      authorId: resources.authorId,
    }).from(resources).where(and(eq(resources.id, id), isNull(resources.deletedAt)));

    if (!sourceResource) {
      return NextResponse.json(
        { error: "Source resource not found" },
        { status: 404 }
      );
    }

    if (
      sourceResource.authorId !== session.user.id &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json(
        { error: "You can only add connections to your own resources" },
        { status: 403 }
      );
    }

    // Verify target resource exists and belongs to the user
    const [targetResource] = await db.select({
      id: resources.id,
      title: resources.title,
      authorId: resources.authorId,
    }).from(resources).where(and(eq(resources.id, targetId), isNull(resources.deletedAt)));

    if (!targetResource) {
      return NextResponse.json(
        { error: "Target resource not found" },
        { status: 404 }
      );
    }

    // Verify user owns the target resource (users can only connect their own resources)
    if (
      targetResource.authorId !== session.user.id &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json(
        { error: "You can only connect to your own resources" },
        { status: 403 }
      );
    }

    // Prevent self-connection
    if (id === targetId) {
      return NextResponse.json(
        { error: "Cannot connect a resource to itself" },
        { status: 400 }
      );
    }

    // Check if connection already exists
    const [existing] = await db.select().from(resourceConnections).where(
      and(
        eq(resourceConnections.sourceId, id),
        eq(resourceConnections.targetId, targetId),
      )
    );

    if (existing) {
      return NextResponse.json(
        { error: "Connection already exists" },
        { status: 400 }
      );
    }

    // Calculate order if not provided
    let connectionOrder = order;
    if (connectionOrder === undefined) {
      const [lastConnection] = await db.select({ order: resourceConnections.order })
        .from(resourceConnections)
        .where(eq(resourceConnections.sourceId, id))
        .orderBy(desc(resourceConnections.order))
        .limit(1);
      connectionOrder = (lastConnection?.order ?? -1) + 1;
    }

    const [connection] = await db.insert(resourceConnections).values({
      sourceId: id,
      targetId,
      label,
      order: connectionOrder,
    }).returning();

    // Fetch target info for response
    const responseConnection = {
      ...connection,
      target: {
        id: targetResource.id,
        title: targetResource.title,
        slug: null as string | null,
      },
    };

    // Get the slug
    const [targetWithSlug] = await db.select({ slug: resources.slug }).from(resources).where(eq(resources.id, targetId));
    responseConnection.target.slug = targetWithSlug?.slug ?? null;

    // Revalidate resource flow cache
    revalidateTag("resource-flow", "max");

    return NextResponse.json(responseConnection, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Failed to create connection:", error);
    return NextResponse.json(
      { error: "Failed to create connection" },
      { status: 500 }
    );
  }
}
