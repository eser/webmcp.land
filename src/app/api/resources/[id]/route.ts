import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { and, count, desc, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { resources, users, resourceVotes, resourceTags, tags, categories, resourceVersions, resourceConnections } from "@/lib/schema";
import { generateResourceEmbedding, findAndSaveRelatedResources } from "@/lib/ai/embeddings";
import { generateResourceSlug } from "@/lib/slug";

const updateResourceSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  endpointUrl: z.string().url().optional(),
  serverType: z.enum(["MCP", "WEBMCP"]).optional(),
  status: z.enum(["PENDING", "ACTIVE", "UNREACHABLE", "SUSPENDED"]).optional(),
  capabilities: z.record(z.string(), z.unknown()).optional().nullable(),
  methods: z.record(z.string(), z.unknown()).optional().nullable(),
  useCases: z.array(z.string()).optional().nullable(),
  categoryId: z.string().optional().nullable(),
  tagIds: z.array(z.string()).optional(),
  isPrivate: z.boolean().optional(),
});

// Get single resource
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();

    const [resource] = await db.select().from(resources).where(eq(resources.id, id));

    if (!resource || resource.deletedAt) {
      return NextResponse.json(
        { error: "not_found", message: "Resource not found" },
        { status: 404 }
      );
    }

    // Check if user can view private resource
    if (resource.isPrivate && resource.authorId !== session?.user?.id) {
      return NextResponse.json(
        { error: "forbidden", message: "This resource is private" },
        { status: 403 }
      );
    }

    // Fetch related data
    const [author] = await db.select({
      id: users.id,
      name: users.name,
      username: users.username,
      avatar: users.avatar,
      verified: users.verified,
    }).from(users).where(eq(users.id, resource.authorId));

    const category = resource.categoryId
      ? await db.query.categories.findFirst({
          where: eq(categories.id, resource.categoryId),
          with: { parent: true },
        })
      : null;

    const tagRows = await db.select({
      resourceId: resourceTags.resourceId,
      tagId: resourceTags.tagId,
      tag: {
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
        color: tags.color,
      },
    }).from(resourceTags).innerJoin(tags, eq(resourceTags.tagId, tags.id)).where(eq(resourceTags.resourceId, id));

    const versions = await db.select().from(resourceVersions).where(eq(resourceVersions.resourceId, id)).orderBy(desc(resourceVersions.version)).limit(10);

    const [{ value: voteCount }] = await db.select({ value: count() }).from(resourceVotes).where(eq(resourceVotes.resourceId, id));

    // Check if logged-in user has voted
    let hasVoted = false;
    if (session?.user?.id) {
      const [vote] = await db.select().from(resourceVotes).where(
        and(
          eq(resourceVotes.userId, session.user.id),
          eq(resourceVotes.resourceId, id),
        )
      );
      hasVoted = !!vote;
    }

    // Omit embedding from response (it's large binary data)
    const { embedding: _embedding, ...resourceWithoutEmbedding } = resource;

    return NextResponse.json({
      ...resourceWithoutEmbedding,
      author,
      category,
      tags: tagRows,
      versions,
      _count: { votes: voteCount },
      voteCount,
      hasVoted,
    });
  } catch (error) {
    console.error("Get resource error:", error);
    return NextResponse.json(
      { error: "server_error", message: "Something went wrong" },
      { status: 500 }
    );
  }
}

