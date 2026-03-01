import { Metadata } from "next";
import { getTranslations } from "@/i18n/request";
import { Info } from "lucide-react";
import { asc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { ResourceForm } from "@/components/resources/resource-form";
import { db } from "@/lib/db";
import { categories, tags } from "@/lib/schema";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthRedirect } from "@/components/auth/auth-redirect";

export const metadata: Metadata = {
  title: "Register Resource",
  description: "Register a new MCP resource",
};

export default async function NewResourcePage() {
  const session = await getSession();
  const t = await getTranslations("resources");

  if (!session?.user) {
    return <AuthRedirect callbackUri="/registry/new" />;
  }

  // Fetch categories for the form (with parent info for nesting)
  const categoriesList = await db.select({
    id: categories.id,
    name: categories.name,
    slug: categories.slug,
    icon: categories.icon,
    parentId: categories.parentId,
  }).from(categories).orderBy(asc(categories.order), asc(categories.name));

  // Fetch tags for the form
  const tagsList = await db.select().from(tags).orderBy(asc(tags.name));

  return (
    <div className="container max-w-3xl py-8">
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          {t("createInfo")}
        </AlertDescription>
      </Alert>
      <ResourceForm
        categories={categoriesList}
        tags={tagsList}
      />
    </div>
  );
}
