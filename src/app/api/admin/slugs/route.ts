import { NextResponse } from "next/server";
import { and, count, eq, isNull } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { resources } from "@/lib/schema";
import { generateResourceSlug } from "@/lib/slug";

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "unauthorized", message: "Admin access required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const regenerateAll = searchParams.get("regenerate") === "true";

    // Get resources that need slug generation
    const conditions = [isNull(resources.deletedAt)];
    if (!regenerateAll) {
      conditions.push(isNull(resources.slug));
    }

    const resourceRows = await db
      .select({ id: resources.id, title: resources.title })
      .from(resources)
      .where(and(...conditions));

    if (resourceRows.length === 0) {
      return NextResponse.json({
        success: true,
        updated: 0,
        message: "No resources to update",
      });
    }

    // Stream response for progress updates
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let success = 0;
        let failed = 0;

        for (let i = 0; i < resourceRows.length; i++) {
          const resource = resourceRows[i];

          try {
            const slug = await generateResourceSlug(resource.title);

            await db
              .update(resources)
              .set({ slug })
              .where(eq(resources.id, resource.id));

            success++;
          } catch (error) {
            console.error(`Failed to generate slug for resource ${resource.id}:`, error);
            failed++;
          }

          // Send progress update
          const progress = {
            current: i + 1,
            total: resourceRows.length,
            success,
            failed,
            done: false,
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(progress)}\n\n`));
        }

        // Send final result
        const finalResult = {
          current: resourceRows.length,
          total: resourceRows.length,
          success,
          failed,
          done: true,
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(finalResult)}\n\n`));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Generate slugs error:", error);
    return NextResponse.json(
      { error: "server_error", message: "Something went wrong" },
      { status: 500 }
    );
  }
}

// GET endpoint to check slug status
export async function GET() {
  try {
    const session = await getSession();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "unauthorized", message: "Admin access required" },
        { status: 401 }
      );
    }

    const [[{ resourcesWithoutSlugs }], [{ totalResources }]] = await Promise.all([
      db
        .select({ resourcesWithoutSlugs: count() })
        .from(resources)
        .where(
          and(
            isNull(resources.slug),
            isNull(resources.deletedAt),
          )
        ),
      db
        .select({ totalResources: count() })
        .from(resources)
        .where(isNull(resources.deletedAt)),
    ]);

    return NextResponse.json({
      resourcesWithoutSlugs,
      totalResources,
    });
  } catch (error) {
    console.error("Get slug status error:", error);
    return NextResponse.json(
      { error: "server_error", message: "Something went wrong" },
      { status: 500 }
    );
  }
}
