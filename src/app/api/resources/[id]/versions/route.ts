import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { resources, resourceVersions, users } from "@/lib/schema";

const createVersionSchema = z.object({
  description: z.string().optional(),
  capabilities: z.any().optional(),
  methods: z.any().optional(),
  changeNote: z.string().max(500).optional(),
});

// POST - Create a new version
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "unauthorized", message: "You must be logged in" },
        { status: 401 }
      );
    }

    const { id: resourceId } = await params;

    // Check if resource exists and user is owner
    const [resource] = await db.select({
      authorId: resources.authorId,
      description: resources.description,
    }).from(resources).where(eq(resources.id, resourceId));

    if (!resource) {
      return NextResponse.json(
        { error: "not_found", message: "Resource not found" },
        { status: 404 }
      );
    }

    if (resource.authorId !== session.user.id) {
      return NextResponse.json(
        { error: "forbidden", message: "You can only add versions to your own resources" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = createVersionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "validation_error", message: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { description, capabilities, methods, changeNote } = parsed.data;

    // Get latest version number
    const [latestVersion] = await db.select({ version: resourceVersions.version })
      .from(resourceVersions)
      .where(eq(resourceVersions.resourceId, resourceId))
      .orderBy(desc(resourceVersions.version))
      .limit(1);

    const newVersionNumber = (latestVersion?.version || 0) + 1;

    // Create new version and update resource in a transaction
    const version = await db.transaction(async (tx) => {
      const [newVersion] = await tx.insert(resourceVersions).values({
        resourceId,
        version: newVersionNumber,
        description,
        capabilities,
        methods,
        changeNote: changeNote || `Version ${newVersionNumber}`,
        createdBy: session.user.id,
      }).returning();

      // Update resource fields if provided
      const updateData: Record<string, unknown> = {};
      if (description !== undefined) updateData.description = description;
      if (capabilities !== undefined) updateData.capabilities = capabilities;
      if (methods !== undefined) updateData.methods = methods;

      if (Object.keys(updateData).length > 0) {
        await tx.update(resources).set(updateData).where(eq(resources.id, resourceId));
      }

      // Fetch author info
      const [author] = await tx.select({
        name: users.name,
        username: users.username,
      }).from(users).where(eq(users.id, session.user.id));

      return { ...newVersion, author };
    });

    return NextResponse.json(version, { status: 201 });
  } catch (error) {
    console.error("Create version error:", error);
    return NextResponse.json(
      { error: "server_error", message: "Something went wrong" },
      { status: 500 }
    );
  }
}

// GET - Get all versions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: resourceId } = await params;

    const versions = await db.select({
      id: resourceVersions.id,
      version: resourceVersions.version,
      description: resourceVersions.description,
      capabilities: resourceVersions.capabilities,
      methods: resourceVersions.methods,
      changeNote: resourceVersions.changeNote,
      createdAt: resourceVersions.createdAt,
      resourceId: resourceVersions.resourceId,
      createdBy: resourceVersions.createdBy,
      author: {
        name: users.name,
        username: users.username,
      },
    })
    .from(resourceVersions)
    .innerJoin(users, eq(resourceVersions.createdBy, users.id))
    .where(eq(resourceVersions.resourceId, resourceId))
    .orderBy(desc(resourceVersions.version));

    return NextResponse.json(versions);
  } catch (error) {
    console.error("Get versions error:", error);
    return NextResponse.json(
      { error: "server_error", message: "Something went wrong" },
      { status: 500 }
    );
  }
}
