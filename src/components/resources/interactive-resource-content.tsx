"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Check, ExternalLink, Globe, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShareDropdown } from "./share-dropdown";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface InteractiveResourceContentProps {
  description: string | null;
  endpointUrl: string;
  serverType: string;
  status: string;
  capabilities?: Record<string, unknown> | null;
  methods?: Array<Record<string, unknown>> | null;
  useCases?: Array<Record<string, unknown>> | null;
  className?: string;
  title?: string;
  isLoggedIn?: boolean;
  resourceId?: string;
  resourceSlug?: string;
  shareTitle?: string;
  resourceTitle?: string;
  resourceDescription?: string;
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  PENDING: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
  UNREACHABLE: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  SUSPENDED: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
};

export function InteractiveResourceContent({
  description,
  endpointUrl,
  serverType,
  status,
  capabilities,
  methods,
  useCases,
  className,
  title,
  resourceId,
  resourceSlug,
  shareTitle,
  resourceTitle,
  resourceDescription,
}: InteractiveResourceContentProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const copyEndpointUrl = async () => {
    await navigator.clipboard.writeText(endpointUrl);
    setCopied(true);
    toast.success(t("common.copiedToClipboard"));
    setTimeout(() => setCopied(false), 2000);
  };

  const ServerTypeIcon = serverType === "MCP" ? Server : Globe;

  return (
    <div className={className}>
      {/* Endpoint URL */}
      <div className="mb-4 p-3 bg-muted/50 rounded-lg border">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <ServerTypeIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t("resources.endpointUrl")}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-[10px]">
              {serverType}
            </Badge>
            <Badge className={`text-[10px] ${statusColors[status] || statusColors.PENDING}`}>
              {status}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-sm font-mono break-all">{endpointUrl}</code>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={copyEndpointUrl}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
          {endpointUrl && (
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" render={<a href={endpointUrl} target="_blank" rel="noopener noreferrer" />}>
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Description */}
      {description && (
        <div className="mb-4">
          <p className="text-sm whitespace-pre-wrap">{description}</p>
        </div>
      )}

      {/* Methods / Tools */}
      {methods && Array.isArray(methods) && methods.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            {t("resources.tools")}
          </h3>
          <div className="space-y-1.5">
            {methods.map((method, i) => (
              <div key={i} className="p-2 bg-muted/30 rounded border text-sm font-mono">
                {typeof method === "object" && method !== null
                  ? JSON.stringify(method)
                  : String(method)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Use Cases */}
      {useCases && Array.isArray(useCases) && useCases.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            {t("resources.useCases")}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {useCases.map((useCase, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {typeof useCase === "object" && useCase !== null
                  ? JSON.stringify(useCase)
                  : String(useCase)}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t">
        <Button variant="outline" size="sm" onClick={copyEndpointUrl}>
          {copied ? <Check className="h-3.5 w-3.5 mr-1.5" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
          {t("resources.copyEndpoint")}
        </Button>
        {shareTitle && resourceId && (
          <ShareDropdown
            title={shareTitle}
            resourceId={resourceId}
          />
        )}
      </div>
    </div>
  );
}