// Update resource
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: "unauthorized", message: "You must be logged in" },
        { status: 401 }
      );
    }

    // Check if resource exists and user owns it
    const [existing] = await db.select({
      authorId: resources.authorId,
      description: resources.description,
    }).from(resources).where(eq(resources.id, id));

    if (!existing) {
      return NextResponse.json(
        { error: "not_found", message: "Resource not found" },
        { status: 404 }
      );
    }

    if (existing.authorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "forbidden", message: "You can only edit your own resources" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = updateResourceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "validation_error", message: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { tagIds, categoryId, title, ...data } = parsed.data;

    // Regenerate slug if title changed
    let newSlug: string | undefined;
    if (title) {
      newSlug = await generateResourceSlug(title);
    }

    // Convert empty strings to null for optional foreign keys
    const cleanedData: Record<string, unknown> = {
      ...data,
      ...(title && { title }),
      ...(newSlug && { slug: newSlug }),
      ...(categoryId !== undefined && { categoryId: categoryId || null }),
    };

    // Update resource
    const [updatedResource] = await db.update(resources).set(cleanedData).where(eq(resources.id, id)).returning();

    // Update tags if provided
    if (tagIds) {
      await db.delete(resourceTags).where(eq(resourceTags.resourceId, id));
      if (tagIds.length > 0) {
        await db.insert(resourceTags).values(
          tagIds.map((tagId) => ({ resourceId: id, tagId }))
        );
      }
    }

    // Fetch related data for response
    const [author] = await db.select({
      id: users.id,
      name: users.name,
      username: users.username,
    }).from(users).where(eq(users.id, updatedResource.authorId));

    const category = updatedResource.categoryId
      ? await db.query.categories.findFirst({
          where: eq(categories.id, updatedResource.categoryId),
          with: { parent: true },
        })
      : null;

    const tagRows = await db.select({
      resourceId: resourceTags.resourceId,
      tagId: resourceTags.tagId,
      tag: {
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
        color: tags.color,
      },
    }).from(resourceTags).innerJoin(tags, eq(resourceTags.tagId, tags.id)).where(eq(resourceTags.resourceId, id));

    const resource = {
      ...updatedResource,
      author,
      category,
      tags: tagRows,
    };

    // Create new version if description or capabilities changed
    if (data.description && data.description !== existing.description) {
      const [latestVersion] = await db.select({ version: resourceVersions.version })
        .from(resourceVersions)
        .where(eq(resourceVersions.resourceId, id))
        .orderBy(desc(resourceVersions.version))
        .limit(1);

      await db.insert(resourceVersions).values({
        resourceId: id,
        version: (latestVersion?.version || 0) + 1,
        description: data.description,
        capabilities: data.capabilities || null,
        methods: data.methods || null,
        changeNote: "Resource updated",
        createdBy: session.user.id,
      });
    }

    // Regenerate embedding if title or description changed (non-blocking)
    const contentChanged = title || data.description !== undefined;
    if (contentChanged && !resource.isPrivate) {
      generateResourceEmbedding(id)
        .then(() => findAndSaveRelatedResources(id))
        .catch((err) =>
          console.error("Failed to regenerate embedding/related resources for:", id, err)
        );
    }

    // Revalidate resources and flow cache
    revalidateTag("resources", "max");
    revalidateTag("resource-flow", "max");

    return NextResponse.json(resource);
  } catch (error) {
    console.error("Update resource error:", error);
    return NextResponse.json(
      { error: "server_error", message: "Something went wrong" },
      { status: 500 }
    );
  }
}

// Soft delete resource
// - Admins can delete any resource
// - Owners can delete their own resources
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: "unauthorized", message: "You must be logged in" },
        { status: 401 }
      );
    }

    // Check if resource exists and get ownership status
    const [existing] = await db.select({
      id: resources.id,
      deletedAt: resources.deletedAt,
      authorId: resources.authorId,
    }).from(resources).where(eq(resources.id, id));

    if (!existing) {
      return NextResponse.json(
        { error: "not_found", message: "Resource not found" },
        { status: 404 }
      );
    }

    if (existing.deletedAt) {
      return NextResponse.json(
        { error: "already_deleted", message: "Resource is already deleted" },
        { status: 400 }
      );
    }

    const isAdmin = session.user.role === "ADMIN";
    const isOwner = existing.authorId === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        {
          error: "forbidden",
          message: "You can only delete your own resources. Contact an admin if there is an issue."
        },
        { status: 403 }
      );
    }

    // Soft delete by setting deletedAt timestamp
    await db.update(resources).set({ deletedAt: new Date() }).where(eq(resources.id, id));

    // Revalidate caches (resources, categories, tags, flow counts change)
    revalidateTag("resources", "max");
    revalidateTag("categories", "max");
    revalidateTag("tags", "max");
    revalidateTag("resource-flow", "max");

    return NextResponse.json({
      success: true,
      message: "Resource soft deleted"
    });
  } catch (error) {
    console.error("Delete resource error:", error);
    return NextResponse.json(
      { error: "server_error", message: "Something went wrong" },
      { status: 500 }
    );
  }
}
