import Link from "next/link";
import { getLocale, getTranslations } from "@/i18n/request";
import { and, desc, eq, gte, isNull, ne } from "drizzle-orm";
import { ArrowRight, Clock, Flame, RefreshCw, Star } from "lucide-react";
import { db } from "@/lib/db";
import { resources, resourceConnections, resourceVotes } from "@/lib/schema";
import { Button } from "@/components/ui/button";
import { Masonry } from "@/components/ui/masonry";
import { ResourceCard } from "@/components/resources/resource-card";

interface DiscoveryResourcesProps {
  isHomepage?: boolean;
}

const resourceWith = {
  author: {
    columns: { id: true, name: true, username: true, avatar: true, verified: true },
  },
  category: {
    with: {
      parent: {
        columns: { id: true, name: true, slug: true },
      },
    },
  },
  tags: {
    with: { tag: true },
  },
  votes: true,
  outgoingConnections: {
    where: ne(resourceConnections.label, "related"),
  },
  incomingConnections: {
    where: ne(resourceConnections.label, "related"),
  },
} as const;

const publicWhere = and(
  eq(resources.isPrivate, false),
  isNull(resources.deletedAt),
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapResource = (p: any) => ({
  ...p,
  voteCount: p.votes?.length ?? 0,
  _count: {
    votes: p.votes?.length ?? 0,
    outgoingConnections: p.outgoingConnections?.length ?? 0,
    incomingConnections: p.incomingConnections?.length ?? 0,
  },
});

export async function DiscoveryResources({ isHomepage = false }: DiscoveryResourcesProps) {
  const t = await getTranslations("feed");
  const tDiscovery = await getTranslations("discovery");

  const limit = isHomepage ? 9 : 15;

  // Get today's date at midnight for filtering today's votes
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let todayVotedResourceIds: string[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let featuredResources: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let todaysMostUpvoted: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let latestResources: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let recentlyUpdated: any[] = [];

  try {
    // Get resource IDs that have votes from today (for "today's most upvoted")
    const todayVotedIds = await db
      .select({ resourceId: resourceVotes.resourceId })
      .from(resourceVotes)
      .where(gte(resourceVotes.createdAt, today));
    todayVotedResourceIds = [...new Set(todayVotedIds.map((v) => v.resourceId))];
  } catch (err) {
    console.error("[DiscoveryResources] today's votes query failed:", err);
  }

  try {
    const [featuredResourcesRaw, todaysMostUpvotedRaw, latestResourcesRaw, recentlyUpdatedRaw] = await Promise.all([
      // Featured resources
      db.query.resources.findMany({
        where: and(publicWhere, eq(resources.isFeatured, true)),
        orderBy: desc(resources.featuredAt),
        limit,
        with: resourceWith,
      }).catch(() => []),
      // Today's most upvoted - fetch all with today's votes, sort by vote count in JS
      todayVotedResourceIds.length > 0
        ? db.query.resources.findMany({
            where: publicWhere,
            with: resourceWith,
            // Fetch more than limit to filter, then take top N after sort
            limit: limit * 3,
            orderBy: desc(resources.createdAt),
          }).then((results) => {
            // Filter to only resources with today's votes
            const withTodayVotes = results.filter((p) =>
              todayVotedResourceIds.includes(p.id)
            );
            // Sort by total vote count descending
            withTodayVotes.sort((a, b) => b.votes.length - a.votes.length);
            return withTodayVotes.slice(0, limit);
          }).catch(() => [])
        : Promise.resolve([]),
      // Latest resources
      db.query.resources.findMany({
        where: publicWhere,
        orderBy: desc(resources.createdAt),
        limit,
        with: resourceWith,
      }).catch(() => []),
      // Recently updated
      db.query.resources.findMany({
        where: publicWhere,
        orderBy: desc(resources.updatedAt),
        limit,
        with: resourceWith,
      }).catch(() => []),
    ]);

    featuredResources = featuredResourcesRaw.map(mapResource);
    todaysMostUpvoted = todaysMostUpvotedRaw.map(mapResource);
    latestResources = latestResourcesRaw.map(mapResource);
    recentlyUpdated = recentlyUpdatedRaw.map(mapResource);
  } catch (err) {
    console.error("[DiscoveryResources] data fetch failed:", err);
  }

  return (
    <div className={isHomepage ? "flex flex-col" : "container py-6"}>
      {/* Featured Resources Section */}
      {featuredResources.length > 0 && (
        <section className={isHomepage ? "py-12 border-b" : "pb-8 mb-8 border-b"}>
          <div className={isHomepage ? "container" : ""}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                <h2 className="text-xl font-semibold">{tDiscovery("featuredResources")}</h2>
              </div>
              <Button render={<Link href="/registry" prefetch={false} />} variant="ghost" size="sm">
                  {t("browseAll")}
                  <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
            <Masonry columnCount={{ default: 1, md: 2, lg: 3 }} gap={16}>
              {featuredResources.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </Masonry>
          </div>
        </section>
      )}

      {/* Today's Most Upvoted Section */}
      {todaysMostUpvoted.length > 0 && (
        <section className={isHomepage ? "py-12 border-b" : "pb-8 mb-8 border-b"}>
          <div className={isHomepage ? "container" : ""}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                <h2 className="text-xl font-semibold">{tDiscovery("todaysMostUpvoted")}</h2>
              </div>
              <Button render={<Link href="/registry" prefetch={false} />} variant="ghost" size="sm">
                  {t("browseAll")}
                  <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
            <Masonry columnCount={{ default: 1, md: 2, lg: 3 }} gap={16}>
              {todaysMostUpvoted.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </Masonry>
          </div>
        </section>
      )}

      {/* Latest Resources Section */}
      {latestResources.length > 0 && (
        <section className={isHomepage ? "py-12 border-b" : "pb-8 mb-8 border-b"}>
          <div className={isHomepage ? "container" : ""}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-xl font-semibold">{tDiscovery("latestResources")}</h2>
              </div>
              <Button render={<Link href="/registry" prefetch={false} />} variant="ghost" size="sm">
                  {t("browseAll")}
                  <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
            <Masonry columnCount={{ default: 1, md: 2, lg: 3 }} gap={16}>
              {latestResources.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </Masonry>
          </div>
        </section>
      )}

      {/* Recently Updated Section */}
      {recentlyUpdated.length > 0 && (
        <section className={isHomepage ? "py-12 border-b" : "pb-8 mb-8 border-b"}>
          <div className={isHomepage ? "container" : ""}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-blue-500" />
                <h2 className="text-xl font-semibold">{tDiscovery("recentlyUpdated")}</h2>
              </div>
              <Button render={<Link href="/registry" prefetch={false} />} variant="ghost" size="sm">
                  {t("browseAll")}
                  <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
            <Masonry columnCount={{ default: 1, md: 2, lg: 3 }} gap={16}>
              {recentlyUpdated.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </Masonry>
          </div>
        </section>
      )}

    </div>
  );
}
