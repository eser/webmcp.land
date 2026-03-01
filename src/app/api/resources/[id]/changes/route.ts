import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { resources, changeRequests, users } from "@/lib/schema";

const createChangeRequestSchema = z.object({
  proposedContent: z.string().min(1),
  proposedTitle: z.string().optional(),
  reason: z.string().optional(),
});

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
    const [resource] = await db.select({
      id: resources.id,
      authorId: resources.authorId,
      isPrivate: resources.isPrivate,
      title: resources.title,
    }).from(resources).where(eq(resources.id, resourceId));

    if (!resource) {
      return NextResponse.json(
        { error: "not_found", message: "Resource not found" },
        { status: 404 }
      );
    }

    // Can't create change request for your own resource
    if (resource.authorId === session.user.id) {
      return NextResponse.json(
        { error: "forbidden", message: "You cannot create a change request for your own resource" },
        { status: 403 }
      );
    }

    // Can't create change request for private resources
    if (resource.isPrivate) {
      return NextResponse.json(
        { error: "forbidden", message: "Cannot create change request for private resources" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = createChangeRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "validation_error", message: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { proposedContent, proposedTitle, reason } = parsed.data;

    const [changeRequest] = await db.insert(changeRequests).values({
      originalContent: resource.title,
      originalTitle: resource.title,
      proposedContent,
      proposedTitle,
      reason,
      resourceId,
      authorId: session.user.id,
    }).returning();

    return NextResponse.json(changeRequest, { status: 201 });
  } catch (error) {
    console.error("Create change request error:", error);
    return NextResponse.json(
      { error: "server_error", message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: resourceId } = await params;

    const changeRequestRows = await db.select({
      id: changeRequests.id,
      proposedContent: changeRequests.proposedContent,
      proposedTitle: changeRequests.proposedTitle,
      reason: changeRequests.reason,
      status: changeRequests.status,
      reviewNote: changeRequests.reviewNote,
      createdAt: changeRequests.createdAt,
      updatedAt: changeRequests.updatedAt,
      resourceId: changeRequests.resourceId,
      authorId: changeRequests.authorId,
      originalContent: changeRequests.originalContent,
      originalTitle: changeRequests.originalTitle,
      author: {
        id: users.id,
        name: users.name,
        username: users.username,
        avatar: users.avatar,
      },
    })
    .from(changeRequests)
    .innerJoin(users, eq(changeRequests.authorId, users.id))
    .where(eq(changeRequests.resourceId, resourceId))
    .orderBy(desc(changeRequests.createdAt));

    return NextResponse.json(changeRequestRows);
  } catch (error) {
    console.error("Get change requests error:", error);
    return NextResponse.json(
      { error: "server_error", message: "Something went wrong" },
      { status: 500 }
    );
  }
}
