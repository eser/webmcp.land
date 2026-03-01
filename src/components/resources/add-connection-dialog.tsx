"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Search, Link2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDebounce } from "@/lib/hooks/use-debounce";

interface SearchResult {
  id: string;
  title: string;
  author: {
    username: string;
  };
}

interface AddConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceId: string;
  connectionType: "previous" | "next";
  onConnectionAdded: () => void;
}

export function AddConnectionDialog({
  open,
  onOpenChange,
  resourceId,
  connectionType,
  onConnectionAdded,
}: AddConnectionDialogProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedResource, setSelectedResource] = useState<SearchResult | null>(null);
  const [label, setLabel] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const debouncedQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const searchResources = async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/resources/search?q=${encodeURIComponent(debouncedQuery)}&limit=10&ownerOnly=true`
        );
        if (res.ok) {
          const data = await res.json();
          // Filter out the current resource
          setSearchResults(
            data.resources.filter((p: SearchResult) => p.id !== resourceId)
          );
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsSearching(false);
      }
    };

    searchResources();
  }, [debouncedQuery, resourceId]);

  const handleSubmit = async () => {
    if (!selectedResource || !label.trim()) {
      setError(t("connectedResources.fillAllFields"));
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // For "previous" connections, we create the connection FROM the selected resource TO the current resource
      // For "next" connections, we create the connection FROM the current resource TO the selected resource
      const sourceId = connectionType === "previous" ? selectedResource.id : resourceId;
      const targetId = connectionType === "previous" ? resourceId : selectedResource.id;

      const res = await fetch(`/api/resources/${sourceId}/connections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetId: targetId,
          label: label.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t("connectedResources.connectionFailed"));
        return;
      }

      onConnectionAdded();
      handleClose();
    } catch {
      setError(t("connectedResources.connectionFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedResource(null);
    setLabel("");
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            {connectionType === "previous" ? t("connectedResources.addPreviousTitle") : t("connectedResources.addNextTitle")}
          </DialogTitle>
          <DialogDescription>
            {connectionType === "previous" ? t("connectedResources.addPreviousDescription") : t("connectedResources.addNextDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!selectedResource ? (
            <div className="space-y-2">
              <Label>{t("connectedResources.searchResource")}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("connectedResources.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {isSearching && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                  {searchResults.map((resource) => (
                    <button
                      key={resource.id}
                      className="w-full px-3 py-2 text-left hover:bg-accent transition-colors"
                      onClick={() => {
                        setSelectedResource(resource);
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                    >
                      <p className="text-sm font-medium truncate">{resource.title}</p>
                      <p className="text-xs text-muted-foreground">
                        @{resource.author.username}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {debouncedQuery.length >= 2 &&
                !isSearching &&
                searchResults.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t("connectedResources.noResults")}
                  </p>
                )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label>{t("connectedResources.selectedResource")}</Label>
                <div className="mt-1.5 p-3 rounded-lg border bg-muted/50 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{selectedResource.title}</p>
                    <p className="text-xs text-muted-foreground">
                      @{selectedResource.author.username}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedResource(null)}
                  >
                    {t("connectedResources.change")}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="connection-label">{t("connectedResources.connectionLabel")}</Label>
                <Input
                  id="connection-label"
                  placeholder={t("connectedResources.labelPlaceholder")}
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="mt-1.5"
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t("connectedResources.labelHint")}
                </p>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              {t("connectedResources.cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedResource || !label.trim() || isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {connectionType === "previous" ? t("connectedResources.addPrevious") : t("connectedResources.addNext")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
