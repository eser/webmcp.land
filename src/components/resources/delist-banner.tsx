"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { AlertTriangle, Trash2, Loader2, ListPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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

type DelistReason = "TOO_SHORT" | "NOT_ENGLISH" | "LOW_QUALITY" | "NOT_LLM_INSTRUCTION" | "MANUAL";

interface DelistBannerProps {
  resourceId: string;
  delistReason: DelistReason | null;
  isOwner: boolean;
  isDeleted?: boolean;
}

export function DelistBanner({ resourceId, delistReason, isOwner, isDeleted = false }: DelistBannerProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRequestingRelist, setIsRequestingRelist] = useState(false);
  const [hasRequestedRelist, setHasRequestedRelist] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getReasonText = (reason: DelistReason | null): string => {
    switch (reason) {
      case "TOO_SHORT":
        return t("resources.delistReasonTooShort");
      case "NOT_ENGLISH":
        return t("resources.delistReasonNotEnglish");
      case "LOW_QUALITY":
        return t("resources.delistReasonLowQuality");
      case "NOT_LLM_INSTRUCTION":
        return t("resources.delistReasonNotInstruction");
      case "MANUAL":
        return t("resources.delistReasonManual");
      default:
        return t("resources.delistReasonUnknown");
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/resources/${resourceId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/");
        router.refresh();
      } else {
        const data = await response.json();
        setError(data.message || t("resources.deleteError"));
      }
    } catch {
      setError(t("resources.deleteError"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRequestRelist = async () => {
    setIsRequestingRelist(true);
    setError(null);

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceId,
          reason: "RELIST_REQUEST",
          details: `Relist request for resource delisted due to: ${delistReason}`,
        }),
      });

      if (response.ok) {
        setHasRequestedRelist(true);
        toast.success(t("resources.relistRequestSent"));
      } else {
        const data = await response.json();
        if (data.error === "You have already reported this resource") {
          setHasRequestedRelist(true);
          toast.info(t("resources.relistRequestAlreadySent"));
        } else {
          setError(data.error || t("resources.relistRequestError"));
        }
      }
    } catch {
      setError(t("resources.relistRequestError"));
    } finally {
      setIsRequestingRelist(false);
    }
  };

  return (
    <div className="mb-6 p-4 rounded-lg border border-amber-500/30 bg-amber-500/5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1 flex-1">
          <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400">
            {t("resources.resourceDelisted")}
          </h3>
          <p className="text-sm text-amber-600 dark:text-amber-500">
            {getReasonText(delistReason)}
          </p>
          {isOwner && delistReason && delistReason !== "MANUAL" && (
            <p className="text-xs text-muted-foreground mt-2">
              {t("resources.delistOwnerNote")}
            </p>
          )}
        </div>
      </div>

      {isOwner && delistReason && delistReason !== "MANUAL" && !isDeleted && (
        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={isRequestingRelist || hasRequestedRelist}
            onClick={handleRequestRelist}
          >
            {isRequestingRelist ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ListPlus className="h-4 w-4 mr-2" />
            )}
            {hasRequestedRelist ? t("resources.relistRequested") : t("resources.requestListing")}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger render={<Button
                variant="destructive"
                size="sm"
                disabled={isDeleting}
               />}>
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                {t("resources.deleteResource")}
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("resources.deleteResourceTitle")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("resources.deleteResourceDescription")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("resources.cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {t("resources.deleteResource")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500 mt-2">{error}</p>
      )}
    </div>
  );
}
