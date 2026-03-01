"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { GitCompare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DiffView } from "@/components/ui/diff-view";

interface VersionCompareButtonProps {
  versionContent: string;
  versionNumber: number;
  currentContent: string;
}

export function VersionCompareButton({
  versionContent,
  versionNumber,
  currentContent,
}: VersionCompareButtonProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={() => setOpen(true)}
        title={t("resources.compareWithCurrent")}
      >
        <GitCompare className="h-3.5 w-3.5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {t("resources.version")} {versionNumber} → {t("resources.currentVersion")}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-hidden">
            <DiffView
              original={versionContent}
              modified={currentContent}
              className="max-h-[calc(90vh-120px)]"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
