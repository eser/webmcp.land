"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, FileText, FileCode, Check, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface DownloadResourceDropdownProps {
  resourceId: string;
  resourceSlug?: string;
}

export function DownloadResourceDropdown({ resourceId, resourceSlug }: DownloadResourceDropdownProps) {
  const { t } = useTranslation();
  const [copiedFormat, setCopiedFormat] = useState<"md" | "yml" | null>(null);

  const getFileName = (format: "md" | "yml") => {
    const base = resourceSlug ? `${resourceId}_${resourceSlug}` : resourceId;
    return `${base}.resource.${format}`;
  };

  const getFileUrl = (format: "md" | "yml") => {
    if (typeof window === "undefined") return "";
    const base = resourceSlug ? `${resourceId}_${resourceSlug}` : resourceId;
    return `${window.location.origin}/registry/${base}.resource.${format}`;
  };

  const handleDownload = async (format: "md" | "yml") => {
    const url = getFileUrl(format);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch");
      const content = await response.text();

      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = getFileName(format);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      toast.success(t("resources.downloadStarted"));
    } catch {
      toast.error(t("resources.downloadFailed"));
    }
  };

  const handleCopyUrl = async (format: "md" | "yml") => {
    const url = getFileUrl(format);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedFormat(format);
      toast.success(t("resources.urlCopied"));
      setTimeout(() => setCopiedFormat(null), 2000);
    } catch {
      toast.error(t("resources.failedToCopyUrl"));
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="sm" />}>
          <Download className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => handleDownload("md")}>
          <FileText className="h-4 w-4 mr-2" />
          {t("resources.downloadMarkdown")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDownload("yml")}>
          <FileCode className="h-4 w-4 mr-2" />
          {t("resources.downloadYaml")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleCopyUrl("md")}>
          {copiedFormat === "md" ? (
            <Check className="h-4 w-4 mr-2 text-green-500" />
          ) : (
            <Link className="h-4 w-4 mr-2" />
          )}
          {t("resources.copyMarkdownUrl")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleCopyUrl("yml")}>
          {copiedFormat === "yml" ? (
            <Check className="h-4 w-4 mr-2 text-green-500" />
          ) : (
            <Link className="h-4 w-4 mr-2" />
          )}
          {t("resources.copyYamlUrl")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
