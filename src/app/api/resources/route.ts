import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { and, count, desc, asc, eq, gte, ilike, inArray, isNull, ne, or, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { resources, users, resourceVotes, resourceTags, tags, categories, resourceConnections, resourceVersions } from "@/lib/schema";
import { triggerWebhooks } from "@/lib/webhook";
import { generateResourceEmbedding, findAndSaveRelatedResources } from "@/lib/ai/embeddings";
import { generateResourceSlug } from "@/lib/slug";

const resourceSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  endpointUrl: z.string().url(),
  serverType: z.enum(["MCP", "WEBMCP"]).default("MCP"),
  capabilities: z.record(z.string(), z.unknown()).optional(),
  methods: z.record(z.string(), z.unknown()).optional(),
  useCases: z.array(z.string()).optional(),
  categoryId: z.string().optional(),
  tagIds: z.array(z.string()),
  isPrivate: z.boolean(),
});

// Create resource
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "unauthorized", message: "You must be logged in" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = resourceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "validation_error", message: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { title, description, endpointUrl, serverType, capabilities, methods, useCases, categoryId, tagIds, isPrivate } = parsed.data;

    // Check if user is flagged (for daily limit)
    const [currentUser] = await db.select({ flagged: users.flagged }).from(users).where(eq(users.id, session.user.id));
    const isUserFlagged = currentUser?.flagged ?? false;

    // Daily limit for flagged users: 5 resources per day
    if (isUserFlagged) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const [{ value: todayResourceCount }] = await db.select({ value: count() }).from(resources).where(
        and(
          eq(resources.authorId, session.user.id),
          gte(resources.createdAt, startOfDay),
        )
      );

      if (todayResourceCount >= 5) {
        return NextResponse.json(
          { error: "daily_limit", message: "You have reached the daily limit of 5 resources" },
          { status: 429 }
        );
      }
    }

    // Rate limit: Check if user created a resource in the last 30 seconds
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
    const [recentResource] = await db.select({ id: resources.id }).from(resources).where(
      and(
        eq(resources.authorId, session.user.id),
        gte(resources.createdAt, thirtySecondsAgo),
      )
    ).limit(1);

    if (recentResource) {
      return NextResponse.json(
        { error: "rate_limit", message: "Please wait 30 seconds before creating another resource" },
        { status: 429 }
      );
    }

    // Check for duplicate title or endpoint URL from the same user
    const [userDuplicate] = await db
      .select({ id: resources.id, slug: resources.slug, title: resources.title })
      .from(resources)
      .where(
        and(
          eq(resources.authorId, session.user.id),
          isNull(resources.deletedAt),
          or(
            ilike(resources.title, title),
            eq(resources.endpointUrl, endpointUrl),
          ),
        )
      )
      .limit(1);

    if (userDuplicate) {
      return NextResponse.json(
        {
          error: "duplicate_resource",
          message: "You already have a resource with the same title or endpoint URL",
          existingResourceId: userDuplicate.id,
          existingResourceSlug: userDuplicate.slug,
        },
        { status: 409 }
      );
    }

    // Generate slug from title (translated to English)
    const slug = await generateResourceSlug(title);

    // Create resource
    const [resource] = await db.insert(resources).values({
      title,
      slug,
      description: description || null,
      endpointUrl,
      serverType,
      capabilities: capabilities || null,
      methods: methods || null,
      useCases: useCases || null,
      isPrivate,
      authorId: session.user.id,
      categoryId: categoryId || null,
    }).returning();

    // Create tags
    if (tagIds.length > 0) {
      await db.insert(resourceTags).values(
        tagIds.map((tagId) => ({
          resourceId: resource.id,
          tagId,
        }))
      );
    }

    // Fetch the created resource with relations for response
    const [author] = await db
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
        avatar: users.avatar,
        verified: users.verified,
      })
      .from(users)
      .where(eq(users.id, session.user.id));

    const category = resource.categoryId
      ? await db.query.categories.findFirst({
          where: eq(categories.id, resource.categoryId),
          with: { parent: true },
        })
      : null;

    const resourceTagRows = await db
      .select({
        resourceId: resourceTags.resourceId,
        tagId: resourceTags.tagId,
        tag: {
          id: tags.id,
          name: tags.name,
          slug: tags.slug,
          color: tags.color,
        },
      })
      .from(resourceTags)
      .innerJoin(tags, eq(resourceTags.tagId, tags.id))
      .where(eq(resourceTags.resourceId, resource.id));

    const responseResource = {
      ...resource,
      author,
      category,
      tags: resourceTagRows,
    };

    // Create initial version
    await db.insert(resourceVersions).values({
      resourceId: resource.id,
      version: 1,
      description: description || null,
      capabilities: capabilities || null,
      methods: methods || null,
      changeNote: "Initial version",
      createdBy: session.user.id,
    });

    // Trigger webhooks for new resource (non-blocking)
    if (!isPrivate) {
      triggerWebhooks("RESOURCE_CREATED", {
        id: resource.id,
        title: resource.title,
        description: resource.description,
        endpointUrl: resource.endpointUrl,
        serverType: resource.serverType,
        isPrivate: resource.isPrivate,
        author,
        category: category ? { name: category.name, slug: category.slug } : null,
        tags: resourceTagRows,
      });
    }

    // Generate embedding for AI search (non-blocking)
    if (!isPrivate) {
      generateResourceEmbedding(resource.id)
        .then(() => findAndSaveRelatedResources(resource.id))
        .catch((err) =>
          console.error("Failed to generate embedding/related resources for:", resource.id, err)
        );
    }

    // Revalidate caches (resources, categories, tags counts change)
    revalidateTag("resources", "max");
    revalidateTag("categories", "max");
    revalidateTag("tags", "max");

    return NextResponse.json(responseResource);
  } catch (error) {
    console.error("Create resource error:", error);
    return NextResponse.json(
      { error: "server_error", message: "Something went wrong" },
      { status: 500 }
    );
  }
}

