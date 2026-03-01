import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getLocale, getTranslations } from "@/i18n/request";
import { ArrowLeft } from "lucide-react";
import { and, asc, count, desc, eq, ilike, isNull, ne, or } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { categories, categorySubscriptions, resources, resourceConnections } from "@/lib/schema";
import config from "@/../webmcp.config";
import { Button } from "@/components/ui/button";
import { ResourceList } from "@/components/resources/resource-list";
import { SubscribeButton } from "@/components/categories/subscribe-button";
import { CategoryFilters } from "@/components/categories/category-filters";
import { McpServerPopup } from "@/components/mcp/mcp-server-popup";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; sort?: string; q?: string }>;
}

const RESOURCES_PER_PAGE = 30;

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [category] = await db.select({ name: categories.name, description: categories.description })
    .from(categories).where(eq(categories.slug, slug));

  if (!category) {
    return { title: "Category Not Found" };
  }

  return {
    title: category.name,
    description: category.description || `Browse resources in ${category.name}`,
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const { page, sort, q } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || "1", 10) || 1);
  const sortOption = sort || "newest";
  const session = await getSession();
  const t = await getTranslations("categories");

  // Fetch category with counts
  const [categoryRow] = await db.select().from(categories).where(eq(categories.slug, slug));

  if (!categoryRow) {
    notFound();
  }

  // Get counts for resources and subscribers
  const [[resourceCountResult], [subscriberCountResult]] = await Promise.all([
    db.select({ value: count() }).from(resources).where(
      and(eq(resources.categoryId, categoryRow.id), eq(resources.isPrivate, false), isNull(resources.deletedAt))
    ),
    db.select({ value: count() }).from(categorySubscriptions).where(eq(categorySubscriptions.categoryId, categoryRow.id)),
  ]);

  const category = {
    ...categoryRow,
    _count: {
      resources: resourceCountResult.value,
      subscribers: subscriberCountResult.value,
    },
  };

  // Check if user is subscribed
  const isSubscribed = session?.user
    ? await db.select().from(categorySubscriptions).where(
        and(
          eq(categorySubscriptions.userId, session.user.id),
          eq(categorySubscriptions.categoryId, category.id),
        )
      ).then((rows) => rows[0] ?? null)
    : null;

  // Build where conditions
  const whereConditions = [
    eq(resources.categoryId, category.id),
    eq(resources.isPrivate, false),
    isNull(resources.deletedAt),
  ];

  if (q) {
    whereConditions.push(
      or(
        ilike(resources.title, `%${q}%`),
        ilike(resources.description, `%${q}%`),
      )!
    );
  }

  const whereClause = and(...whereConditions);

  // Build orderBy based on sort option
  const getOrderBy = () => {
    switch (sortOption) {
      case "oldest":
        return asc(resources.createdAt);
      default:
        return desc(resources.createdAt);
    }
  };

  // Count total resources for pagination
  const [{ value: totalResources }] = await db.select({ value: count() }).from(resources).where(whereClause);
  const totalPages = Math.ceil(totalResources / RESOURCES_PER_PAGE);

  // Fetch resources in this category
  const resourcesRaw = await db.query.resources.findMany({
    where: whereClause,
    orderBy: getOrderBy(),
    offset: (currentPage - 1) * RESOURCES_PER_PAGE,
    limit: RESOURCES_PER_PAGE,
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

  // For "most_upvoted" sorting, sort in JS after fetching
  const sortedResources = [...resourcesRaw];
  if (sortOption === "most_upvoted") {
    sortedResources.sort((a, b) => b.votes.length - a.votes.length);
  }

  const resourcesList = sortedResources.map((p) => ({
    ...p,
    voteCount: p.votes.length,
  }));

  return (
    <div className="container py-6">
      {/* Header */}
      <div className="mb-6">
        <Button render={<Link href="/categories" />} variant="ghost" size="sm" className="mb-4 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t("categories.allCategories")}
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{category.name}</h1>
              {session?.user && (
                <SubscribeButton
                  categoryId={category.id}
                  categoryName={category.name}
                  initialSubscribed={!!isSubscribed}
                  pill
                />
              )}
            </div>
            {category.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {category.description}
              </p>
            )}
            <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
              <span>{t("categories.resourceCount", { count: totalResources })}</span>
              <span>•</span>
              <span>{t("categories.subscriberCount", { count: category._count.subscribers })}</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <CategoryFilters categorySlug={slug} />
            {config.features.mcp !== false && <McpServerPopup initialCategories={[slug]} showOfficialBranding={!config.homepage?.useCloneBranding} />}
          </div>
        </div>

        {/* Mobile filters */}
        <div className="flex md:hidden items-center gap-2 mt-4">
          <CategoryFilters categorySlug={slug} />
          {config.features.mcp !== false && <McpServerPopup initialCategories={[slug]} showOfficialBranding={!config.homepage?.useCloneBranding} />}
        </div>
      </div>

      {/* Resources */}
      <ResourceList resources={resourcesList as any} currentPage={currentPage} totalPages={totalPages} />
    </div>
  );
}
