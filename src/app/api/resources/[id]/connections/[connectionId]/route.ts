import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { resources, resourceConnections } from "@/lib/schema";

const updateConnectionSchema = z.object({
  label: z.string().min(1).max(100).optional(),
  order: z.number().int().min(0).optional(),
});

interface RouteParams {
  params: Promise<{ id: string; connectionId: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, connectionId } = await params;

  try {
    // Fetch connection with source resource author
    const [connection] = await db.select({
      id: resourceConnections.id,
      sourceId: resourceConnections.sourceId,
      targetId: resourceConnections.targetId,
      label: resourceConnections.label,
      order: resourceConnections.order,
      sourceAuthorId: resources.authorId,
    })
    .from(resourceConnections)
    .innerJoin(resources, eq(resourceConnections.sourceId, resources.id))
    .where(eq(resourceConnections.id, connectionId));

    if (!connection) {
      return NextResponse.json(
        { error: "Connection not found" },
        { status: 404 }
      );
    }

    if (connection.sourceId !== id) {
      return NextResponse.json(
        { error: "Connection does not belong to this resource" },
        { status: 400 }
      );
    }

    if (
      connection.sourceAuthorId !== session.user.id &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json(
        { error: "You can only delete connections from your own resources" },
        { status: 403 }
      );
    }

    await db.delete(resourceConnections).where(eq(resourceConnections.id, connectionId));

    // Revalidate the resource page and flow cache
    revalidatePath(`/resources/${id}`);
    revalidateTag("resource-flow", "max");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete connection:", error);
    return NextResponse.json(
      { error: "Failed to delete connection" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, connectionId } = await params;

  try {
    const body = await request.json();
    const data = updateConnectionSchema.parse(body);

    // Fetch connection with source resource author
    const [connection] = await db.select({
      id: resourceConnections.id,
      sourceId: resourceConnections.sourceId,
      targetId: resourceConnections.targetId,
      label: resourceConnections.label,
      order: resourceConnections.order,
      sourceAuthorId: resources.authorId,
    })
    .from(resourceConnections)
    .innerJoin(resources, eq(resourceConnections.sourceId, resources.id))
    .where(eq(resourceConnections.id, connectionId));

    if (!connection) {
      return NextResponse.json(
        { error: "Connection not found" },
        { status: 404 }
      );
    }

    if (connection.sourceId !== id) {
      return NextResponse.json(
        { error: "Connection does not belong to this resource" },
        { status: 400 }
      );
    }

    if (
      connection.sourceAuthorId !== session.user.id &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json(
        { error: "You can only update connections on your own resources" },
        { status: 403 }
      );
    }

    const [updated] = await db.update(resourceConnections).set(data).where(eq(resourceConnections.id, connectionId)).returning();

    // Fetch target info for response
    const [target] = await db.select({
      id: resources.id,
      title: resources.title,
      slug: resources.slug,
    }).from(resources).where(eq(resources.id, updated.targetId));

    // Revalidate resource flow cache
    revalidateTag("resource-flow", "max");

    return NextResponse.json({ ...updated, target });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Failed to update connection:", error);
    return NextResponse.json(
      { error: "Failed to update connection" },
      { status: 500 }
    );
  }
}
