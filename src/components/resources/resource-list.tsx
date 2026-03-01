"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Masonry } from "@/components/ui/masonry";
import { ResourceCard, type ResourceCardProps } from "@/components/resources/resource-card";

export interface ResourceListProps {
  resources: ResourceCardProps["resource"][];
  currentPage: number;
  totalPages: number;
  pinnedIds?: Set<string>;
  showPinButton?: boolean;
}

export function ResourceList({ resources, currentPage, totalPages, pinnedIds, showPinButton = false }: ResourceListProps) {
  const { t } = useTranslation();

  if (resources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <SearchX className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-1">{t("resources.noResources")}</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          {t("resources.noResourcesDescription")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Masonry columnCount={{ default: 1, md: 2, lg: 3 }} gap={16}>
        {resources.map((resource) => (
          <ResourceCard 
            key={resource.id} 
            resource={resource} 
            showPinButton={showPinButton}
            isPinned={pinnedIds?.has(resource.id) ?? false}
          />
        ))}
      </Masonry>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          {currentPage > 1 ? (
            <Button render={<Link href={`?page=${currentPage - 1}`} prefetch={false} />} variant="outline" size="sm" className="h-7 text-xs">Previous</Button>
          ) : (
            <Button variant="outline" size="sm" className="h-7 text-xs" disabled>Previous</Button>
          )}
          <span className="text-xs text-muted-foreground">{currentPage} / {totalPages}</span>
          {currentPage < totalPages ? (
            <Button render={<Link href={`?page=${currentPage + 1}`} prefetch={false} />} variant="outline" size="sm" className="h-7 text-xs">Next</Button>
          ) : (
            <Button variant="outline" size="sm" className="h-7 text-xs" disabled>Next</Button>
          )}
        </div>
      )}
    </div>
  );
}