// List resources (for API access)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("perPage") || "24");
    const serverType = searchParams.get("serverType");
    const categoryId = searchParams.get("category");
    const tag = searchParams.get("tag");
    const sort = searchParams.get("sort");
    const q = searchParams.get("q");

    // Build WHERE conditions
    const conditions = [
      eq(resources.isPrivate, false),
      isNull(resources.deletedAt),
    ];

    if (serverType) {
      conditions.push(eq(resources.serverType, serverType as "MCP" | "WEBMCP"));
    }

    if (categoryId) {
      conditions.push(eq(resources.categoryId, categoryId));
    }

    if (q) {
      conditions.push(
        or(
          ilike(resources.title, `%${q}%`),
          ilike(resources.description, `%${q}%`),
        )!
      );
    }

    // Handle tag filtering - for each tag slug, add a subquery condition
    if (tag) {
      const tagSlugs = tag.split(",").map(t => t.trim()).filter(Boolean);
      for (const slug of tagSlugs) {
        conditions.push(
          sql`EXISTS (
            SELECT 1 FROM ${resourceTags}
            INNER JOIN ${tags} ON ${resourceTags.tagId} = ${tags.id}
            WHERE ${resourceTags.resourceId} = ${resources.id}
            AND ${tags.slug} = ${slug}
          )`
        );
      }
    }

    // Exclude intermediate flow resources (only show first resources or standalone)
    // "related" connections are AI-suggested similar resources, not flow connections
    conditions.push(
      sql`NOT EXISTS (
        SELECT 1 FROM ${resourceConnections}
        WHERE ${resourceConnections.targetId} = ${resources.id}
        AND ${resourceConnections.label} != 'related'
      )`
    );

    const whereClause = and(...conditions);

    // Build order by clause
    let orderByClause;
    if (sort === "oldest") {
      orderByClause = asc(resources.createdAt);
    } else if (sort === "upvotes") {
      orderByClause = desc(
        sql`(SELECT COUNT(*) FROM ${resourceVotes} WHERE ${resourceVotes.resourceId} = ${resources.id})`
      );
    } else {
      orderByClause = desc(resources.createdAt);
    }

    const [resourcesRaw, [{ value: total }]] = await Promise.all([
      db
        .select()
        .from(resources)
        .where(whereClause)
        .orderBy(orderByClause)
        .offset((page - 1) * perPage)
        .limit(perPage),
      db.select({ value: count() }).from(resources).where(whereClause),
    ]);

    // Fetch related data for each resource
    const resourceIds = resourcesRaw.map(p => p.id);

    if (resourceIds.length === 0) {
      return NextResponse.json({
        resources: [],
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      });
    }

    // Batch fetch all related data
    const [authorRows, categoryRows, tagRows, voteCounts, outgoingConnectionCounts, incomingConnectionCounts] = await Promise.all([
      // Authors
      db.select({
        id: users.id,
        name: users.name,
        username: users.username,
        avatar: users.avatar,
        verified: users.verified,
      }).from(users).where(inArray(users.id, resourcesRaw.map(p => p.authorId))),
      // Categories
      db.query.categories.findMany({
        where: inArray(categories.id, resourcesRaw.map(p => p.categoryId).filter((id): id is string => id !== null)),
        with: {
          parent: {
            columns: { id: true, name: true, slug: true },
          },
        },
      }),
      // Tags
      db.select({
        resourceId: resourceTags.resourceId,
        tagId: resourceTags.tagId,
        tag: {
          id: tags.id,
          name: tags.name,
          slug: tags.slug,
          color: tags.color,
        },
      }).from(resourceTags).innerJoin(tags, eq(resourceTags.tagId, tags.id)).where(inArray(resourceTags.resourceId, resourceIds)),
      // Vote counts
      db.select({
        resourceId: resourceVotes.resourceId,
        value: count(),
      }).from(resourceVotes).where(inArray(resourceVotes.resourceId, resourceIds)).groupBy(resourceVotes.resourceId),
      // Outgoing connection counts (non-related)
      db.select({
        sourceId: resourceConnections.sourceId,
        value: count(),
      }).from(resourceConnections).where(and(inArray(resourceConnections.sourceId, resourceIds), ne(resourceConnections.label, "related"))).groupBy(resourceConnections.sourceId),
      // Incoming connection counts (non-related)
      db.select({
        targetId: resourceConnections.targetId,
        value: count(),
      }).from(resourceConnections).where(and(inArray(resourceConnections.targetId, resourceIds), ne(resourceConnections.label, "related"))).groupBy(resourceConnections.targetId),
    ]);

    // Build lookup maps
    const authorMap = new Map(authorRows.map(a => [a.id, a]));
    const categoryMap = new Map(categoryRows.map(c => [c.id, c]));
    const tagMap = new Map<string, typeof tagRows>();
    for (const t of tagRows) {
      if (!tagMap.has(t.resourceId)) tagMap.set(t.resourceId, []);
      tagMap.get(t.resourceId)!.push(t);
    }
    const voteCountMap = new Map(voteCounts.map(v => [v.resourceId, v.value]));
    const outgoingMap = new Map(outgoingConnectionCounts.map(c => [c.sourceId, c.value]));
    const incomingMap = new Map(incomingConnectionCounts.map(c => [c.targetId, c.value]));

    // Transform to include voteCount, exclude internal fields
    const resourcesList = resourcesRaw.map(({ embedding: _e, isPrivate: _p, deletedAt: _d, ...p }) => {
      return {
        ...p,
        author: authorMap.get(p.authorId) || null,
        category: p.categoryId ? categoryMap.get(p.categoryId) || null : null,
        tags: tagMap.get(p.id) || [],
        _count: {
          votes: voteCountMap.get(p.id) || 0,
          outgoingConnections: outgoingMap.get(p.id) || 0,
          incomingConnections: incomingMap.get(p.id) || 0,
        },
        voteCount: voteCountMap.get(p.id) || 0,
      };
    });

    return NextResponse.json({
      resources: resourcesList,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    });
  } catch (error) {
    console.error("List resources error:", error);
    return NextResponse.json(
      { error: "server_error", message: "Something went wrong" },
      { status: 500 }
    );
  }
}
