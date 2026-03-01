import { NextResponse } from "next/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { resources } from "@/lib/schema";

export async function GET() {
  try {
    const resourcesList = await db.query.resources.findMany({
      where: and(
        eq(resources.isPrivate, false),
        isNull(resources.deletedAt),
      ),
      columns: {
        id: true,
        title: true,
        slug: true,
        description: true,
        endpointUrl: true,
        serverType: true,
        status: true,
        capabilities: true,
        methods: true,
        useCases: true,
        viewCount: true,
        createdAt: true,
        updatedAt: true,
        isFeatured: true,
        featuredAt: true,
        lastDiscoveredAt: true,
        healthCheckAt: true,
      },
      with: {
        category: {
          columns: {
            id: true,
            name: true,
            slug: true,
            icon: true,
          },
        },
        author: {
          columns: {
            username: true,
            name: true,
            avatar: true,
            githubUsername: true,
            verified: true,
          },
        },
        tags: {
          columns: {},
          with: {
            tag: {
              columns: {
                id: true,
                name: true,
                slug: true,
                color: true,
              },
            },
          },
        },
        votes: true,
        comments: true,
      },
      orderBy: desc(resources.createdAt),
    });

    const formattedResources = resourcesList.map((resource) => ({
      id: resource.id,
      title: resource.title,
      slug: resource.slug,
      description: resource.description,
      endpointUrl: resource.endpointUrl,
      serverType: resource.serverType,
      status: resource.status,
      capabilities: resource.capabilities,
      methods: resource.methods,
      useCases: resource.useCases,
      viewCount: resource.viewCount,
      voteCount: resource.votes.length,
      commentCount: resource.comments.length,
      isFeatured: resource.isFeatured,
      featuredAt: resource.featuredAt,
      lastDiscoveredAt: resource.lastDiscoveredAt,
      healthCheckAt: resource.healthCheckAt,
      createdAt: resource.createdAt,
      updatedAt: resource.updatedAt,
      category: resource.category
        ? {
            id: resource.category.id,
            name: resource.category.name,
            slug: resource.category.slug,
            icon: resource.category.icon,
          }
        : null,
      author: {
        username: resource.author.username,
        name: resource.author.name,
        avatar: resource.author.avatar,
        identifier: resource.author.githubUsername || resource.author.username,
        verified: resource.author.verified,
      },
      tags: resource.tags.map((pt) => ({
        id: pt.tag.id,
        name: pt.tag.name,
        slug: pt.tag.slug,
        color: pt.tag.color,
      })),
    }));

    return NextResponse.json(
      {
        count: formattedResources.length,
        resources: formattedResources,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=3600",
        },
      }
    );
  } catch (error) {
    console.error("resources.json error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
