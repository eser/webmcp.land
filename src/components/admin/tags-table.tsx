"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { MoreHorizontal, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string;
  resources: unknown[];
  _count: {
    resources: number;
  };
}

interface TagsTableProps {
  tags: Tag[];
}

export function TagsTable({ tags }: TagsTableProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [editTag, setEditTag] = useState<Tag | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", slug: "", color: "#6366f1" });

  const openCreateDialog = () => {
    setFormData({ name: "", slug: "", color: "#6366f1" });
    setIsCreating(true);
  };

  const openEditDialog = (tag: Tag) => {
    setFormData({
      name: tag.name,
      slug: tag.slug,
      color: tag.color,
    });
    setEditTag(tag);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const url = editTag ? `/api/admin/tags/${editTag.id}` : "/api/admin/tags";
      const method = editTag ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to save");

      toast.success(editTag ? t("admin.tags.updated") : t("admin.tags.created"));
      router.refresh();
      setEditTag(null);
      setIsCreating(false);
    } catch {
      toast.error(t("admin.tags.saveFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tags/${deleteId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      toast.success(t("admin.tags.deleted"));
      router.refresh();
    } catch {
      toast.error(t("admin.tags.deleteFailed"));
    } finally {
      setLoading(false);
      setDeleteId(null);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">{t("admin.tags.title")}</h3>
          <p className="text-sm text-muted-foreground">{t("admin.tags.description")}</p>
        </div>
        <Button size="sm" onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          {t("admin.tags.add")}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("admin.tags.name")}</TableHead>
              <TableHead>{t("admin.tags.slug")}</TableHead>
              <TableHead>{t("admin.tags.color")}</TableHead>
              <TableHead className="text-center">{t("admin.tags.prompts")}</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  {t("admin.tags.noTags")}
                </TableCell>
              </TableRow>
            ) : (
              tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell>
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded text-sm font-medium"
                      style={{ backgroundColor: tag.color + "20", color: tag.color }}
                    >
                      {tag.name}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{tag.slug}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="text-sm text-muted-foreground">{tag.color}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{tag._count.resources}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                          <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(tag)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          {t("admin.tags.edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteId(tag.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t("admin.tags.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreating || !!editTag} onOpenChange={() => { setIsCreating(false); setEditTag(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTag ? t("admin.tags.editTitle") : t("admin.tags.createTitle")}</DialogTitle>
            <DialogDescription>{editTag ? t("admin.tags.editDescription") : t("admin.tags.createDescription")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{t("admin.tags.name")}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">{t("admin.tags.slug")}</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="color">{t("admin.tags.color")}</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#6366f1"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreating(false); setEditTag(null); }}>
              {t("admin.tags.cancel")}
            </Button>
            <Button onClick={handleSubmit} disabled={loading || !formData.name || !formData.slug}>
              {editTag ? t("admin.tags.save") : t("admin.tags.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.tags.deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("admin.tags.deleteConfirmDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("admin.tags.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {t("admin.tags.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
