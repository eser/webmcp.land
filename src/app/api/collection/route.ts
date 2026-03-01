import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { collections, resources } from "@/lib/schema";
import { z } from "zod";

const addToCollectionSchema = z.object({
  resourceId: z.string().min(1),
});

export async function GET() {
  const session = await getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await db.query.collections.findMany({
    where: eq(collections.userId, session.user.id),
    orderBy: (table, { desc }) => [desc(table.createdAt)],
    with: {
      resource: {
        with: {
          author: {
            columns: {
              id: true,
              name: true,
              username: true,
              avatar: true,
              verified: true,
            },
          },
          category: {
            with: {
              parent: {
                columns: { id: true, name: true, slug: true },
              },
            },
          },
          tags: {
            with: { tag: true },
          },
          votes: true,
        },
      },
    },
  });

  // Transform to match expected format with _count
  const collectionsData = result.map((c) => ({
    ...c,
    resource: {
      ...c.resource,
      _count: {
        votes: c.resource.votes.length,
      },
      votes: undefined,
    },
  }));

  return NextResponse.json({ collections: collectionsData });
}

export async function POST(req: NextRequest) {
  const session = await getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { resourceId } = addToCollectionSchema.parse(body);

    const [existingCollection] = await db
      .select()
      .from(collections)
      .where(
        and(
          eq(collections.userId, session.user.id),
          eq(collections.resourceId, resourceId),
        ),
      );

    if (existingCollection) {
      return NextResponse.json(
        { error: "Already in collection" },
        { status: 400 },
      );
    }

    const [resource] = await db
      .select({
        id: resources.id,
        isPrivate: resources.isPrivate,
        authorId: resources.authorId,
      })
      .from(resources)
      .where(eq(resources.id, resourceId));

    if (!resource) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 },
      );
    }

    if (resource.isPrivate && resource.authorId !== session.user.id) {
      return NextResponse.json(
        { error: "Cannot add private resource" },
        { status: 403 },
      );
    }

    const [collection] = await db
      .insert(collections)
      .values({
        userId: session.user.id,
        resourceId,
      })
      .returning();

    return NextResponse.json({ collection, added: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    console.error("Failed to add to collection:", error);
    return NextResponse.json(
      { error: "Failed to add to collection" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const resourceId = searchParams.get("resourceId");

    if (!resourceId) {
      return NextResponse.json(
        { error: "resourceId required" },
        { status: 400 },
      );
    }

    await db
      .delete(collections)
      .where(
        and(
          eq(collections.userId, session.user.id),
          eq(collections.resourceId, resourceId),
        ),
      );

    return NextResponse.json({ removed: true });
  } catch (error) {
    console.error("Failed to remove from collection:", error);
    return NextResponse.json(
      { error: "Failed to remove from collection" },
      { status: 500 },
    );
  }
}
