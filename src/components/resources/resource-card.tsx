"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { getResourceUrl } from "@/lib/urls";
import { ArrowBigUp, Lock, BadgeCheck, Link2, Globe, Server, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PinButton } from "@/components/resources/pin-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface ResourceCardProps {
  resource: {
    id: string;
    slug?: string | null;
    title: string;
    description: string | null;
    endpointUrl: string;
    serverType: string;
    status: string;
    isPrivate: boolean;
    voteCount: number;
    createdAt: Date;
    author: {
      id: string;
      name: string | null;
      username: string;
      avatar: string | null;
      verified?: boolean;
    };
    category: {
      id: string;
      name: string;
      slug: string;
    } | null;
    tags: Array<{
      tag: {
        id: string;
        name: string;
        slug: string;
        color: string;
      };
    }>;
    _count?: {
      votes?: number;
      outgoingConnections?: number;
      incomingConnections?: number;
    };
  };
  showPinButton?: boolean;
  isPinned?: boolean;
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  PENDING: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
  UNREACHABLE: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  SUSPENDED: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
};

export function ResourceCard({ resource, showPinButton = false, isPinned = false }: ResourceCardProps) {
  const { t } = useTranslation();
  const outgoingCount = resource._count?.outgoingConnections || 0;
  const incomingCount = resource._count?.incomingConnections || 0;
  const isFlowStart = outgoingCount > 0 && incomingCount === 0;

  const ServerTypeIcon = resource.serverType === "MCP" ? Server : Globe;

  return (
    <div className="group border rounded-[var(--radius)] overflow-hidden hover:border-foreground/20 transition-colors flex flex-col p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {resource.isPrivate && <Lock className="h-3 w-3 text-muted-foreground shrink-0" />}
          <ServerTypeIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <Link href={getResourceUrl(resource.id, resource.slug)} prefetch={false} className="font-medium text-sm hover:underline line-clamp-1">
            {resource.title}
          </Link>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {isFlowStart && (
            <div className="flex items-center gap-0.5 border rounded px-1.5 py-0.5">
              <Link2 className="h-3 w-3 text-muted-foreground" />
              <span className="flex items-center justify-center h-4 w-4 rounded-full bg-muted text-[9px] font-medium text-muted-foreground">
                {outgoingCount}
              </span>
            </div>
          )}
          <Badge variant="outline" className="text-[10px]">
            {resource.serverType}
          </Badge>
          <Badge className={`text-[10px] ${statusColors[resource.status] || statusColors.PENDING}`}>
            {resource.status}
          </Badge>
        </div>
      </div>

      {/* Description */}
      {resource.description && (
        <p className="text-xs text-muted-foreground line-clamp-3 mb-2">{resource.description}</p>
      )}

      {/* Endpoint URL */}
      {resource.endpointUrl && (
        <div className="relative flex-1 mb-3 min-h-0">
          <div className="text-xs text-muted-foreground bg-muted p-2 rounded overflow-hidden font-mono flex items-center gap-1.5">
            <ExternalLink className="h-3 w-3 shrink-0" />
            <span className="truncate">{resource.endpointUrl}</span>
          </div>
          {showPinButton && (
            <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
              <PinButton resourceId={resource.id} initialPinned={isPinned} iconOnly />
            </div>
          )}
        </div>
      )}

      {/* Tags */}
      {resource.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {resource.tags.slice(0, 3).map(({ tag }) => (
            <Link
              key={tag.id}
              href={`/tags/${tag.slug}`}
              prefetch={false}
              className="px-1.5 py-0.5 rounded text-[10px] hover:opacity-80 transition-opacity"
              style={{ backgroundColor: tag.color + "15", color: tag.color }}
            >
              {tag.name}
            </Link>
          ))}
          {resource.tags.length > 3 && (
            <span className="text-[10px] text-muted-foreground">+{resource.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t mt-auto">
        <div className="flex items-center gap-1.5">
          <Link href={`/@${resource.author.username}`} prefetch={false} className="hover:text-foreground flex items-center gap-1.5">
            <Avatar className="h-4 w-4">
              <AvatarImage src={resource.author.avatar || undefined} alt={resource.author.username} />
              <AvatarFallback className="text-[8px]">{resource.author.username[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            @{resource.author.username}
            {resource.author.verified && <BadgeCheck className="h-3 w-3 mt-0.5 text-primary shrink-0" />}
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-0.5">
            <ArrowBigUp className="h-3.5 w-3.5" />
            {resource.voteCount}
          </span>
          {resource.endpointUrl && (
            <Tooltip>
              <TooltipTrigger render={
                <a
                  href={resource.endpointUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 rounded hover:bg-accent"
                />
              }>
                <ExternalLink className="h-3 w-3" />
              </TooltipTrigger>
              <TooltipContent>{t("resources.visitEndpoint")}</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}
