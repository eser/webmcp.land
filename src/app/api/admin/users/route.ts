import { NextRequest, NextResponse } from "next/server";
import { and, asc, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, resources } from "@/lib/schema";

// GET - List all users for admin with pagination and search
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
      case "admin":
        conditions.push(eq(users.role, "ADMIN"));
        break;
      case "user":
        conditions.push(eq(users.role, "USER"));
        break;
      case "verified":
        conditions.push(eq(users.verified, true));
        break;
      case "unverified":
        conditions.push(eq(users.verified, false));
        break;
      case "flagged":
        conditions.push(eq(users.flagged, true));
        break;
      default:
        // "all" - no filter
        break;
    }

    // Add search condition
    if (search) {
      conditions.push(
        or(
          ilike(users.email, `%${search}%`),
          ilike(users.username, `%${search}%`),
          ilike(sql`COALESCE(${users.name}, '')`, `%${search}%`),
        )!
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Build orderBy
    const validSortFields = ["createdAt", "email", "username", "name"] as const;
    const orderByField = validSortFields.includes(sortBy as typeof validSortFields[number])
      ? sortBy
      : "createdAt";
    const sortFn = sortOrder === "asc" ? asc : desc;

    const orderByColumn = {
      createdAt: users.createdAt,
      email: users.email,
      username: users.username,
      name: users.name,
    }[orderByField] ?? users.createdAt;

    // Subquery for resource count
    const resourcesCountSq = db
      .select({ value: count() })
      .from(resources)
      .where(eq(resources.authorId, users.id));

    // Fetch users and total count
    const [userRows, [{ total }]] = await Promise.all([
      db
        .select({
          id: users.id,
          email: users.email,
          username: users.username,
          name: users.name,
          avatar: users.avatar,
          role: users.role,
          verified: users.verified,
          flagged: users.flagged,
          flaggedAt: users.flaggedAt,
          flaggedReason: users.flaggedReason,
          createdAt: users.createdAt,
          _count: {
            resources: resourcesCountSq.as("resources_count"),
          },
        })
        .from(users)
        .where(whereClause)
        .orderBy(sortFn(orderByColumn))
        .limit(validLimit)
        .offset(skip),
      db
        .select({ total: count() })
        .from(users)
        .where(whereClause),
    ]);

    return NextResponse.json({
      users: userRows,
      pagination: {
        page: validPage,
        limit: validLimit,
        total,
        totalPages: Math.ceil(total / validLimit),
      },
    });
  } catch (error) {
    console.error("Admin list users error:", error);
    return NextResponse.json(
      { error: "server_error", message: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
