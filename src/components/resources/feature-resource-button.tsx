"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { analyticsResource } from "@/lib/analytics";

interface FeatureResourceButtonProps {
  resourceId: string;
  isFeatured: boolean;
  className?: string;
}

export function FeatureResourceButton({
  resourceId,
  isFeatured: initialFeatured,
  className,
}: FeatureResourceButtonProps) {
  const { t } = useTranslation();
  const [isFeatured, setIsFeatured] = useState(initialFeatured);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/resources/${resourceId}/feature`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setIsFeatured(data.isFeatured);
        if (data.isFeatured) {
          analyticsResource.feature(resourceId);
        } else {
          analyticsResource.unfeature(resourceId);
        }
      }
    } catch (error) {
      console.error("Error toggling featured status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={isFeatured ? "default" : "outline"}
      size="sm"
      onClick={handleToggle}
      disabled={isLoading}
      className={cn("gap-1.5", className)}
    >
      <Star className={cn("h-4 w-4", isFeatured && "fill-current")} />
      {isFeatured ? t("resources.featured") : t("resources.feature")}
    </Button>
  );
}
