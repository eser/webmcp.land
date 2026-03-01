"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { analyticsResource } from "@/lib/analytics";

interface ChangeRequestActionsProps {
  changeRequestId: string;
  resourceId: string;
}

export function ChangeRequestActions({ changeRequestId, resourceId }: ChangeRequestActionsProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [reviewNote, setReviewNote] = useState("");

  const handleAction = async (selectedAction: "approve" | "reject") => {
    setIsLoading(true);
    setAction(selectedAction);

    try {
      const response = await fetch(`/api/resources/${resourceId}/changes/${changeRequestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: selectedAction === "approve" ? "APPROVED" : "REJECTED",
          reviewNote: reviewNote || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update change request");
      }

      analyticsResource.changeRequest(resourceId, selectedAction === "approve" ? "approve" : "dismiss");
      toast.success(selectedAction === "approve" ? t("changeRequests.approvedSuccess") : t("changeRequests.rejectedSuccess"));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.somethingWentWrong"));
    } finally {
      setIsLoading(false);
      setAction(null);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{t("changeRequests.reviewActions")}</p>
      <Textarea
        id="reviewNote"
        value={reviewNote}
        onChange={(e) => setReviewNote(e.target.value)}
        placeholder={t("changeRequests.reviewNotePlaceholder")}
        className="min-h-[60px] text-sm"
      />
      <div className="flex gap-2">
        <Button
          onClick={() => handleAction("approve")}
          disabled={isLoading}
          size="sm"
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          {isLoading && action === "approve" ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <Check className="h-4 w-4 mr-1.5" />
          )}
          {t("changeRequests.approve")}
        </Button>
        <Button
          onClick={() => handleAction("reject")}
          disabled={isLoading}
          variant="destructive"
          size="sm"
          className="flex-1"
        >
          {isLoading && action === "reject" ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <X className="h-4 w-4 mr-1.5" />
          )}
          {t("changeRequests.reject")}
        </Button>
      </div>
    </div>
  );
}
