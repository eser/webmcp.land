import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";

// Update user (role change or verification)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { role, verified, flagged, flaggedReason } = body;

    // Build update data
    const updateData: {
      role?: "ADMIN" | "USER";
      verified?: boolean;
      flagged?: boolean;
      flaggedAt?: Date | null;
      flaggedReason?: string | null;
    } = {};

    if (role !== undefined) {
      if (!["ADMIN", "USER"].includes(role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      updateData.role = role;
    }

    if (verified !== undefined) {
      updateData.verified = verified;
    }

    if (flagged !== undefined) {
      updateData.flagged = flagged;
      if (flagged) {
        updateData.flaggedAt = new Date();
        updateData.flaggedReason = flaggedReason || null;
      } else {
        updateData.flaggedAt = null;
        updateData.flaggedReason = null;
      }
    }

    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        username: users.username,
        name: users.name,
        avatar: users.avatar,
        role: users.role,
        verified: users.verified,
        flagged: users.flagged,
        flaggedAt: users.flaggedAt,
        flaggedReason: users.flaggedReason,
        createdAt: users.createdAt,
      });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

// Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Don't allow deleting yourself
    if (id === session.user.id) {
      return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
    }

    await db.delete(users).where(eq(users.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
