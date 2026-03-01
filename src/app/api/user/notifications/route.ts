import { NextResponse } from "next/server";
import { and, count, desc, eq, inArray } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { changeRequests, notifications, resources, users } from "@/lib/schema";

const DEFAULT_RESPONSE = {
  pendingChangeRequests: 0,
  unreadComments: 0,
  commentNotifications: [],
};

export async function GET() {
  let session;
  try {
    session = await getSession();
  } catch (error) {
    console.error("Auth error in notifications:", error);
    return NextResponse.json(DEFAULT_RESPONSE);
  }

  if (!session?.user?.id) {
    return NextResponse.json(DEFAULT_RESPONSE);
  }

  try {
    // Count pending change requests on user's resources
    const [pendingResult] = await db
      .select({ value: count() })
      .from(changeRequests)
      .innerJoin(resources, eq(changeRequests.resourceId, resources.id))
      .where(
        and(
          eq(changeRequests.status, "PENDING"),
          eq(resources.authorId, session.user.id),
        ),
      );
    const pendingCount = pendingResult?.value ?? 0;

    // Get unread comment notifications with actor info
    const commentNotificationRows = await db
      .select({
        id: notifications.id,
        type: notifications.type,
        createdAt: notifications.createdAt,
        resourceId: notifications.resourceId,
        actorId: users.id,
        actorName: users.name,
        actorUsername: users.username,
        actorAvatar: users.avatar,
      })
      .from(notifications)
      .leftJoin(users, eq(notifications.actorId, users.id))
      .where(
        and(
          eq(notifications.userId, session.user.id),
          eq(notifications.read, false),
          inArray(notifications.type, ["COMMENT", "REPLY"]),
        ),
      )
      .orderBy(desc(notifications.createdAt))
      .limit(10);

    // Get resource titles for notifications
    const resourceIds = [
      ...new Set(
        commentNotificationRows.map((n) => n.resourceId).filter(Boolean),
      ),
    ] as string[];

    let resourceMap = new Map<string, string>();
    if (resourceIds.length > 0) {
      const resourceRows = await db
        .select({ id: resources.id, title: resources.title })
        .from(resources)
        .where(inArray(resources.id, resourceIds));
      resourceMap = new Map(resourceRows.map((r) => [r.id, r.title]));
    }

    const formattedNotifications = commentNotificationRows.map((n) => ({
      id: n.id,
      type: n.type,
      createdAt: n.createdAt,
      actor: n.actorId
        ? {
            id: n.actorId,
            name: n.actorName,
            username: n.actorUsername,
            avatar: n.actorAvatar,
          }
        : null,
      resourceId: n.resourceId,
      resourceTitle: n.resourceId ? resourceMap.get(n.resourceId) : null,
    }));

    return NextResponse.json({
      pendingChangeRequests: pendingCount,
      unreadComments: commentNotificationRows.length,
      commentNotifications: formattedNotifications,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    return NextResponse.json(DEFAULT_RESPONSE);
  }
}

// POST - Mark notifications as read
export async function POST(request: Request) {
  let session;
  try {
    session = await getSession();
  } catch (error) {
    console.error("Auth error in notifications:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { notificationIds } = body;

    if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      await db
        .update(notifications)
        .set({ read: true })
        .where(
          and(
            inArray(notifications.id, notificationIds),
            eq(notifications.userId, session.user.id),
          ),
        );
    } else {
      // Mark all notifications as read
      await db
        .update(notifications)
        .set({ read: true })
        .where(
          and(
            eq(notifications.userId, session.user.id),
            eq(notifications.read, false),
          ),
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark notifications read error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
