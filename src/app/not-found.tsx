"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <div className="container flex flex-col items-center justify-center min-h-[60vh] py-12">
      <div className="text-center space-y-6 max-w-md">
        {/* Icon */}
        <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center">
          <FileQuestion className="h-10 w-10 text-muted-foreground" />
        </div>

        {/* Error Code */}
        <div className="space-y-2">
          <h1 className="text-7xl font-bold text-primary">404</h1>
          <h2 className="text-xl font-semibold">{t("notFound.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("notFound.description")}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Button render={<Link href="/" />}>
              <Home className="mr-2 h-4 w-4" />
              {t("notFound.goHome")}
          </Button>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("notFound.goBack")}
          </Button>
        </div>

        {/* Helpful Links */}
        <div className="pt-8 border-t">
          <p className="text-xs text-muted-foreground mb-3">
            {t("notFound.helpfulLinks")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <Link href="/registry" className="text-primary hover:underline">
              {t("notFound.browseResources")}
            </Link>
            <Link href="/categories" className="text-primary hover:underline">
              {t("notFound.categories")}
            </Link>
            <Link href="/registry/new" className="text-primary hover:underline">
              {t("notFound.createResource")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
