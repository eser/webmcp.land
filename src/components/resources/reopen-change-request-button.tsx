"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { analyticsResource } from "@/lib/analytics";

interface ReopenChangeRequestButtonProps {
  changeRequestId: string;
  resourceId: string;
}

export function ReopenChangeRequestButton({ changeRequestId, resourceId }: ReopenChangeRequestButtonProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const handleReopen = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/resources/${resourceId}/changes/${changeRequestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PENDING" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to reopen change request");
      }

      analyticsResource.changeRequest(resourceId, "reopen");
      toast.success(t("changeRequests.reopenedSuccess"));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.somethingWentWrong"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleReopen}
      disabled={isLoading}
      variant="outline"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <RotateCcw className="h-4 w-4 mr-2" />
      )}
      {t("changeRequests.reopen")}
    </Button>
  );
}
