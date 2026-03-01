import { NextRequest, NextResponse } from "next/server";
import { and, asc, count, desc, eq, ilike, isNotNull, isNull, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { resources, users, categories, resourceVotes, resourceReports } from "@/lib/schema";

// GET - List all resources for admin with pagination and search
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: "unauthorized", message: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "forbidden", message: "Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const filter = searchParams.get("filter") || "all";

    // Validate pagination
    const validPage = Math.max(1, page);
    const validLimit = Math.min(Math.max(1, limit), 100);
    const skip = (validPage - 1) * validLimit;

    // Build filter conditions
    const conditions = [];

    switch (filter) {
      case "private":
        conditions.push(eq(resources.isPrivate, true));
        break;
      case "featured":
        conditions.push(eq(resources.isFeatured, true));
        break;
      case "deleted":
        conditions.push(isNotNull(resources.deletedAt));
        break;
      case "reported":
        conditions.push(
          sql`EXISTS (SELECT 1 FROM resource_reports WHERE resource_reports."resourceId" = ${resources.id})`
        );
        break;
      case "public":
        conditions.push(eq(resources.isPrivate, false));
        conditions.push(isNull(resources.deletedAt));
        break;
      default:
        // "all" - no filter
        break;
    }

    // Add search condition
    if (search) {
      conditions.push(
        ilike(resources.title, `%${search}%`)
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Build orderBy
    const validSortFields = ["createdAt", "updatedAt", "title", "viewCount"] as const;
    const orderByField = validSortFields.includes(sortBy as typeof validSortFields[number])
      ? sortBy
      : "createdAt";
    const sortFn = sortOrder === "asc" ? asc : desc;

    const orderByColumn = {
      createdAt: resources.createdAt,
      updatedAt: resources.updatedAt,
      title: resources.title,
      viewCount: resources.viewCount,
    }[orderByField] ?? resources.createdAt;

    // Subqueries for counts
    const votesCountSq = db
      .select({ value: count() })
      .from(resourceVotes)
      .where(eq(resourceVotes.resourceId, resources.id));

    const reportsCountSq = db
      .select({ value: count() })
      .from(resourceReports)
      .where(eq(resourceReports.resourceId, resources.id));

    // Fetch resources and total count
    const [resourceRows, [{ total }]] = await Promise.all([
      db
        .select({
          id: resources.id,
          title: resources.title,
          slug: resources.slug,
          serverType: resources.serverType,
          status: resources.status,
          isPrivate: resources.isPrivate,
          isFeatured: resources.isFeatured,
          viewCount: resources.viewCount,
          createdAt: resources.createdAt,
          updatedAt: resources.updatedAt,
          deletedAt: resources.deletedAt,
          author: {
            id: users.id,
            username: users.username,
            name: users.name,
            avatar: users.avatar,
          },
          category: {
            id: categories.id,
            name: categories.name,
            slug: categories.slug,
          },
          _count: {
            votes: votesCountSq.as("votes_count"),
            reports: reportsCountSq.as("reports_count"),
          },
        })
        .from(resources)
        .leftJoin(users, eq(resources.authorId, users.id))
        .leftJoin(categories, eq(resources.categoryId, categories.id))
        .where(whereClause)
        .orderBy(sortFn(orderByColumn))
        .limit(validLimit)
        .offset(skip),
      db
        .select({ total: count() })
        .from(resources)
        .where(whereClause),
    ]);

    // Transform rows to match expected shape (null category -> null)
    const transformedResources = resourceRows.map((row) => ({
      ...row,
      category: row.category?.id ? row.category : null,
    }));

    return NextResponse.json({
      resources: transformedResources,
      pagination: {
        page: validPage,
        limit: validLimit,
        total,
        totalPages: Math.ceil(total / validLimit),
      },
    });
  } catch (error) {
    console.error("Admin list resources error:", error);
    return NextResponse.json(
      { error: "server_error", message: "Failed to fetch resources" },
      { status: 500 }
    );
  }
}
