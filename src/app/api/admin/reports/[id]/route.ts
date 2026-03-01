import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { resourceReports } from "@/lib/schema";
import type { ReportStatus } from "@/lib/schema";

const updateSchema = z.object({
  status: z.enum(["PENDING", "REVIEWED", "DISMISSED"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = updateSchema.parse(body);

    const [report] = await db
      .update(resourceReports)
      .set({ status: status as ReportStatus })
      .where(eq(resourceReports.id, id))
      .returning();

    return NextResponse.json(report);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    console.error("Report update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
