import { NextResponse } from "next/server";
import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { resources } from "@/lib/schema";

function escapeCSVField(field: string): string {
  if (!field) return "";

  const needsQuoting = /[,"\n\r]/.test(field) || field !== field.trim();

  if (needsQuoting) {
    const escaped = field.replace(/"/g, '""');
    return `"${escaped}"`;
  }

  return field;
}

export async function GET() {
  try {
    const resourcesList = await db.query.resources.findMany({
      where: and(
        eq(resources.isPrivate, false),
        isNull(resources.deletedAt),
      ),
      columns: {
        title: true,
        description: true,
        endpointUrl: true,
        serverType: true,
        status: true,
      },
      with: {
        category: {
          columns: {
            slug: true,
          },
        },
        author: {
          columns: {
            username: true,
            githubUsername: true,
          },
        },
      },
      orderBy: asc(resources.createdAt),
    });

    const headers = ["title", "endpoint_url", "server_type", "status", "category", "author"];
    const rows = resourcesList.map((resource) => {
      const title = escapeCSVField(resource.title);
      const endpointUrl = escapeCSVField(resource.endpointUrl);
      const serverType = resource.serverType;
      const status = resource.status;
      const category = escapeCSVField(resource.category?.slug || "");
      const author = escapeCSVField(resource.author.githubUsername || resource.author.username);

      return [title, endpointUrl, serverType, status, category, author].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("resources.csv error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
