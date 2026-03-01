"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getResourceUrl } from "@/lib/urls";

interface MiniResourceCardProps {
  resource: {
    id: string;
    slug?: string | null;
    title: string;
    description?: string | null;
    serverType: string;
    tags: string[];
  };
}

export function MiniResourceCard({ resource }: MiniResourceCardProps) {
  return (
    <Link
      href={getResourceUrl(resource.id, resource.slug)}
      target="_blank"
      prefetch={false}
      className="block p-2 border rounded-md hover:bg-accent/50 transition-colors text-xs"
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="font-medium line-clamp-1 flex-1">{resource.title}</span>
        <Badge variant="outline" className="text-[9px] shrink-0 py-0 px-1">
          {resource.serverType}
        </Badge>
      </div>
      {resource.description && (
        <p className="text-muted-foreground line-clamp-2 mb-1.5">
          {resource.description}
        </p>
      )}
      {resource.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {resource.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-1 py-0.5 rounded text-[9px] bg-muted text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
