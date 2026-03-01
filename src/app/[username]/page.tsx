import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getLocale, getTranslations } from "@/i18n/request";
import { and, count, desc, asc, eq, gte, lte, isNull, ne, inArray, sql } from "drizzle-orm";
import { formatDistanceToNow } from "@/lib/date";
import { getResourceUrl } from "@/lib/urls";
import { Calendar, ArrowBigUp, FileText, Settings, GitPullRequest, Clock, Check, X, Pin, BadgeCheck, ShieldCheck, Heart } from "lucide-react";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, resources, resourceVotes, pinnedResources as pinnedResourcesTable, resourceConnections, changeRequests, comments } from "@/lib/schema";
import config from "@/../webmcp.config";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResourceList } from "@/components/resources/resource-list";
import { ResourceCard, type ResourceCardProps } from "@/components/resources/resource-card";
import { PrivateResourcesNote } from "@/components/resources/private-resources-note";
import { Masonry } from "@/components/ui/masonry";
import { McpServerPopup } from "@/components/mcp/mcp-server-popup";
import { ActivityChartWrapper } from "@/components/user/activity-chart-wrapper";
import { ProfileLinks, type CustomLink } from "@/components/user/profile-links";

interface UserProfilePageProps {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ page?: string; tab?: string; date?: string }>;
}

export async function generateMetadata({ params }: UserProfilePageProps): Promise<Metadata> {
  const { username: rawUsername } = await params;
  const decodedUsername = decodeURIComponent(rawUsername);

  // Only support /@username format
  if (!decodedUsername.startsWith("@")) {
    return { title: "User Not Found" };
  }

  const username = decodedUsername.slice(1);

  const user = await db.query.users.findFirst({
    where: sql`lower(${users.username}) = lower(${username})`,
    columns: { name: true, username: true },
  });

  if (!user) {
    return { title: "User Not Found" };
  }

  return {
    title: `${user.name || user.username} (@${user.username})`,
    description: `View ${user.name || user.username}'s resources`,
  };
}

// Drizzle relational "with" for resource cards
const resourceWith = {
  author: {
    columns: {
      id: true,
      name: true,
      username: true,
      avatar: true,
      verified: true,
    },
  },
  category: {
    with: {
      parent: {
        columns: { id: true, name: true, slug: true },
      },
    },
  },
  tags: {
    with: {
      tag: true,
    },
  },
  votes: true,
  outgoingConnections: {
    where: ne(resourceConnections.label, "related"),
  },
  incomingConnections: {
    where: ne(resourceConnections.label, "related"),
  },
} as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapResource(p: any) {
  return {
    ...p,
    voteCount: p.votes?.length ?? 0,
  };
}

