"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface AddVersionFormProps {
  resourceId: string;
  currentDescription: string;
}

export function AddVersionForm({ resourceId, currentDescription }: AddVersionFormProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [description, setDescription] = useState(currentDescription);
  const [changeNote, setChangeNote] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (description === currentDescription) {
      toast.error(t("version.contentMustDiffer"));
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/resources/${resourceId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, changeNote }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create version");
      }

      toast.success(t("version.versionCreated"));
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      // Reset form when opening
      setDescription(currentDescription);
      setChangeNote("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="px-2 sm:px-3" />}>
          <Plus className="h-4 w-4 sm:mr-1.5" />
          <span className="hidden sm:inline">{t("version.newVersion")}</span>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("version.createNewVersion")}</DialogTitle>
            <DialogDescription>
              {t("version.updateDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="description">{t("version.resourceContent")}</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("version.contentPlaceholder")}
                className="min-h-[200px] font-mono text-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="changeNote">{t("version.changeNote")}</Label>
              <Input
                id="changeNote"
                value={changeNote}
                onChange={(e) => setChangeNote(e.target.value)}
                placeholder={t("version.changeNotePlaceholder")}
                maxLength={500}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isLoading || description === currentDescription}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t("version.createVersion")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
