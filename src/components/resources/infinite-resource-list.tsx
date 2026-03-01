"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Loader2, SearchX, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Masonry } from "@/components/ui/masonry";
import { useFilterContext } from "./filter-context";
import { ResourceCard, type ResourceCardProps } from "./resource-card";

interface InfiniteResourceListProps {
  initialResources: ResourceCardProps["resource"][];
  initialTotal: number;
  filters: {
    q?: string;
    type?: string;
    category?: string;
    categorySlug?: string;
    tag?: string;
    sort?: string;
  };
}

function ResourceCardSkeleton() {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-5 w-5 rounded" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex items-center gap-2 pt-2">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  );
}

export function InfiniteResourceList({
  initialResources,
  initialTotal,
  filters
}: InfiniteResourceListProps) {
  const { t } = useTranslation();
  const _searchParams = useSearchParams();
  const { isFilterPending, setFilterPending } = useFilterContext();
  const [resources, setResources] = useState(initialResources);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialResources.length < initialTotal);
  const [hasError, setHasError] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Reset when new data arrives from server
  useEffect(() => {
    // Cancel any in-flight request when filters change
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setResources(initialResources);
    setPage(1);
    setHasMore(initialResources.length < initialTotal);
    setHasError(false);
    setFilterPending(false);
  }, [initialResources, initialTotal, setFilterPending]);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setHasError(false);
    try {
      const nextPage = page + 1;
      const params = new URLSearchParams();
      params.set("resources.page", nextPage.toString());
      if (filters.q) params.set("resources.q", filters.q);
      if (filters.type) params.set("resources.type", filters.type);
      if (filters.category) params.set("resources.category", filters.category);
      if (filters.tag) params.set("resources.tag", filters.tag);
      if (filters.sort) params.set("resources.sort", filters.sort);

      const response = await fetch(`/api/resources?${params.toString()}`, {
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("Failed to fetch");

      const data = await response.json();

      // Deduplicate by ID to prevent duplicate key errors
      setResources((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const newResources = data.resources.filter((p: { id: string }) => !existingIds.has(p.id));
        // Calculate hasMore using updated length
        const newTotal = prev.length + newResources.length;
        setHasMore(data.resources.length > 0 && newTotal < data.total);
        return [...prev, ...newResources];
      });
      setPage(nextPage);
    } catch (error) {
      // Ignore abort errors - they're expected when cancelling requests
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      console.error("Failed to load more resources:", error);
      setHasError(true);
    } finally {
      // Only clear loading if this controller is still active
      if (abortControllerRef.current === controller) {
        setIsLoading(false);
      }
    }
  }, [isLoading, hasMore, page, filters]);

  // Intersection Observer for infinite scroll (disabled if there was an error)
  useEffect(() => {
    if (hasError) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [loadMore, hasMore, isLoading, hasError]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Show skeleton while filtering
  if (isFilterPending) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <ResourceCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <SearchX className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-1">{t("resources.noResources")}</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          {t("resources.noResourcesDescription")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Masonry columnCount={{ default: 1, md: 2, lg: 2, xl: 3 }} gap={16}>
        {resources.map((item) => (
          <ResourceCard key={item.id} resource={item} />
        ))}
      </Masonry>

      {/* Loader / End indicator / Error state */}
      <div ref={loaderRef} className="flex items-center justify-center py-4">
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("resources.loading")}
          </div>
        )}
        {!isLoading && hasError && hasMore && (
          <Button variant="outline" size="sm" onClick={loadMore}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t("resources.loadMore")}
          </Button>
        )}
        {!hasMore && resources.length > 0 && (
          <p className="text-xs text-muted-foreground">{t("resources.noMoreResources")}</p>
        )}
      </div>
    </div>
  );
}