export default async function UserProfilePage({ params, searchParams }: UserProfilePageProps) {
  const { username: rawUsername } = await params;
  const { page: pageParam, tab, date: dateFilter } = await searchParams;
  const session = await getSession();
  const t = await getTranslations("user");
  const locale = await getLocale();

  const decodedUsername = decodeURIComponent(rawUsername);

  if (!decodedUsername.startsWith("@")) {
    notFound();
  }

  const username = decodedUsername.slice(1);

  const userRow = await db.query.users.findFirst({
    where: sql`lower(${users.username}) = lower(${username})`,
    columns: {
      id: true,
      name: true,
      username: true,
      email: true,
      avatar: true,
      role: true,
      verified: true,
      createdAt: true,
      bio: true,
      customLinks: true,
    },
    with: {
      resources: { columns: { id: true } },
    },
  });

  if (!userRow) {
    notFound();
  }

  const user = {
    ...userRow,
    _count: {
      resources: userRow.resources.length,
    },
  };

  const page = Math.max(1, parseInt(pageParam || "1") || 1);
  const perPage = 24;
  const isOwner = session?.user?.id === user.id;
  const isUnclaimed = user.email?.endsWith("@unclaimed.webmcp.land") ?? false;

  const isValidDateFilter = dateFilter && /^\d{4}-\d{2}-\d{2}$/.test(dateFilter);
  const filterDateStart = isValidDateFilter ? new Date(dateFilter + "T00:00:00") : null;
  const filterDateEnd = isValidDateFilter ? new Date(dateFilter + "T23:59:59") : null;
  const validFilterDateStart = filterDateStart && !isNaN(filterDateStart.getTime()) ? filterDateStart : null;
  const validFilterDateEnd = filterDateEnd && !isNaN(filterDateEnd.getTime()) ? filterDateEnd : null;

  const baseConditions = [
    eq(resources.authorId, user.id),
    isNull(resources.deletedAt),
  ];
  if (!isOwner) {
    baseConditions.push(eq(resources.isPrivate, false));
  }
  if (validFilterDateStart && validFilterDateEnd) {
    baseConditions.push(gte(resources.createdAt, validFilterDateStart));
    baseConditions.push(lte(resources.createdAt, validFilterDateEnd));
  }
  const resourceWhereClause = and(...baseConditions);

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  oneYearAgo.setHours(0, 0, 0, 0);

  const votedResourceIds = await db
    .select({ resourceId: resourceVotes.resourceId })
    .from(resourceVotes)
    .where(eq(resourceVotes.userId, user.id));
  const likedIds = votedResourceIds.map((v) => v.resourceId);

  const [
    resourcesRaw,
    [{ value: total }],
    [{ value: totalUpvotes }],
    pinnedResourcesRaw,
    likedResourcesRaw,
    privateResourcesCount,
    activityResourcesData,
    activityVotesData,
    activityChangeRequestsData,
    activityCommentsData,
  ] = await Promise.all([
    db.query.resources.findMany({
      where: resourceWhereClause,
      orderBy: desc(resources.createdAt),
      offset: (page - 1) * perPage,
      limit: perPage,
      with: resourceWith,
    }),
    db.select({ value: count() }).from(resources).where(resourceWhereClause),
    db.select({ value: count() })
      .from(resourceVotes)
      .innerJoin(resources, eq(resourceVotes.resourceId, resources.id))
      .where(eq(resources.authorId, user.id)),
    db.query.pinnedResources.findMany({
      where: eq(pinnedResourcesTable.userId, user.id),
      orderBy: asc(pinnedResourcesTable.order),
      with: {
        resource: {
          with: resourceWith,
        },
      },
    }),
    likedIds.length > 0
      ? db.query.resources.findMany({
          where: and(
            inArray(resources.id, likedIds),
            eq(resources.isPrivate, false),
            isNull(resources.deletedAt),
          ),
          orderBy: desc(resources.createdAt),
          limit: 50,
          with: resourceWith,
        })
      : Promise.resolve([]),
    isOwner
      ? db.select({ value: count() }).from(resources).where(
          and(eq(resources.authorId, user.id), eq(resources.isPrivate, true), isNull(resources.deletedAt)),
        ).then((r) => r[0].value)
      : Promise.resolve(0),
    db.select({ createdAt: resources.createdAt }).from(resources)
      .where(and(eq(resources.authorId, user.id), gte(resources.createdAt, oneYearAgo))),
    db.select({ createdAt: resourceVotes.createdAt }).from(resourceVotes)
      .where(and(eq(resourceVotes.userId, user.id), gte(resourceVotes.createdAt, oneYearAgo))),
    db.select({ createdAt: changeRequests.createdAt }).from(changeRequests)
      .where(and(eq(changeRequests.authorId, user.id), gte(changeRequests.createdAt, oneYearAgo))),
    db.select({ createdAt: comments.createdAt }).from(comments)
      .where(and(eq(comments.authorId, user.id), gte(comments.createdAt, oneYearAgo))),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filterStandaloneResources = (list: any[]) =>
    list.filter((p) => !p.incomingConnections || p.incomingConnections.length === 0);

  const resourcesList = filterStandaloneResources(resourcesRaw).map(mapResource);
  const likedResources = likedResourcesRaw.map(mapResource);

  const activityMap = new Map<string, number>();
  const allActivities = [
    ...activityResourcesData,
    ...activityVotesData,
    ...activityChangeRequestsData,
    ...activityCommentsData,
  ];

  allActivities.forEach((item) => {
    const dateStr = item.createdAt.toISOString().split("T")[0];
    activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + 1);
  });

  const activityData = Array.from(activityMap.entries()).map(([date, actCount]) => ({
    date,
    count: actCount,
  }));

  const pinnedResourcesList = pinnedResourcesRaw
    .filter((pp) => isOwner || !pp.resource.isPrivate)
    .map((pp) => mapResource(pp.resource));

  const pinnedIds = new Set<string>(pinnedResourcesList.map((p: { id: string }) => p.id));
  const totalPages = Math.ceil(total / perPage);

  const submittedCRConditions = [eq(changeRequests.authorId, user.id)];
  if (!isOwner) submittedCRConditions.push(eq(changeRequests.status, "APPROVED"));

  const receivedCRConditions = [ne(changeRequests.authorId, user.id)];
  if (!isOwner) receivedCRConditions.push(eq(changeRequests.status, "APPROVED"));

  const userResourceIds = await db
    .select({ id: resources.id })
    .from(resources)
    .where(eq(resources.authorId, user.id));
  const ownedResourceIds = userResourceIds.map((p) => p.id);

  const [submittedChangeRequests, receivedChangeRequests] = await Promise.all([
    db.query.changeRequests.findMany({
      where: and(...submittedCRConditions),
      orderBy: desc(changeRequests.createdAt),
      limit: 100,
      with: {
        author: { columns: { id: true, name: true, username: true, avatar: true } },
        resource: {
          columns: { id: true, slug: true, title: true },
          with: { author: { columns: { id: true, name: true, username: true } } },
        },
      },
    }),
    ownedResourceIds.length > 0
      ? db.query.changeRequests.findMany({
          where: and(inArray(changeRequests.resourceId, ownedResourceIds), ...receivedCRConditions),
          orderBy: desc(changeRequests.createdAt),
          limit: 100,
          with: {
            author: { columns: { id: true, name: true, username: true, avatar: true } },
            resource: {
              columns: { id: true, slug: true, title: true },
              with: { author: { columns: { id: true, name: true, username: true } } },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  const allChangeRequests = [
    ...submittedChangeRequests.map((cr) => ({ ...cr, type: "submitted" as const })),
    ...receivedChangeRequests.map((cr) => ({ ...cr, type: "received" as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const pendingCount = submittedChangeRequests.filter((cr) => cr.status === "PENDING").length +
    receivedChangeRequests.filter((cr) => cr.status === "PENDING").length;
  const defaultTab = tab === "changes" ? "changes" : tab === "likes" ? "likes" : "resources";

  const statusColors = {
    PENDING: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
    APPROVED: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    REJECTED: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  };

  const statusIcons = {
    PENDING: Clock,
    APPROVED: Check,
    REJECTED: X,
  };

  return (
    <div className="container py-6">
      {/* Profile Header */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 md:h-20 md:w-20 shrink-0">
            <AvatarImage src={user.avatar || undefined} />
            <AvatarFallback className="text-xl md:text-2xl">
              {user.name?.charAt(0) || user.username.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold truncate">{user.name || user.username}</h1>
              {user.verified && (
                <BadgeCheck className="h-5 w-5 text-blue-500 shrink-0" />
              )}
              {!user.verified && isOwner && !config.homepage?.useCloneBranding && (
                <Link
                  href="https://donate.stripe.com/aFa9AS5RJeAR23nej0dMI03"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/50 text-amber-600 dark:text-amber-400 hover:from-amber-500/30 hover:to-yellow-500/30 transition-colors"
                >
                  <BadgeCheck className="h-3 w-3" />
                  {t("getVerified")}
                </Link>
              )}
              {user.role === "ADMIN" && (
                <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
              )}
            </div>
            <p className="text-muted-foreground text-sm flex items-center gap-2 flex-wrap">
              @{user.username}
              {isUnclaimed && (
                <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/30 bg-amber-500/10">
                  {t("unclaimedUser")}
                </Badge>
              )}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {config.features.mcp !== false && <McpServerPopup initialUsers={[user.username]} showOfficialBranding={!config.homepage?.useCloneBranding} />}
            {isOwner && (
              <Button render={<Link href="/settings" />} variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-1.5" />
                  {t("editProfile")}
              </Button>
            )}
          </div>
        </div>

        <div className="md:hidden flex gap-2">
          {config.features.mcp !== false && <McpServerPopup initialUsers={[user.username]} showOfficialBranding={!config.homepage?.useCloneBranding} />}
          {isOwner && (
            <Button render={<Link href="/settings" />} variant="outline" size="sm" className="flex-1">
                <Settings className="h-4 w-4 mr-1.5" />
                {t("editProfile")}
            </Button>
          )}
        </div>

        <ProfileLinks
          bio={user.bio}
          customLinks={user.customLinks as CustomLink[] | null}
          className="mb-2"
        />

        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-6 text-sm">
          <div className="flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{user._count.resources}</span>
            <span className="text-muted-foreground">{t("resources").toLowerCase()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ArrowBigUp className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{totalUpvotes}</span>
            <span className="text-muted-foreground">{t("upvotesReceived")}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{t("joined")} {formatDistanceToNow(user.createdAt, locale)}</span>
          </div>
        </div>

        </div>

      <div className="mb-6">
        <ActivityChartWrapper data={activityData} locale={locale} />
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="mb-4">
          <TabsTrigger value="resources" className="gap-2">
            <FileText className="h-4 w-4" />
            {t("resources")}
          </TabsTrigger>
          <TabsTrigger value="likes" className="gap-2">
            <Heart className="h-4 w-4" />
            {t("likes")}
            {likedResources.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1 text-xs">
                {likedResources.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="changes" className="gap-2">
            <GitPullRequest className="h-4 w-4" />
            {t("title")}
            {isOwner && pendingCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1 text-xs">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resources">
          {validFilterDateStart && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-sm">
                {t("filteringByDate", { date: validFilterDateStart.toLocaleDateString(locale, { weekday: "long", year: "numeric", month: "long", day: "numeric" }) })}
              </span>
              <Link href={`/@${user.username}`} className="ml-auto text-xs text-primary hover:underline">
                {t("clearFilter")}
              </Link>
            </div>
          )}

          {isOwner && <PrivateResourcesNote count={privateResourcesCount} />}

          {pinnedResourcesList.length > 0 && (
            <div className="mb-6 pb-6 border-b">
              <div className="flex items-center gap-2 mb-3">
                <Pin className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-medium">{t("pinnedResources")}</h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pinnedResourcesList.map((resource: ResourceCardProps["resource"]) => (
                  <ResourceCard key={resource.id} resource={resource} showPinButton={isOwner} isPinned={isOwner} />
                ))}
              </div>
            </div>
          )}

          {resourcesList.length === 0 && pinnedResourcesList.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-muted/30">
              {validFilterDateStart ? (
                <>
                  <p className="text-muted-foreground">
                    {isOwner ? t("noResourcesOnDateOwner") : t("noResourcesOnDate")}
                  </p>
                  {isOwner && (
                    <Button render={<Link href="/registry/new" />} className="mt-4" size="sm">
                      {t("createForToday")}
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <p className="text-muted-foreground">{isOwner ? t("noResourcesOwner") : t("noResources")}</p>
                  {isOwner && (
                    <Button render={<Link href="/registry/new" />} className="mt-4" size="sm">
                      {t("createFirstResource")}
                    </Button>
                  )}
                </>
              )}
            </div>
          ) : resourcesList.length > 0 ? (
            <>
              {pinnedResourcesList.length > 0 && (
                <h3 className="text-sm font-medium mb-3">{t("allResources")}</h3>
              )}
              <ResourceList
                resources={resourcesList}
                currentPage={page}
                totalPages={totalPages}
                pinnedIds={pinnedIds}
                showPinButton={isOwner}
              />
            </>
          ) : null}
        </TabsContent>

        <TabsContent value="likes">
          {likedResources.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-muted/30">
              <Heart className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">{isOwner ? t("noLikesOwner") : t("noLikes")}</p>
            </div>
          ) : (
            <Masonry columnCount={{ default: 1, md: 2, lg: 3 }} gap={16}>
              {likedResources.map((resource: ResourceCardProps["resource"]) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </Masonry>
          )}
        </TabsContent>

        <TabsContent value="changes">
          {allChangeRequests.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-muted/30">
              <GitPullRequest className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">{t("noRequests")}</p>
            </div>
          ) : (
            <div className="divide-y border rounded-lg">
              {allChangeRequests.map((cr) => {
                const StatusIcon = statusIcons[cr.status as keyof typeof statusIcons];
                return (
                  <Link
                    key={cr.id}
                    href={`${getResourceUrl(cr.resource.id, cr.resource.slug)}/changes/${cr.id}`}
                    className="flex items-center justify-between px-3 py-2 hover:bg-accent/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{cr.resource.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {cr.type === "submitted"
                          ? t("submittedTo", { author: cr.resource.author?.name || cr.resource.author?.username })
                          : t("receivedFrom", { author: cr.author.name || cr.author.username })
                        }
                        {" · "}
                        {formatDistanceToNow(cr.createdAt, locale)}
                      </p>
                    </div>
                    <Badge className={`ml-2 shrink-0 ${statusColors[cr.status as keyof typeof statusColors]}`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {t(cr.status.toLowerCase())}
                    </Badge>
                  </Link>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
