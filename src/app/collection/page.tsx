import Link from "next/link";
import { AuthRedirect } from "@/components/auth/auth-redirect";
import { getLocale, getTranslations } from "@/i18n/request";
import { ArrowRight, Bookmark, Sparkles } from "lucide-react";
import { and, desc, eq, ne, count, isNull } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { collections, resources, resourceVotes, resourceConnections } from "@/lib/schema";
import { Button } from "@/components/ui/button";
import { ResourceList } from "@/components/resources/resource-list";

export default async function CollectionPage() {
  const t = await getTranslations("collection");
  const session = await getSession();

  if (!session?.user) {
    return <AuthRedirect callbackUri="/collection" />;
  }

  const collectionsRaw = await db.query.collections.findMany({
    where: eq(collections.userId, session.user.id),
    orderBy: desc(collections.createdAt),
    with: {
      resource: {
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
      },
    },
  });

  const resourcesList = collectionsRaw
    .filter((c) => c.resource && !c.resource.deletedAt)
    .map((c) => ({
      ...c.resource,
      voteCount: c.resource.votes?.length ?? 0,
    }));

  return (
    <div className="container py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-lg font-semibold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("description")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button render={<Link href="/registry" />} variant="outline" size="sm">
              {t("browseResources")}
              <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
          <Button render={<Link href="/discover" />} variant="outline" size="sm">
              <Sparkles className="mr-1.5 h-4 w-4" />
              {t("discover")}
          </Button>
        </div>
      </div>

      {resourcesList.length > 0 ? (
        <ResourceList resources={resourcesList as any} currentPage={1} totalPages={1} />
      ) : (
        <div className="text-center py-12 border rounded-lg bg-muted/30">
          <Bookmark className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h2 className="font-medium mb-1">{t("emptyTitle")}</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {t("emptyDescription")}
          </p>
          <Button render={<Link href="/registry" />} variant="outline" size="sm">
            {t("browseResources")}
          </Button>
        </div>
      )}
    </div>
  );
}
