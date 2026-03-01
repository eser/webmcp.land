import { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "@/i18n/request";
import { unstable_cache } from "next/cache";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button"
import { InfiniteResourceList } from "@/components/resources/infinite-resource-list";
import { ResourceFilters } from "@/components/resources/resource-filters";
import { FilterProvider } from "@/components/resources/filter-context";
import { PinnedCategories } from "@/components/categories/pinned-categories";
import { HFDataStudioDropdown } from "@/components/resources/hf-data-studio-dropdown";
import { McpServerPopup } from "@/components/mcp/mcp-server-popup";
import { and, asc, desc, eq, ilike, isNull, ne, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { resources, categories, tags, resourceConnections } from "@/lib/schema";
import { isAISearchEnabled, semanticSearch } from "@/lib/ai/embeddings";
import { isAIGenerationEnabled } from "@/lib/ai/generation";
import config from "@/../webmcp.config";

export const metadata: Metadata = {
  title: "Registry",
  description: "Browse and discover MCP resources",
};

// Query for categories (cached)
const getCategories = unstable_cache(
  async () => {
    return db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        parentId: categories.parentId,
      })
      .from(categories)
      .orderBy(asc(categories.order), asc(categories.name));
  },
  ["categories"],
  { tags: ["categories"] }
);

// Query for pinned categories (cached)
const getPinnedCategories = unstable_cache(
  async () => {
    return db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        icon: categories.icon,
      })
      .from(categories)
      .where(eq(categories.pinned, true))
      .orderBy(asc(categories.order), asc(categories.name));
  },
  ["pinned-categories"],
  { tags: ["categories"] }
);

// Query for tags (cached)
const getTags = unstable_cache(
  async () => {
    return db.select().from(tags).orderBy(asc(tags.name));
  },
  ["tags"],
  { tags: ["tags"] }
);

