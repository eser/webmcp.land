import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getLocale, getTranslations } from "@/i18n/request";
import { formatDistanceToNow } from "@/lib/date";
import { Clock, Edit, History, GitPullRequest, Check, X, Shield, Trash2, Cpu, Terminal, Wrench } from "lucide-react";
import { AnimatedDate } from "@/components/ui/animated-date";
import { ShareDropdown } from "@/components/resources/share-dropdown";
import { and, count, desc, eq, ne, or, isNull, asc, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { resources, resourceVotes, collections, resourceConnections, changeRequests } from "@/lib/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { InteractiveResourceContent } from "@/components/resources/interactive-resource-content";
import { UpvoteButton } from "@/components/resources/upvote-button";
import { AddVersionForm } from "@/components/resources/add-version-form";
import { DeleteVersionButton } from "@/components/resources/delete-version-button";
import { VersionCompareModal } from "@/components/resources/version-compare-modal";
import { VersionCompareButton } from "@/components/resources/version-compare-button";
import { FeatureResourceButton } from "@/components/resources/feature-resource-button";
import { RestoreResourceButton } from "@/components/resources/restore-resource-button";
import { CommentSection } from "@/components/comments";
import { ResourceFlowSection } from "@/components/resources/resource-flow-section";
import { RelatedResources } from "@/components/resources/related-resources";
import { AddToCollectionButton } from "@/components/resources/add-to-collection-button";
import { getConfig } from "@/lib/config";
import { StructuredData } from "@/components/seo/structured-data";
import { AI_MODELS } from "@/lib/works-best-with";

interface ResourcePageProps {
  params: Promise<{ id: string }>;
}

/**
 * Extracts the resource ID from a URL parameter that may contain a slug
 * Supports formats: "abc123", "abc123_some-slug", or "abc123_some-slug.resource.md"
 */
function extractResourceId(idParam: string): string {
  let param = idParam;
  // Strip .resource.md suffix if present
  if (param.endsWith(".resource.md")) {
    param = param.slice(0, -".resource.md".length);
  }
  // If the param contains an underscore, extract the ID (everything before first underscore)
  const underscoreIndex = param.indexOf("_");
  if (underscoreIndex !== -1) {
    return param.substring(0, underscoreIndex);
  }
  return param;
}


export async function generateMetadata({ params }: ResourcePageProps): Promise<Metadata> {
  const { id: idParam } = await params;
  const id = extractResourceId(idParam);
  const [resource] = await db
    .select({ title: resources.title, description: resources.description })
    .from(resources)
    .where(eq(resources.id, id));

  if (!resource) {
    return { title: "Resource Not Found" };
  }

  return {
    title: resource.title,
    description: resource.description || `View the resource: ${resource.title}`,
  };
}

export default async function ResourcePage({ params }: ResourcePageProps) {
  const { id: idParam } = await params;
  const id = extractResourceId(idParam);
  const session = await getSession();
  const config = await getConfig();
  const t = await getTranslations("resources");
  const locale = await getLocale();

  const isAdmin = session?.user?.role === "ADMIN";

  // Admins can view deleted resources, others cannot
  const resourceRaw = await db.query.resources.findFirst({
    where: and(
      eq(resources.id, id),
      ...(isAdmin ? [] : [isNull(resources.deletedAt)]),
    ),
    with: {
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
          parent: true,
        },
      },
      tags: {
        with: {
          tag: true,
        },
      },
      versions: {
        orderBy: desc(sql`"version"`),
        with: {
          author: {
            columns: {
              name: true,
              username: true,
            },
          },
        },
      },
      votes: true,
    },
  });
  const resource = resourceRaw ? {
    ...resourceRaw,
    _count: { votes: resourceRaw.votes.length },
  } : null;

  // Check if user has voted
  const userVote = session?.user
    ? await db.select().from(resourceVotes).where(
        and(eq(resourceVotes.userId, session.user.id), eq(resourceVotes.resourceId, id))
      ).then((rows) => rows[0] ?? null)
    : null;

  // Check if user has this resource in their collection
  const userCollection = session?.user
    ? await db.select().from(collections).where(
        and(eq(collections.userId, session.user.id), eq(collections.resourceId, id))
      ).then((rows) => rows[0] ?? null)
    : null;

  // Fetch related resources (via ResourceConnection with label "related")
  const relatedConnections = await db.query.resourceConnections.findMany({
    where: and(
      eq(resourceConnections.sourceId, id),
      eq(resourceConnections.label, "related"),
    ),
    orderBy: asc(resourceConnections.order),
    with: {
      target: {
        columns: {
          id: true,
          title: true,
          slug: true,
          description: true,
          serverType: true,
          isPrivate: true,
          deletedAt: true,
        },
        with: {
          author: {
            columns: {
              id: true,
              name: true,
              username: true,
              avatar: true,
            },
          },
          category: {
            columns: {
              id: true,
              name: true,
              slug: true,
            },
          },
          votes: true,
        },
      },
    },
  });

  // Filter out private, unlisted, or deleted related resources
  const relatedResourcesList = relatedConnections
    .map((conn) => ({
      ...conn.target,
      _count: { votes: conn.target.votes.length },
    }))
    .filter((p) => !p.isPrivate && !p.deletedAt);

  // Check if resource has flow connections (previous/next, not "related")
  const [{ value: flowConnectionCount }] = await db
    .select({ value: count() })
    .from(resourceConnections)
    .where(
      and(
        ne(resourceConnections.label, "related"),
        or(
          eq(resourceConnections.sourceId, id),
          eq(resourceConnections.targetId, id),
        ),
      )
    );
  const hasFlowConnections = flowConnectionCount > 0;

  if (!resource) {
    notFound();
  }

  // Check if user can view private resource
  if (resource.isPrivate && resource.authorId !== session?.user?.id) {
    notFound();
  }

  const isOwner = session?.user?.id === resource.authorId;
  const canEdit = isOwner || isAdmin;
  const voteCount = resource._count?.votes ?? 0;
  const hasVoted = !!userVote;
  const inCollection = !!userCollection;

  // Fetch change requests for this resource
  const changeRequestsList = await db.query.changeRequests.findMany({
    where: eq(changeRequests.resourceId, id),
    orderBy: desc(changeRequests.createdAt),
    with: {
      author: {
        columns: {
          id: true,
          name: true,
          username: true,
          avatar: true,
        },
      },
    },
  });

  const pendingCount = changeRequestsList.filter((cr) => cr.status === "PENDING").length;

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


  // Get works best with fields
  const bestWithModels = (resource as unknown as { bestWithModels?: string[] }).bestWithModels || [];
  const bestWithMCP = (resource as unknown as { bestWithMCP?: { command: string; tools?: string[] }[] }).bestWithMCP || [];

  return (
    <>
      {/* Structured Data for Rich Results */}
      <StructuredData
        type="prompt"
        data={{
          prompt: {
            id: resource.id,
            name: resource.title,
            description: resource.description || `MCP resource: ${resource.title}`,
            content: resource.description || "",
            author: resource.author.name || resource.author.username,
            authorUrl: `${process.env.BETTER_AUTH_URL || "https://webmcp.land"}/@${resource.author.username}`,
            datePublished: resource.createdAt.toISOString(),
            dateModified: resource.updatedAt.toISOString(),
            category: resource.category?.name,
            tags: resource.tags.map(({ tag }) => tag.name),
            voteCount: voteCount,
          },
        }}
      />
      <StructuredData
        type="breadcrumb"
        data={{
          breadcrumbs: [
            { name: "Home", url: "/" },
            { name: "Registry", url: "/registry" },
            ...(resource.category ? [{ name: resource.category.name, url: `/categories/${resource.category.slug}` }] : []),
            { name: resource.title, url: `/registry/${resource.id}` },
          ],
        }}
      />
      <div className="container max-w-4xl py-8">
        {/* Deleted Banner - shown to admins when resource is deleted */}
      {resource.deletedAt && isAdmin && (
        <div className="mb-6 p-4 rounded-lg border border-red-500/30 bg-red-500/5">
          <div className="flex items-start gap-3">
            <Trash2 className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <h3 className="text-sm font-semibold text-red-700 dark:text-red-400">
                {t("promptDeleted")}
              </h3>
              <p className="text-sm text-red-600 dark:text-red-500">
                {t("promptDeletedDescription")}
              </p>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <RestoreResourceButton resourceId={resource.id} />
          </div>
        </div>
      )}


      {/* Header */}
      <div className="mb-6">
        {/* Title row with upvote button */}
        <div className="flex items-center gap-4 mb-2">
          <div className="shrink-0">
            <UpvoteButton
              resourceId={resource.id}
              initialVoted={hasVoted}
              initialCount={voteCount}
              isLoggedIn={!!session?.user}
              size="circular"
            />
          </div>
          <div className="flex-1 flex items-center justify-between gap-4 min-w-0">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <h1 className="text-3xl font-bold">{resource.title}</h1>
              {resource.isPrivate && (
                <Badge variant="secondary">{t("promptPrivate")}</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {resource.description && (
          <p className="text-muted-foreground">{resource.description}</p>
        )}
      </div>
      <div className="border-b mb-6 sm:hidden" />

      {/* Meta info */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
        <div className="flex items-center gap-2">
          <Link href={`/@${resource.author.username}`} title={`@${resource.author.username}`}>
            <Avatar className="h-6 w-6 border-2 border-background">
              <AvatarImage src={resource.author.avatar || undefined} />
              <AvatarFallback className="text-xs">{resource.author.name?.charAt(0) || resource.author.username.charAt(0)}</AvatarFallback>
            </Avatar>
          </Link>
          <Link href={`/@${resource.author.username}`} className="hover:underline">@{resource.author.username}</Link>
        </div>
        <AnimatedDate
          date={resource.createdAt}
          relativeText={formatDistanceToNow(resource.createdAt, locale)}
          locale={locale}
        />
      </div>

      {/* Category and Tags */}
      {(resource.category || resource.tags.length > 0) && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {resource.category && (
            <Link href={`/categories/${resource.category.slug}`}>
              <Badge variant="outline">{resource.category.name}</Badge>
            </Link>
          )}
          {resource.category && resource.tags.length > 0 && (
            <span className="text-muted-foreground">•</span>
          )}
          {resource.tags.map(({ tag }) => (
            <Link key={tag.id} href={`/tags/${tag.slug}`}>
              <Badge
                variant="secondary"
                style={{ backgroundColor: tag.color + "20", color: tag.color }}
              >
                {tag.name}
              </Badge>
            </Link>
          ))}
        </div>
      )}

      {/* Content Tabs */}
      <Tabs defaultValue="content">
        <div className="flex flex-col gap-3 mb-4">
          {/* Action buttons - on top on mobile */}
          <div className="flex items-center justify-between gap-2 md:hidden">
            <AddToCollectionButton
              resourceId={resource.id}
              initialInCollection={inCollection}
              isLoggedIn={!!session?.user}
            />
            <div className="flex gap-2">
              {!isOwner && session?.user && (
                <Button render={<Link href={`/registry/${id}/changes/new`} />} size="sm">
                    <GitPullRequest className="h-4 w-4 mr-1.5" />
                    {t("createChangeRequest")}
                </Button>
              )}
              {isOwner && (
                <Button render={<Link href={`/registry/${id}/edit`} />} variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-1.5" />
                    {t("edit")}
                </Button>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="content">{t("promptContent")}</TabsTrigger>
              <TabsTrigger value="versions" className="gap-1">
                <History className="h-4 w-4" />
                {t("versions")}
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1 text-xs">
                  {resource.versions.length > 0 ? resource.versions[0].version : 1}
                </Badge>
              </TabsTrigger>
              {changeRequestsList.length > 0 && (
                <TabsTrigger value="changes" className="gap-1">
                  <GitPullRequest className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("changeRequests")}</span>
                  {pendingCount > 0 && (
                    <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1 text-xs">
                      {pendingCount}
                    </Badge>
                  )}
                </TabsTrigger>
              )}
            </TabsList>
            {/* Action buttons - inline on desktop */}
            <div className="hidden md:flex items-center gap-2">
              <AddToCollectionButton
                resourceId={resource.id}
                initialInCollection={inCollection}
                isLoggedIn={!!session?.user}
              />
              {!isOwner && session?.user && (
                <Button render={<Link href={`/registry/${id}/changes/new`} />} size="sm">
                    <GitPullRequest className="h-4 w-4 mr-1.5" />
                    {t("createChangeRequest")}
                </Button>
              )}
              {isOwner && (
                <Button render={<Link href={`/registry/${id}/edit`} />} variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-1.5" />
                    {t("edit")}
                </Button>
              )}
            </div>
          </div>
        </div>

        <TabsContent value="content" className="space-y-4 mt-0">
          {/* Endpoint URL */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Terminal className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t("endpointUrl")}</span>
              <Badge variant="secondary">{resource.serverType}</Badge>
            </div>
            <code className="text-sm break-all">{resource.endpointUrl}</code>
          </div>

          {/* Description */}
          {resource.description && (
            <InteractiveResourceContent
              content={resource.description}
              title={t("promptContent")}
              isLoggedIn={!!session?.user}
              categoryName={resource.category?.name}
              parentCategoryName={resource.category?.parent?.name}
              resourceId={resource.id}
              resourceSlug={resource.slug ?? resource.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}
              resourceType={resource.serverType}
              shareTitle={resource.title}
              resourceTitle={resource.title}
              resourceDescription={resource.description ?? undefined}
            />
          )}

          {/* Works Best With */}
          {bestWithModels.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Cpu className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{t("worksBestWith")}:</span>
              <div className="flex flex-wrap gap-1.5">
                {bestWithModels.map((slug) => {
                  const model = AI_MODELS[slug as keyof typeof AI_MODELS];
                  return (
                    <Badge key={slug} variant="secondary" className="text-xs">
                      {model?.name || slug}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* MCP Tools */}
          {bestWithMCP.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Terminal className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{t("mcpTools")}:</span>
              <div className="flex flex-wrap gap-1.5">
                {bestWithMCP.flatMap((mcp, mcpIndex) =>
                  mcp.tools && mcp.tools.length > 0
                    ? mcp.tools.map((tool, toolIndex) => (
                        <Tooltip key={`${mcpIndex}-${toolIndex}`}>
                          <TooltipTrigger render={<Badge variant="outline" className="text-xs font-mono cursor-help gap-1" />}>
                              <Wrench className="h-3 w-3" />
                              {tool}
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-xs">
                            <code className="text-xs break-all">{mcp.command}</code>
                          </TooltipContent>
                        </Tooltip>
                      ))
                    : [(
                        <Tooltip key={mcpIndex}>
                          <TooltipTrigger render={<Badge variant="outline" className="text-xs font-mono cursor-help" />}>
                              {mcp.command.split("/").pop()?.replace("server-", "") || mcp.command}
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-xs">
                            <code className="text-xs break-all">{mcp.command}</code>
                          </TooltipContent>
                        </Tooltip>
                      )]
                )}
              </div>
            </div>
          )}

          {/* Report & Resource Flow */}
          {(
            <ResourceFlowSection
              resourceId={resource.id}
              resourceTitle={resource.title}
              canEdit={canEdit}
              isOwner={isOwner}
              isLoggedIn={!!session?.user}
              currentUserId={session?.user?.id}
              isAdmin={isAdmin}
              workflowLink={(resource as unknown as { workflowLink?: string | null }).workflowLink}
              hasFlowConnections={hasFlowConnections}
            />
          )}

          {/* Related Resources */}
          {relatedResourcesList.length > 0 && (
            <RelatedResources resources={relatedResourcesList} />
          )}

          {/* Comments Section */}
          {config.features.comments !== false && !resource.isPrivate && (
            <CommentSection
              resourceId={resource.id}
              currentUserId={session?.user?.id}
              isAdmin={isAdmin}
              isLoggedIn={!!session?.user}
              locale={locale}
            />
          )}
        </TabsContent>

        <TabsContent value="versions" className="mt-0">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold">{t("versionHistory")}</h3>
              <div className="flex items-center gap-2">
                <VersionCompareModal
                  versions={resource.versions}
                  currentContent={resource.description || ""}
                  resourceType={resource.serverType}
                />
                {canEdit && (
                  <AddVersionForm resourceId={resource.id} currentContent={resource.description || ""} />
                )}
              </div>
            </div>
            {resource.versions.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">{t("noVersions")}</p>
            ) : (
              <div className="divide-y border rounded-lg">
                {resource.versions.map((version, index) => {
                  const isLatestVersion = index === 0;
                  return (
                    <div
                      key={version.id}
                      className="px-4 py-3 flex items-start gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">v{version.version}</span>
                          {isLatestVersion && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                              {t("currentVersion")}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(version.createdAt, locale)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            by @{version.author.username}
                          </span>
                        </div>
                        {version.changeNote && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {version.changeNote}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {!isLatestVersion && (
                          <VersionCompareButton
                            versionContent={version.content}
                            versionNumber={version.version}
                            currentContent={resource.description || ""}
                            resourceType={resource.serverType}
                          />
                        )}
                        {canEdit && !isLatestVersion && (
                          <DeleteVersionButton
                            resourceId={resource.id}
                            versionId={version.id}
                            versionNumber={version.version}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {changeRequestsList.length > 0 && (
          <TabsContent value="changes" className="mt-0">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold">{t("changeRequests")}</h3>
              </div>
              <div className="divide-y border rounded-lg">
                {changeRequestsList.map((cr) => {
                  const StatusIcon = statusIcons[cr.status];
                  const hasTitleChange = cr.proposedTitle && cr.proposedTitle !== cr.originalTitle;
                  return (
                    <Link
                      key={cr.id}
                      href={`/registry/${id}/changes/${cr.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors first:rounded-t-lg last:rounded-b-lg"
                    >
                      <div className={`p-1.5 rounded-full shrink-0 ${
                        cr.status === "PENDING"
                          ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                          : cr.status === "APPROVED"
                          ? "bg-green-500/10 text-green-600 dark:text-green-400"
                          : "bg-red-500/10 text-red-600 dark:text-red-400"
                      }`}>
                        <StatusIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">
                            {hasTitleChange ? (
                              <>
                                <span className="line-through text-muted-foreground">{cr.originalTitle}</span>
                                {" → "}
                                <span>{cr.proposedTitle}</span>
                              </>
                            ) : (
                              t("contentChanges")
                            )}
                          </span>
                        </div>
                        {cr.reason && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {cr.reason}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={cr.author.avatar || undefined} />
                            <AvatarFallback className="text-[9px]">
                              {cr.author.name?.[0] || cr.author.username[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="hidden sm:inline">@{cr.author.username}</span>
                        </div>
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          {formatDistanceToNow(cr.createdAt, locale)}
                        </span>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${statusColors[cr.status]}`}>
                          {t(cr.status.toLowerCase())}
                        </Badge>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Admin Area */}
      {isAdmin && (
        <div className="mt-8 p-4 rounded-lg border border-red-500/30 bg-red-500/5">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-red-500" />
            <h3 className="text-sm font-semibold text-red-500">{t("adminArea")}</h3>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <FeatureResourceButton
              resourceId={resource.id}
              isFeatured={resource.isFeatured}
            />
            <Button render={<Link href={`/registry/${id}/edit`} />} variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                {t("edit")}
            </Button>
          </div>
        </div>
      )}

      </div>
    </>
  );
}
