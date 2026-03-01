import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { resources, resourceReports } from "@/lib/schema";

const reportSchema = z.object({
  resourceId: z.string().min(1),
  reason: z.enum(["SPAM", "INAPPROPRIATE", "COPYRIGHT", "MISLEADING", "RELIST_REQUEST", "OTHER"]),
  details: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { resourceId, reason, details } = reportSchema.parse(body);

    // Check if resource exists
    const [resource] = await db.select({
      id: resources.id,
      authorId: resources.authorId,
    }).from(resources).where(eq(resources.id, resourceId));

    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    // Prevent self-reporting (except for relist requests)
    if (resource.authorId === session.user.id && reason !== "RELIST_REQUEST") {
      return NextResponse.json(
        { error: "You cannot report your own resource" },
        { status: 400 }
      );
    }

    // Check if user already reported this resource
    const [existingReport] = await db.select({ id: resourceReports.id }).from(resourceReports).where(
      and(
        eq(resourceReports.resourceId, resourceId),
        eq(resourceReports.reporterId, session.user.id),
        eq(resourceReports.status, "PENDING"),
      )
    ).limit(1);

    if (existingReport) {
      return NextResponse.json(
        { error: "You have already reported this resource" },
        { status: 400 }
      );
    }

    // Create the report
    await db.insert(resourceReports).values({
      resourceId,
      reporterId: session.user.id,
      reason,
      details: details || null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }
    console.error("Report creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
