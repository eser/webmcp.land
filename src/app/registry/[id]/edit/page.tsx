import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AuthRedirect } from "@/components/auth/auth-redirect";
import { getLocale, getTranslations } from "@/i18n/request";
import { asc, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { resources, categories, tags } from "@/lib/schema";
import { ResourceForm } from "@/components/resources/resource-form";


interface EditResourcePageProps {
  params: Promise<{ id: string }>;
}

/**
 * Extracts the resource ID from a URL parameter that may contain a slug
 */
function extractResourceId(idParam: string): string {
  const underscoreIndex = idParam.indexOf("_");
  if (underscoreIndex !== -1) {
    return idParam.substring(0, underscoreIndex);
  }
  return idParam;
}

export const metadata: Metadata = {
  title: "Edit Resource",
  description: "Edit your resource",
};

export default async function EditResourcePage({ params }: EditResourcePageProps) {
  const { id: idParam } = await params;
  const id = extractResourceId(idParam);
  const session = await getSession();
  const t = await getTranslations("resources");

  if (!session?.user) {
    return <AuthRedirect callbackUri="/registry" />;
  }

  // Fetch the resource
  const resource = await db.query.resources.findFirst({
    where: eq(resources.id, id),
    with: {
      tags: {
        with: {
          tag: true,
        },
      },
    },
  });

  if (!resource) {
    notFound();
  }

  // Check if user is the author or admin
  const isAuthor = resource.authorId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";

  if (!isAuthor && !isAdmin) {
    redirect(`/registry/${id}`);
  }

  // Fetch categories and tags for the form
  const [categoriesList, tagsList] = await Promise.all([
    db.select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      icon: categories.icon,
      parentId: categories.parentId,
    }).from(categories).orderBy(asc(categories.order), asc(categories.name)),
    db.select().from(tags).orderBy(asc(tags.name)),
  ]);

  // Transform resource data for the form
  const initialData = {
    title: resource.title,
    description: resource.description || "",
    endpointUrl: resource.endpointUrl,
    serverType: resource.serverType as "MCP" | "WEBMCP",
    categoryId: resource.categoryId || undefined,
    tagIds: resource.tags.map((t) => t.tagId),
    isPrivate: resource.isPrivate,
  };

  return (
    <div className="container max-w-3xl py-8">
      <ResourceForm
        categories={categoriesList}
        tags={tagsList}
        initialData={initialData}
        resourceId={id}
        mode="edit"
      />
    </div>
  );
}
