"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { ArrowBigUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getResourceUrl } from "@/lib/urls";

interface RelatedResource {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  type: string;
  author: {
    id: string;
    name: string | null;
    username: string;
    avatar: string | null;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  _count: {
    votes: number;
  };
}

interface RelatedResourcesProps {
  resources: RelatedResource[];
}

export function RelatedResources({ resources }: RelatedResourcesProps) {
  const { t } = useTranslation();

  if (resources.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold">{t("resources.relatedResources")}</h3>
      </div>
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
        {resources.map((resource) => (
          <Link
            key={resource.id}
            href={getResourceUrl(resource.id, resource.slug)}
            className="group border rounded-[var(--radius)] p-4 hover:border-foreground/20 transition-colors flex flex-col"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="font-medium text-sm line-clamp-1 group-hover:underline">
                {resource.title}
              </h4>
              <Badge variant="outline" className="text-[10px] shrink-0">
                {resource.serverType || "WEBMCP"}
              </Badge>
            </div>

            {/* Description */}
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">
              {resource.description || "—"}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-2">
              <div className="flex items-center gap-1.5">
                <Avatar className="h-4 w-4">
                  <AvatarImage src={resource.author.avatar || undefined} />
                  <AvatarFallback className="text-[8px]">
                    {resource.author.name?.[0] || resource.author.username[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="shrink-0">
                  @{resource.author.username}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <ArrowBigUp className="h-3.5 w-3.5" />
                <span>{resource._count.votes}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
