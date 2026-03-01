"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { analyticsResource } from "@/lib/analytics";

interface DismissChangeRequestButtonProps {
  changeRequestId: string;
  resourceId: string;
}

export function DismissChangeRequestButton({ changeRequestId, resourceId }: DismissChangeRequestButtonProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleDismiss = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/resources/${resourceId}/changes/${changeRequestId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to dismiss change request");
      }

      analyticsResource.changeRequest(resourceId, "dismiss");
      toast.success(t("changeRequests.dismissed"));
      router.push(`/registry/${resourceId}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.error"));
    } finally {
      setIsLoading(false);
      setOpen(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button variant="outline" size="sm" className="text-destructive hover:text-destructive" />}>
          <Trash2 className="h-4 w-4 mr-1.5" />
          {t("changeRequests.dismiss")}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("changeRequests.dismissConfirmTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("changeRequests.dismissConfirmDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDismiss}
            disabled={isLoading}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t("changeRequests.dismiss")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
