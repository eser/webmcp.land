"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { Loader2, LogIn } from "lucide-react";

// Triangle up icon component
function TriangleUp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 4L3 18h18L12 4z" />
    </svg>
  );
}
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { analyticsResource } from "@/lib/analytics";

interface UpvoteButtonProps {
  resourceId: string;
  initialVoted: boolean;
  initialCount: number;
  isLoggedIn: boolean;
  size?: "sm" | "default" | "circular";
  showLabel?: boolean;
}

export function UpvoteButton({
  resourceId,
  initialVoted,
  initialCount,
  isLoggedIn,
  size = "default",
  showLabel = false
}: UpvoteButtonProps) {
  const { t } = useTranslation();
  const [isVoted, setIsVoted] = useState(initialVoted);
  const [voteCount, setVoteCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleVote = async () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    setIsLoading(true);

    try {
      const method = isVoted ? "DELETE" : "POST";
      const response = await fetch(`/api/resources/${resourceId}/vote`, {
        method,
      });

      if (!response.ok) {
        throw new Error("Failed to vote");
      }

      const data = await response.json();
      setIsVoted(data.voted);
      setVoteCount(data.voteCount);

      if (data.voted) {
        analyticsResource.upvote(resourceId);
      } else {
        analyticsResource.removeUpvote(resourceId);
      }
    } catch {
      toast.error(t("common.error"));
    } finally {
      setIsLoading(false);
    }
  };

  const loginModal = (
    <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("vote.loginRequired")}</DialogTitle>
          <DialogDescription>
            {t("vote.loginToVote")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => setShowLoginModal(false)}>
            {t("common.cancel")}
          </Button>
          <Button render={<Link href="/login" />}>
              <LogIn className="h-4 w-4 mr-2" />
              {t("vote.goToLogin")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (size === "circular") {
    return (
      <>
        <button
          onClick={handleVote}
          disabled={isLoading}
          className={cn(
            "flex flex-col items-center justify-center w-14 h-14 rounded-full border-2 transition-all",
            isVoted
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-muted-foreground border-border hover:border-primary hover:text-primary"
          )}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <TriangleUp className={cn("h-6 w-6", isVoted && "fill-current")} />
              <span className="text-xs font-medium -mt-1">{voteCount}</span>
            </>
          )}
        </button>
        {loginModal}
      </>
    );
  }

  if (size === "sm") {
    return (
      <>
        <button
          onClick={handleVote}
          disabled={isLoading}
          className={cn(
            "flex items-center gap-0.5 text-xs transition-colors",
            isVoted ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <TriangleUp className={cn("h-4 w-4", isVoted && "fill-current")} />
          )}
          <span>{voteCount}</span>
        </button>
        {loginModal}
      </>
    );
  }

  return (
    <>
      <Button
        variant={isVoted ? "default" : "outline"}
        size="sm"
        onClick={handleVote}
        disabled={isLoading}
        className="gap-1.5"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <TriangleUp className={cn("h-4 w-4", isVoted && "fill-current")} />
        )}
        <span>{voteCount}{showLabel && ` ${voteCount === 1 ? t("vote.upvote") : t("vote.upvotes")}`}</span>
      </Button>
      {loginModal}
    </>
  );
}
