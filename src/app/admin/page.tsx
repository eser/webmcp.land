import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "@/i18n/request";
import { and, asc, count, desc, eq, isNull, isNull as drizzleIsNull } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, resources, categories, tags, webhookConfigs, resourceReports } from "@/lib/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FolderTree, Tags, FileText } from "lucide-react";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { UsersTable } from "@/components/admin/users-table";
import { CategoriesTable } from "@/components/admin/categories-table";
import { TagsTable } from "@/components/admin/tags-table";
import { WebhooksTable } from "@/components/admin/webhooks-table";
import { ResourcesManagement } from "@/components/admin/resources-management";
import { ReportsTable } from "@/components/admin/reports-table";
import { isAISearchEnabled } from "@/lib/ai/embeddings";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Manage your application",
};

export default async function AdminPage() {
  const session = await getSession();
  const t = await getTranslations("admin");

  // Check if user is admin
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  // Fetch stats and AI search status
  const [[{ value: userCount }], [{ value: resourceCount }], [{ value: categoryCount }], [{ value: tagCount }], aiSearchEnabled] = await Promise.all([
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(resources),
    db.select({ value: count() }).from(categories),
    db.select({ value: count() }).from(tags),
    isAISearchEnabled(),
  ]);

  // Count resources without embeddings and total public resources
  let resourcesWithoutEmbeddings = 0;
  let totalPublicResources = 0;
  if (aiSearchEnabled) {
    const [noEmbedResult, publicResult] = await Promise.all([
      db.select({ value: count() }).from(resources).where(
        and(
          eq(resources.isPrivate, false),
          isNull(resources.deletedAt),
          isNull(resources.embedding),
        )
      ),
      db.select({ value: count() }).from(resources).where(
        and(
          eq(resources.isPrivate, false),
          isNull(resources.deletedAt),
        )
      ),
    ]);
    resourcesWithoutEmbeddings = noEmbedResult[0].value;
    totalPublicResources = publicResult[0].value;
  }

  // Count resources without slugs
  const [[{ value: resourcesWithoutSlugs }], [{ value: totalResources }]] = await Promise.all([
    db.select({ value: count() }).from(resources).where(
      and(isNull(resources.slug), isNull(resources.deletedAt))
    ),
    db.select({ value: count() }).from(resources).where(isNull(resources.deletedAt)),
  ]);

  // Fetch data for tables (users are fetched client-side with pagination)
  const [categoriesList, tagsList, webhooks, reports] = await Promise.all([
    db.query.categories.findMany({
      orderBy: [asc(categories.parentId), asc(categories.order)],
      with: {
        parent: {
          columns: {
            id: true,
            name: true,
          },
        },
        resources: true,
        children: true,
      },
    }),
    db.query.tags.findMany({
      orderBy: asc(tags.name),
      with: {
        resources: true,
      },
    }),
    db.select().from(webhookConfigs).orderBy(desc(webhookConfigs.createdAt)),
    db.query.resourceReports.findMany({
      orderBy: desc(resourceReports.createdAt),
      with: {
        resource: {
          columns: {
            id: true,
            slug: true,
            title: true,
            deletedAt: true,
          },
        },
        reporter: {
          columns: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
    }),
  ]);

  // Transform categories and tags to include _count for compatibility
  const categoriesWithCount = categoriesList.map((c) => ({
    ...c,
    _count: {
      resources: c.resources.length,
      children: c.children.length,
    },
  }));

  const tagsWithCount = tagsList.map((t) => ({
    ...t,
    _count: {
      resources: t.resources.length,
    },
  }));

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("stats.users")}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("stats.resources")}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resourceCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("stats.categories")}</CardTitle>
            <FolderTree className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoryCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("stats.tags")}</CardTitle>
            <Tags className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tagCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <AdminTabs
        translations={{
          users: t("tabs.users"),
          categories: t("tabs.categories"),
          tags: t("tabs.tags"),
          webhooks: t("tabs.webhooks"),
          resources: t("tabs.resources"),
          reports: t("tabs.reports"),
        }}
        pendingReportsCount={reports.filter(r => r.status === "PENDING").length}
        children={{
          users: <UsersTable />,
          categories: <CategoriesTable categories={categoriesWithCount as any} />,
          tags: <TagsTable tags={tagsWithCount} />,
          webhooks: <WebhooksTable webhooks={webhooks as any} />,
          resources: (
            <ResourcesManagement
              aiSearchEnabled={aiSearchEnabled}
              resourcesWithoutEmbeddings={resourcesWithoutEmbeddings}
              totalPublicResources={totalPublicResources}
              resourcesWithoutSlugs={resourcesWithoutSlugs}
              totalResources={totalResources}
            />
          ),
          reports: <ReportsTable reports={reports} />,
        }}
      />
    </div>
  );
}
