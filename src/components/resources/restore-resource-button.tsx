"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface RestoreResourceButtonProps {
  resourceId: string;
}

export function RestoreResourceButton({ resourceId }: RestoreResourceButtonProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [isRestoring, setIsRestoring] = useState(false);

  const handleRestore = async () => {
    setIsRestoring(true);

    try {
      const response = await fetch(`/api/resources/${resourceId}/restore`, {
        method: "POST",
      });

      if (response.ok) {
        toast.success(t("resources.resourceRestored"));
        router.refresh();
      } else {
        const data = await response.json();
        toast.error(data.error || t("resources.restoreError"));
      }
    } catch {
      toast.error(t("resources.restoreError"));
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRestore}
      disabled={isRestoring}
    >
      {isRestoring ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <RotateCcw className="h-4 w-4 mr-2" />
      )}
      {t("resources.restoreResource")}
    </Button>
  );
}
