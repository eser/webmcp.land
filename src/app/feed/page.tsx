import Link from "next/link";
import { AuthRedirect } from "@/components/auth/auth-redirect";
import { getLocale, getTranslations } from "@/i18n/request";
import { ArrowRight, Bell, FolderOpen, Sparkles } from "lucide-react";
import { and, asc, desc, eq, inArray, isNull, ne } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { categorySubscriptions, resources, categories, resourceConnections } from "@/lib/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResourceList } from "@/components/resources/resource-list";

export default async function FeedPage() {
  const t = await getTranslations("feed");
  const session = await getSession();

  // Redirect to login if not authenticated
  if (!session?.user) {
    return <AuthRedirect callbackUri="/feed" />;
  }

  // Get user's subscribed categories
  const subscriptions = await db.query.categorySubscriptions.findMany({
    where: eq(categorySubscriptions.userId, session.user.id),
    with: {
      category: {
        columns: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  const subscribedCategoryIds = subscriptions.map((s) => s.categoryId);

  // Fetch resources from subscribed categories
  const resourcesRaw = subscribedCategoryIds.length > 0
    ? await db.query.resources.findMany({
        where: and(
          eq(resources.isPrivate, false),
          isNull(resources.deletedAt),
          inArray(resources.categoryId, subscribedCategoryIds),
        ),
        orderBy: desc(resources.createdAt),
        limit: 30,
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
      })
    : [];

  const resourcesList = resourcesRaw.map((p) => ({
    ...p,
    voteCount: p.votes?.length ?? 0,
  }));

  // Get all categories for subscription
  const categoriesList = await db.query.categories.findMany({
    orderBy: asc(categories.name),
    with: {
      resources: true,
    },
  });

  return (
    <div className="container py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-lg font-semibold">{t("yourFeed")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("feedDescription")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button render={<Link href="/registry" />} variant="outline" size="sm">
              {t("browseAll")}
              <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
          <Button render={<Link href="/discover" />} variant="outline" size="sm">
              <Sparkles className="mr-1.5 h-4 w-4" />
              {t("discover")}
          </Button>
        </div>
      </div>

      {/* Subscribed Categories */}
      {subscriptions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {subscriptions.map(({ category }) => (
            <Link key={category.id} href={`/categories/${category.slug}`}>
              <Badge variant="secondary" className="gap-1">
                <Bell className="h-3 w-3" />
                {category.name}
              </Badge>
            </Link>
          ))}
        </div>
      )}

      {/* Feed */}
      {resourcesList.length > 0 ? (
        <ResourceList resources={resourcesList as any} currentPage={1} totalPages={1} />
      ) : (
        <div className="text-center py-12 border rounded-lg bg-muted/30">
          <FolderOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h2 className="font-medium mb-1">{t("noResourcesInFeed")}</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {t("subscribeToCategories")}
          </p>

          {/* Category suggestions */}
          <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
            {categoriesList.slice(0, 6).map((category) => (
              <Link key={category.id} href={`/categories/${category.slug}`}>
                <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                  {category.name}
                  <span className="ml-1 text-muted-foreground">({category.resources.length})</span>
                </Badge>
              </Link>
            ))}
          </div>

          <div className="mt-4">
            <Button render={<Link href="/categories" />} variant="outline" size="sm">
              {t("viewAllCategories")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
