"use client";

import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { GitCompare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DiffView } from "@/components/ui/diff-view";

interface Version {
  id: string;
  version: number;
  description: string | null;
  changeNote: string | null;
  createdAt: Date;
  author: {
    name: string | null;
    username: string;
  };
}

interface VersionCompareModalProps {
  versions: Version[];
  currentDescription: string;
}

export function VersionCompareModal({ versions, currentDescription }: VersionCompareModalProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  // Add current version to the list
  const allVersions = useMemo(() => {
    const current = {
      id: "current",
      version: versions.length > 0 ? versions[0].version + 1 : 1,
      description: currentDescription,
      changeNote: null,
      createdAt: new Date(),
      author: { name: "Current", username: "current" },
    };
    return [current, ...versions];
  }, [versions, currentDescription]);

  const [versionA, setVersionA] = useState<string>(allVersions[1]?.id || "");
  const [versionB, setVersionB] = useState<string>(allVersions[0]?.id || "current");

  const contentA = useMemo(() => {
    const v = allVersions.find((v) => v.id === versionA);
    return v?.description || "";
  }, [allVersions, versionA]);

  const contentB = useMemo(() => {
    const v = allVersions.find((v) => v.id === versionB);
    return v?.description || "";
  }, [allVersions, versionB]);

  const versionALabel = useMemo(() => {
    const v = allVersions.find((v) => v.id === versionA);
    return v?.id === "current" ? t("resources.currentVersion") : `${t("resources.version")} ${v?.version}`;
  }, [allVersions, versionA, t]);

  const versionBLabel = useMemo(() => {
    const v = allVersions.find((v) => v.id === versionB);
    return v?.id === "current" ? t("resources.currentVersion") : `${t("resources.version")} ${v?.version}`;
  }, [allVersions, versionB, t]);

  if (versions.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="px-2 sm:px-3" />}>
          <GitCompare className="h-4 w-4 sm:mr-1.5" />
          <span className="hidden sm:inline">{t("resources.compare")}</span>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("resources.compareVersions")}</DialogTitle>
        </DialogHeader>

        {/* Version selectors */}
        <div className="flex items-center gap-4 py-2">
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t("resources.compareFrom")}</Label>
            <Select value={versionA} onValueChange={(value) => value && setVersionA(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allVersions.map((v) => (
                  <SelectItem key={v.id} value={v.id} disabled={v.id === versionB}>
                    {v.id === "current" ? t("resources.currentVersion") : `${t("resources.version")} ${v.version}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center pt-5">
            <span className="text-muted-foreground">→</span>
          </div>

          <div className="flex-1 space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t("resources.compareTo")}</Label>
            <Select value={versionB} onValueChange={(value) => value && setVersionB(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allVersions.map((v) => (
                  <SelectItem key={v.id} value={v.id} disabled={v.id === versionA}>
                    {v.id === "current" ? t("resources.currentVersion") : `${t("resources.version")} ${v.version}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Diff view */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {versionA && versionB ? (
            <div className="h-full">
              <div className="text-xs text-muted-foreground mb-2">
                {t("resources.comparing")} <span className="font-medium text-red-600 dark:text-red-400">{versionALabel}</span>
                {" → "}
                <span className="font-medium text-green-600 dark:text-green-400">{versionBLabel}</span>
              </div>
              <DiffView
                original={contentA}
                modified={contentB}
                className="max-h-[calc(90vh-220px)]"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              {t("resources.selectVersionsToCompare")}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
