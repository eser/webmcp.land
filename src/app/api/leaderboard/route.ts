import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { and, count, desc, eq, gte, inArray, isNull, notInArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { resources, resourceVotes, users } from "@/lib/schema";

// Cache leaderboard data for 1 hour (3600 seconds)
const getLeaderboard = unstable_cache(
  async (period: string) => {
    // Calculate date filters
    const now = new Date();
    let dateFilter: Date | undefined;

    if (period === "week") {
      dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === "month") {
      dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Use database aggregation instead of loading all data into memory
    // Group votes by resource to get counts per resource
    const voteConditions = dateFilter
      ? gte(resourceVotes.createdAt, dateFilter)
      : undefined;

    const votesByResource = await db
      .select({
        resourceId: resourceVotes.resourceId,
        voteCount: count(),
      })
      .from(resourceVotes)
      .where(voteConditions)
      .groupBy(resourceVotes.resourceId);

    // Get resource author mapping for voted resources only
    const votedResourceIds = votesByResource.map((v) => v.resourceId);

    if (votedResourceIds.length === 0 && !dateFilter) {
      // No votes at all, skip to filling with resource authors
    }

    const resourceAuthors = votedResourceIds.length > 0
      ? await db
          .select({
            id: resources.id,
            authorId: resources.authorId,
          })
          .from(resources)
          .where(
            and(
              inArray(resources.id, votedResourceIds),
              eq(resources.isPrivate, false),
              isNull(resources.deletedAt),
            )
          )
      : [];

    const resourceToAuthor = new Map(resourceAuthors.map((r) => [r.id, r.authorId]));

    // Aggregate votes by author
    const authorVoteCounts = new Map<string, number>();
    for (const vote of votesByResource) {
      const authorId = resourceToAuthor.get(vote.resourceId);
      if (authorId) {
        authorVoteCounts.set(authorId, (authorVoteCounts.get(authorId) || 0) + vote.voteCount);
      }
    }

    // Get top 50 users by vote count
    const topAuthorIds = Array.from(authorVoteCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([id]) => id);

    // Fetch user details and resource counts for top users
    const resourceCountSq = db
      .select({ value: count() })
      .from(resources)
      .where(
        and(
          eq(resources.authorId, users.id),
          eq(resources.isPrivate, false),
          isNull(resources.deletedAt),
        )
      );

    const topUsers = topAuthorIds.length > 0
      ? await db
          .select({
            id: users.id,
            name: users.name,
            username: users.username,
            avatar: users.avatar,
            resourceCount: resourceCountSq.as("resource_count"),
          })
          .from(users)
          .where(inArray(users.id, topAuthorIds))
      : [];

    // Build leaderboard with vote counts
    let leaderboard = topUsers
      .map((user) => ({
        id: user.id,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        totalUpvotes: authorVoteCounts.get(user.id) || 0,
        resourceCount: user.resourceCount,
      }))
      .sort((a, b) => b.totalUpvotes - a.totalUpvotes);

    const MIN_USERS = 10;

    // If less than 10 users, fill with users who have most resources
    if (leaderboard.length < MIN_USERS) {
      const existingUserIds = leaderboard.map((u) => u.id);

      // Build conditions for resources to count
      const resourceConditions = [
        eq(resources.isPrivate, false),
        isNull(resources.deletedAt),
      ];
      if (dateFilter) {
        resourceConditions.push(gte(resources.createdAt, dateFilter));
      }

      // Find users with public resources who are not already in the leaderboard
      const userResourceCountSq = db
        .select({ value: count() })
        .from(resources)
        .where(
          and(
            eq(resources.authorId, users.id),
            ...resourceConditions,
          )
        );

      const additionalConditions = [];
      if (existingUserIds.length > 0) {
        additionalConditions.push(notInArray(users.id, existingUserIds));
      }
      // Only include users who have at least one matching resource
      additionalConditions.push(
        sql`EXISTS (SELECT 1 FROM resources WHERE resources."authorId" = ${users.id} AND resources."isPrivate" = false AND resources."deletedAt" IS NULL${dateFilter ? sql` AND resources."createdAt" >= ${dateFilter}` : sql``})`
      );

      const usersWithResources = await db
        .select({
          id: users.id,
          name: users.name,
          username: users.username,
          avatar: users.avatar,
          resourceCount: userResourceCountSq.as("user_resource_count"),
        })
        .from(users)
        .where(and(...additionalConditions))
        .orderBy(desc(sql`(SELECT count(*) FROM resources WHERE resources."authorId" = ${users.id} AND resources."isPrivate" = false AND resources."deletedAt" IS NULL${dateFilter ? sql` AND resources."createdAt" >= ${dateFilter}` : sql``})`))
        .limit(MIN_USERS - leaderboard.length);

      const additionalUsers = usersWithResources.map((user) => ({
        id: user.id,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        totalUpvotes: 0,
        resourceCount: user.resourceCount,
      }));

      leaderboard = [...leaderboard, ...additionalUsers];
    }

    return { period, leaderboard };
  },
  ["leaderboard"],
  { tags: ["leaderboard"], revalidate: 3600 } // Cache for 1 hour
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "all"; // all, month, week

    const result = await getLeaderboard(period);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json(
      { error: "server_error", message: "Something went wrong" },
      { status: 500 }
    );
  }
}
