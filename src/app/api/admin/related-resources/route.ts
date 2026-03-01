import { NextResponse } from "next/server";
import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { resources, users } from "@/lib/schema";
import { findAndSaveRelatedResources } from "@/lib/ai/embeddings";
import { getConfig } from "@/lib/config";

export async function POST() {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, session.user.id));

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if AI search is enabled
    const config = await getConfig();
    if (!config.features.aiSearch) {
      return NextResponse.json(
        { error: "AI search is not enabled" },
        { status: 400 }
      );
    }

    // Get all public resources with embeddings
    const resourceRows = await db
      .select({ id: resources.id })
      .from(resources)
      .where(
        and(
          eq(resources.isPrivate, false),
          isNull(resources.deletedAt),
          isNotNull(resources.embedding),
        )
      )
      .orderBy(desc(resources.createdAt));

    if (resourceRows.length === 0) {
      return NextResponse.json({ error: "No resources to process" }, { status: 400 });
    }

    // Create a streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let success = 0;
        let failed = 0;

        for (let i = 0; i < resourceRows.length; i++) {
          const resource = resourceRows[i];

          try {
            await findAndSaveRelatedResources(resource.id);
            success++;
          } catch (error) {
            console.error(`Failed to generate related resources for ${resource.id}:`, error);
            failed++;
          }

          // Send progress update
          const progress = {
            current: i + 1,
            total: resourceRows.length,
            success,
            failed,
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(progress)}\n\n`));
        }

        // Send final result
        const result = { done: true, success, failed };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(result)}\n\n`));
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
    console.error("Related resources generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate related resources" },
      { status: 500 }
    );
  }
}
