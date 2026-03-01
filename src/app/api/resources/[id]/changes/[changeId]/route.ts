import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { resources, changeRequests, users, resourceVersions } from "@/lib/schema";

const updateChangeRequestSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "PENDING"]),
  reviewNote: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; changeId: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "unauthorized", message: "You must be logged in" },
        { status: 401 }
      );
    }

    const { id: resourceId, changeId } = await params;

    // Check if resource exists and user is owner
    const [resource] = await db.select({
      authorId: resources.authorId,
      title: resources.title,
    }).from(resources).where(eq(resources.id, resourceId));

    if (!resource) {
      return NextResponse.json(
        { error: "not_found", message: "Resource not found" },
        { status: 404 }
      );
    }

    if (resource.authorId !== session.user.id) {
      return NextResponse.json(
        { error: "forbidden", message: "Only the resource owner can review change requests" },
        { status: 403 }
      );
    }

    // Get change request with author info
    const [changeRequest] = await db.select({
      id: changeRequests.id,
      resourceId: changeRequests.resourceId,
      status: changeRequests.status,
      proposedContent: changeRequests.proposedContent,
      proposedTitle: changeRequests.proposedTitle,
      authorId: changeRequests.authorId,
      reason: changeRequests.reason,
      authorUsername: users.username,
    })
    .from(changeRequests)
    .innerJoin(users, eq(changeRequests.authorId, users.id))
    .where(eq(changeRequests.id, changeId));

    if (!changeRequest || changeRequest.resourceId !== resourceId) {
      return NextResponse.json(
        { error: "not_found", message: "Change request not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = updateChangeRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "validation_error", message: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { status, reviewNote } = parsed.data;

    // Validate state transitions
    if (changeRequest.status === "PENDING" && status === "PENDING") {
      return NextResponse.json(
        { error: "invalid_state", message: "Change request is already pending" },
        { status: 400 }
      );
    }

    if (changeRequest.status === "APPROVED") {
      return NextResponse.json(
        { error: "invalid_state", message: "Cannot modify an approved change request" },
        { status: 400 }
      );
    }

    // Allow reopening rejected requests (REJECTED -> PENDING)
    if (changeRequest.status === "REJECTED" && status !== "PENDING") {
      return NextResponse.json(
        { error: "invalid_state", message: "Rejected requests can only be reopened" },
        { status: 400 }
      );
    }

    // If reopening, just update status
    if (status === "PENDING") {
      await db.update(changeRequests).set({ status, reviewNote: null }).where(eq(changeRequests.id, changeId));
      return NextResponse.json({ success: true, status });
    }

    // If approving, also update the resource
    if (status === "APPROVED") {
      // Get current version number
      const [latestVersion] = await db.select({ version: resourceVersions.version })
        .from(resourceVersions)
        .where(eq(resourceVersions.resourceId, resourceId))
        .orderBy(desc(resourceVersions.version))
        .limit(1);

      const nextVersion = (latestVersion?.version ?? 0) + 1;

      // Build change note with contributor info
      const changeNote = changeRequest.reason
        ? `Contribution by @${changeRequest.authorUsername}: ${changeRequest.reason}`
        : `Contribution by @${changeRequest.authorUsername}`;

      // Update resource and create version in transaction
      await db.transaction(async (tx) => {
        // Create version record
        await tx.insert(resourceVersions).values({
          resourceId,
          description: changeRequest.proposedContent,
          changeNote,
          version: nextVersion,
          createdBy: changeRequest.authorId,
        });

        // Update resource with proposed changes
        await tx.update(resources).set({
          ...(changeRequest.proposedTitle && { title: changeRequest.proposedTitle }),
        }).where(eq(resources.id, resourceId));

        // Update change request status
        await tx.update(changeRequests).set({ status, reviewNote }).where(eq(changeRequests.id, changeId));
      });
    } else {
      // Just update the change request status
      await db.update(changeRequests).set({ status, reviewNote }).where(eq(changeRequests.id, changeId));
    }

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error("Update change request error:", error);
    return NextResponse.json(
      { error: "server_error", message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; changeId: string }> }
) {
  try {
    const { id: resourceId, changeId } = await params;

    const [changeRequest] = await db.select({
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
      resource: {
        id: resources.id,
        title: resources.title,
      },
    })
    .from(changeRequests)
    .innerJoin(users, eq(changeRequests.authorId, users.id))
    .innerJoin(resources, eq(changeRequests.resourceId, resources.id))
    .where(eq(changeRequests.id, changeId));

    if (!changeRequest || changeRequest.resource.id !== resourceId) {
      return NextResponse.json(
        { error: "not_found", message: "Change request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(changeRequest);
  } catch (error) {
    console.error("Get change request error:", error);
    return NextResponse.json(
      { error: "server_error", message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; changeId: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "unauthorized", message: "You must be logged in" },
        { status: 401 }
      );
    }

    const { id: resourceId, changeId } = await params;

    // Get change request
    const [changeRequest] = await db.select({
      id: changeRequests.id,
      resourceId: changeRequests.resourceId,
      status: changeRequests.status,
      authorId: changeRequests.authorId,
    }).from(changeRequests).where(eq(changeRequests.id, changeId));

    if (!changeRequest || changeRequest.resourceId !== resourceId) {
      return NextResponse.json(
        { error: "not_found", message: "Change request not found" },
        { status: 404 }
      );
    }

    // Only the author can dismiss their own change request
    if (changeRequest.authorId !== session.user.id) {
      return NextResponse.json(
        { error: "forbidden", message: "Only the author can dismiss their change request" },
        { status: 403 }
      );
    }

    // Can only dismiss pending change requests
    if (changeRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "invalid_state", message: "Only pending change requests can be dismissed" },
        { status: 400 }
      );
    }

    // Delete the change request
    await db.delete(changeRequests).where(eq(changeRequests.id, changeId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete change request error:", error);
    return NextResponse.json(
      { error: "server_error", message: "Something went wrong" },
      { status: 500 }
    );
  }
}
