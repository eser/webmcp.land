import Link from "next/link";
import { getLocale, getTranslations } from "@/i18n/request";
import { unstable_cache } from "next/cache";
import { FolderOpen, ChevronRight } from "lucide-react";
import { and, asc, count, eq, inArray, isNull, isNull as drizzleIsNull } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { categories, resources, categorySubscriptions } from "@/lib/schema";
import { SubscribeButton } from "@/components/categories/subscribe-button";

// Cached categories query with filtered resource counts
const getCategories = unstable_cache(
  async () => {
    const rootCategories = await db.query.categories.findMany({
      where: isNull(categories.parentId),
      orderBy: asc(categories.order),
      with: {
        children: {
          orderBy: asc(categories.order),
        },
      },
    });

    // Get all category IDs (parents + children)
    const allCategoryIds = rootCategories.flatMap((c) => [c.id, ...c.children.map((child) => child.id)]);

    if (allCategoryIds.length === 0) return [];

    // Count visible resources per category in one query
    const counts = await db
      .select({
        categoryId: resources.categoryId,
        count: count(),
      })
      .from(resources)
      .where(
        and(
          inArray(resources.categoryId, allCategoryIds),
          eq(resources.isPrivate, false),
          isNull(resources.deletedAt),
        )
      )
      .groupBy(resources.categoryId);

    const countMap = new Map(counts.map((c) => [c.categoryId, c.count]));

    // Attach counts to categories
    return rootCategories.map((category) => ({
      ...category,
      resourceCount: countMap.get(category.id) || 0,
      children: category.children.map((child) => ({
        ...child,
        resourceCount: countMap.get(child.id) || 0,
      })),
    }));
  },
  ["categories-page"],
  { tags: ["categories"] }
);

export default async function CategoriesPage() {
  const t = await getTranslations("categories");
  const session = await getSession();

  // Fetch root categories (no parent) with their children (cached)
  const rootCategories = await getCategories();

  // Get user's subscriptions if logged in
  const subscriptions = session?.user
    ? await db.select({ categoryId: categorySubscriptions.categoryId })
        .from(categorySubscriptions)
        .where(eq(categorySubscriptions.userId, session.user.id))
    : [];

  const subscribedIds = new Set(subscriptions.map((s) => s.categoryId));

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      {rootCategories.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/30">
          <FolderOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{t("noCategories")}</p>
        </div>
      ) : (
        <div className="divide-y">
          {rootCategories.map((category) => (
            <section key={category.id} className="py-6 first:pt-0">
              {/* Main Category Header */}
              <div className="flex items-start gap-3 mb-3">
                {category.icon && (
                  <span className="text-xl mt-0.5">{category.icon}</span>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/categories/${category.slug}`}
                      className="font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      {category.name}
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                    {session?.user && (
                      <SubscribeButton
                        categoryId={category.id}
                        categoryName={category.name}
                        initialSubscribed={subscribedIds.has(category.id)}
                        iconOnly
                      />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {category.resourceCount} {t("resources")}
                    </span>
                  </div>
                  {category.description && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {category.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Subcategories List */}
              {category.children.length > 0 && (
                <div className="ml-8 space-y-1">
                  {category.children.map((child) => (
                    <div
                      key={child.id}
                      className="group py-2 px-3 -mx-3 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {child.icon && (
                          <span className="text-sm">{child.icon}</span>
                        )}
                        <Link
                          href={`/categories/${child.slug}`}
                          className="text-sm font-medium hover:underline"
                        >
                          {child.name}
                        </Link>
                        {session?.user && (
                          <SubscribeButton
                            categoryId={child.id}
                            categoryName={child.name}
                            initialSubscribed={subscribedIds.has(child.id)}
                            iconOnly
                          />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {child.resourceCount}
                        </span>
                      </div>
                      {child.description && (
                        <p className="text-xs text-muted-foreground mt-1 ml-6 line-clamp-1">
                          {child.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