// Query for resources list (cached)
function getCachedResources(
  sortOption: string,
  perPage: number,
  searchQuery?: string,
  typeFilter?: string,
  categoryFilter?: string,
  tagFilter?: string,
) {
  // Create a stable cache key from the query parameters
  const cacheKey = JSON.stringify({ sortOption, perPage, searchQuery, typeFilter, categoryFilter, tagFilter });

  return unstable_cache(
    async () => {
      // Build conditions
      const conditions = [
        eq(resources.isPrivate, false),
        isNull(resources.deletedAt),
      ];

      if (searchQuery) {
        const keywords = searchQuery.split(",").map(k => k.trim()).filter(Boolean);
        if (keywords.length > 1) {
          conditions.push(
            or(
              ...keywords.flatMap(keyword => [
                ilike(resources.title, `%${keyword}%`),
                ilike(resources.description, `%${keyword}%`),
                ilike(resources.endpointUrl, `%${keyword}%`),
              ])
            )!
          );
        } else {
          conditions.push(
            or(
              ilike(resources.title, `%${searchQuery}%`),
              ilike(resources.description, `%${searchQuery}%`),
              ilike(resources.endpointUrl, `%${searchQuery}%`),
            )!
          );
        }
      }

      if (typeFilter) {
        conditions.push(eq(resources.serverType, typeFilter as "MCP" | "WEBMCP"));
      }

      if (categoryFilter) {
        conditions.push(eq(resources.categoryId, categoryFilter));
      }

      const whereClause = and(...conditions);

      let orderBy;
      if (sortOption === "oldest") {
        orderBy = asc(resources.createdAt);
      } else {
        orderBy = desc(resources.createdAt);
      }

      // Fetch resources with relational queries
      const allResources = await db.query.resources.findMany({
        where: whereClause,
        orderBy,
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

      // Filter by tag slugs if specified (must match ALL tags)
      let filteredResources = allResources;
      if (tagFilter) {
        const tagSlugs = tagFilter.split(",").map(t => t.trim()).filter(Boolean);
        if (tagSlugs.length > 0) {
          filteredResources = filteredResources.filter((p) =>
            tagSlugs.every((slug) =>
              p.tags.some((pt) => pt.tag.slug === slug)
            )
          );
        }
      }

      // Filter out intermediate flow resources (have incoming non-related connections)
      filteredResources = filteredResources.filter((p) => p.incomingConnections.length === 0);

      // For upvotes sorting, sort in JS
      if (sortOption === "upvotes") {
        filteredResources.sort((a, b) => b.votes.length - a.votes.length);
      }

      const totalCount = filteredResources.length;
      const paginatedResources = filteredResources.slice(0, perPage);

      return {
        resources: paginatedResources.map((p) => ({
          ...p,
          voteCount: p.votes.length,
        })),
        total: totalCount,
      };
    },
    ["resources", cacheKey],
    { tags: ["resources"] }
  )();
}

interface RegistryPageProps {
  searchParams: Promise<{
    q?: string;
    type?: string;
    category?: string;
    tag?: string;
    sort?: string;
    page?: string;
    ai?: string;
  }>;
}

export default async function RegistryPage({ searchParams }: RegistryPageProps) {
  const t = await getTranslations("resources");
  const tSearch = await getTranslations("search");
  const params = await searchParams;

  const perPage = 24;
  const aiSearchAvailable = await isAISearchEnabled();
  const aiGenerationAvailable = await isAIGenerationEnabled();
  const useAISearch = aiSearchAvailable && params.ai === "1" && params.q;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let resourcesList: any[] = [];
  let total = 0;

  if (useAISearch && params.q) {
    // Use AI semantic search - combine keywords into a single search query
    try {
      // Join comma-separated keywords with spaces for a single semantic search
      const searchQuery = params.q.split(",").map(k => k.trim()).filter(Boolean).join(" ");
      const aiResults = await semanticSearch(searchQuery, perPage);

      resourcesList = aiResults;
      total = resourcesList.length;
    } catch {
      // Fallback to regular search on error
    }
  }

  // Regular search if AI search not used or failed
  if (!useAISearch || resourcesList.length === 0) {
    const sortOption = params.sort || "newest";

    // Fetch initial resources (first page) - cached
    const result = await getCachedResources(
      sortOption,
      perPage,
      params.q,
      params.type,
      params.category,
      params.tag,
    );
    resourcesList = result.resources;
    total = result.total;
  }

  // Fetch categories, pinned categories, and tags for filter
  const [categoriesList, pinnedCategories, tagsList] = await Promise.all([
    getCategories(),
    getPinnedCategories(),
    getTags(),
  ]);

  return (
    <div className="container py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-baseline gap-2">
          <h1 className="text-lg font-semibold">{t("title")}</h1>
          <span className="text-xs text-muted-foreground">{tSearch("found", { count: total })}</span>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {!config.homepage?.useCloneBranding && (
            <div className="flex items-center gap-2">
              <HFDataStudioDropdown aiGenerationEnabled={aiGenerationAvailable} />
              {config.features.mcp !== false && <McpServerPopup showOfficialBranding />}
            </div>
          )}
          <Button render={<Link href="/registry/new" />} size="sm" className="h-8 text-xs w-full sm:w-auto">
              <Plus className="h-3.5 w-3.5 mr-1" />
              {t("create")}
          </Button>
        </div>
      </div>

      <FilterProvider>
        <Suspense fallback={null}>
          <div className="mb-4">
            <PinnedCategories
              categories={pinnedCategories}
              currentCategoryId={params.category}
            />
          </div>
        </Suspense>
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="w-full lg:w-56 shrink-0 lg:sticky lg:top-16 lg:self-start lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto">
            <ResourceFilters
              categories={categoriesList}
              tags={tagsList}
              currentFilters={params}
              aiSearchEnabled={aiSearchAvailable}
            />
          </aside>
          <main className="flex-1 min-w-0">
            <InfiniteResourceList
              initialResources={resourcesList}
              initialTotal={total}
              filters={{
                q: params.q,
                type: params.type,
                category: params.category,
                categorySlug: categoriesList.find(c => c.id === params.category)?.slug,
                tag: params.tag,
                sort: params.sort,
              }}
            />
          </main>
        </div>
      </FilterProvider>
    </div>
  );
}
