import { notFound } from "next/navigation";
import Link from "next/link";
import { getLocale, getTranslations } from "@/i18n/request";
import { ArrowLeft, Tag } from "lucide-react";
import { and, count, desc, eq, isNull, ne, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { tags, resources, resourceTags, resourceConnections } from "@/lib/schema";
import { getSession } from "@/lib/auth";
import config from "@/../webmcp.config";
import { Button } from "@/components/ui/button";
import { ResourceCard } from "@/components/resources/resource-card";
import { McpServerPopup } from "@/components/mcp/mcp-server-popup";

interface TagPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: TagPageProps) {
  const { slug } = await params;
  const [tag] = await db.select({ name: tags.name }).from(tags).where(eq(tags.slug, slug));

  if (!tag) return { title: "Tag Not Found" };

  return {
    title: `${tag.name} - Tags`,
    description: `Browse resources tagged with ${tag.name}`,
  };
}

export default async function TagPage({ params, searchParams }: TagPageProps) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const session = await getSession();
  const t = await getTranslations("tags");

  const [tag] = await db.select().from(tags).where(eq(tags.slug, slug));

  if (!tag) {
    notFound();
  }

  const page = Math.max(1, parseInt(pageParam || "1") || 1);
  const perPage = 24;

  // Build where conditions: resources with this tag, not unlisted, not deleted, and visible
  const visibilityCondition = session?.user
    ? or(eq(resources.isPrivate, false), eq(resources.authorId, session.user.id))
    : eq(resources.isPrivate, false);

  // Get resource IDs that have this tag
  const taggedResourceIds = db
    .select({ resourceId: resourceTags.resourceId })
    .from(resourceTags)
    .where(eq(resourceTags.tagId, tag.id));

  // Fetch resources with this tag using relational query
  const resourcesWithTag = await db.query.resources.findMany({
    where: and(
      isNull(resources.deletedAt),
      visibilityCondition,
      // Filter to only resources with this tag using exists-like pattern
    ),
    orderBy: desc(resources.createdAt),
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
    },
  });

  // Filter to only resources that have this specific tag
  const filteredResources = resourcesWithTag.filter((p) =>
    p.tags.some((pt) => pt.tagId === tag.id)
  );

  const total = filteredResources.length;
  const paginatedResources = filteredResources.slice((page - 1) * perPage, page * perPage);

  const resourcesList = paginatedResources.map((p) => ({
    ...p,
    voteCount: p.votes.length,
  }));

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="container py-6">
      {/* Header */}
      <div className="mb-6">
        <Button render={<Link href="/tags" />} variant="ghost" size="sm" className="mb-4 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            {t("allTags")}
        </Button>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: tag.color }}
            />
            <h1 className="text-xl font-semibold">{tag.name}</h1>
            <span className="text-sm text-muted-foreground">
              {total} {t("resources")}
            </span>
          </div>
          {config.features.mcp !== false && <McpServerPopup initialTags={[slug]} showOfficialBranding={!config.homepage?.useCloneBranding} />}
        </div>
      </div>

      {/* Resources Grid */}
      {resourcesList.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/30">
          <Tag className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {t("noResources")}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="columns-1 md:columns-2 lg:columns-3 gap-4">
            {resourcesList.map((resource) => (
              <ResourceCard key={resource.id} resource={resource as any} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              {page > 1 ? (
                <Button
                  render={<Link href={`/tags/${slug}?page=${page - 1}`} />}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                >
                  {t("previous")}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled
                >
                  {t("previous")}
                </Button>
              )}
              <span className="text-xs text-muted-foreground">
                {page} / {totalPages}
              </span>
              {page < totalPages ? (
                <Button
                  render={<Link href={`/tags/${slug}?page=${page + 1}`} />}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                >
                  {t("next")}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled
                >
                  {t("next")}
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
