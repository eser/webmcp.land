"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { analyticsResource } from "@/lib/analytics";

interface PinButtonProps {
  resourceId: string;
  initialPinned: boolean;
  iconOnly?: boolean;
}

export function PinButton({ resourceId, initialPinned, iconOnly = false }: PinButtonProps) {
  const { t } = useTranslation();
  const [isPinned, setIsPinned] = useState(initialPinned);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/resources/${resourceId}/pin`, {
        method: isPinned ? "DELETE" : "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || t("resources.pinFailed"));
        return;
      }

      setIsPinned(data.pinned);
      if (data.pinned) {
        analyticsResource.pin(resourceId);
      } else {
        analyticsResource.unpin(resourceId);
      }
      toast.success(data.pinned ? t("resources.pinned") : t("resources.unpinned"));
    } catch {
      toast.error(t("resources.pinFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  if (iconOnly) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={`h-7 w-7 ${isPinned ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
        onClick={handleToggle}
        disabled={isLoading}
        title={isPinned ? t("resources.unpin") : t("resources.pin")}
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Pin className={`h-3.5 w-3.5 ${isPinned ? "fill-current" : ""}`} />
        )}
      </Button>
    );
  }

  return (
    <Button
      variant={isPinned ? "secondary" : "outline"}
      size="sm"
      onClick={handleToggle}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Pin className={`h-4 w-4 mr-2 ${isPinned ? "fill-current" : ""}`} />
      )}
      {isPinned ? t("resources.unpin") : t("resources.pin")}
    </Button>
  );
}
