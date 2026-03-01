"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { analyticsResource } from "@/lib/analytics";

interface CopyButtonProps {
  content: string;
  resourceId?: string;
}

export function CopyButton({ content, resourceId }: CopyButtonProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      analyticsResource.copy(resourceId);
      toast.success(t("common.copied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("common.failedToCopy"));
    }
  };

  return (
    <Button variant="ghost" size="sm" onClick={copyToClipboard}>
      {copied ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );
}
