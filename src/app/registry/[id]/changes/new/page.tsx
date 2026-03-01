import { notFound, redirect } from "next/navigation";
import { AuthRedirect } from "@/components/auth/auth-redirect";
import Link from "next/link";
import { getLocale, getTranslations } from "@/i18n/request";
import { ArrowLeft } from "lucide-react";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { resources } from "@/lib/schema";
import { Button } from "@/components/ui/button";
import { ChangeRequestForm } from "@/components/resources/change-request-form";

interface NewChangeRequestPageProps {
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

export default async function NewChangeRequestPage({ params }: NewChangeRequestPageProps) {
  const session = await getSession();
  const t = await getTranslations("changeRequests");

  if (!session?.user) {
    return <AuthRedirect callbackUri="/registry" />;
  }

  const { id: idParam } = await params;
  const id = extractResourceId(idParam);

  const [resource] = await db.select({
    id: resources.id,
    title: resources.title,
    description: resources.description,
    endpointUrl: resources.endpointUrl,
    serverType: resources.serverType,
    authorId: resources.authorId,
    isPrivate: resources.isPrivate,
  }).from(resources).where(eq(resources.id, id));

  if (!resource) {
    notFound();
  }

  // Can't create change request for own resource
  if (resource.authorId === session.user.id) {
    redirect(`/registry/${id}`);
  }

  // Can't create change request for private resource
  if (resource.isPrivate) {
    notFound();
  }

  return (
    <div className="container max-w-3xl py-6">
      {/* Header */}
      <div className="mb-6">
        <Button render={<Link href={`/registry/${id}`} />} variant="ghost" size="sm" className="mb-4 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            {t("backToPrompt")}
        </Button>
        <h1 className="text-xl font-semibold">{t("create")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {resource.title}
        </p>
      </div>

      {/* Form */}
      <ChangeRequestForm
        resourceId={resource.id}
        currentContent={resource.description || ""}
        currentTitle={resource.title}
        resourceType={resource.serverType}
      />
    </div>
  );
}
