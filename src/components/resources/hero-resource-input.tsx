"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Bot, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { analyticsHero } from "@/lib/analytics";

const TYPING_SPEED = 50; // ms per character
const PAUSE_BETWEEN_RESOURCES = 2000; // ms to pause after completing a resource
const DELETE_SPEED = 30; // ms per character when deleting

export function HeroResourceInput() {
  const { t } = useTranslation();
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const exampleResources = useMemo(() => [
    t("heroResourceInput.examples.codeReview"),
    t("heroResourceInput.examples.emailWriter"),
    t("heroResourceInput.examples.studyPlanner"),
    t("heroResourceInput.examples.recipeGenerator"),
    t("heroResourceInput.examples.interviewCoach"),
  ], [t]);
  
  const [displayText, setDisplayText] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isAnimating, setIsAnimating] = useState(true);
  const [currentResourceIndex, setCurrentResourceIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  const clearAnimation = useCallback(() => {
    if (animationRef.current) {
      clearTimeout(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  // Typing animation effect
  useEffect(() => {
    if (!isAnimating || isFocused) {
      clearAnimation();
      return;
    }

    const currentResource = exampleResources[currentResourceIndex];

    if (isDeleting) {
      if (displayText.length > 0) {
        animationRef.current = setTimeout(() => {
          setDisplayText((prev) => prev.slice(0, -1));
        }, DELETE_SPEED);
      } else {
        // Schedule state updates to avoid synchronous setState in effect
        animationRef.current = setTimeout(() => {
          setIsDeleting(false);
          setCurrentResourceIndex((prev) => (prev + 1) % exampleResources.length);
        }, 0);
      }
    } else {
      if (displayText.length < currentResource.length) {
        animationRef.current = setTimeout(() => {
          setDisplayText(currentResource.slice(0, displayText.length + 1));
        }, TYPING_SPEED);
      } else {
        // Finished typing, wait then start deleting
        animationRef.current = setTimeout(() => {
          setIsDeleting(true);
        }, PAUSE_BETWEEN_RESOURCES);
      }
    }

    return clearAnimation;
  }, [displayText, isAnimating, isFocused, currentResourceIndex, isDeleting, clearAnimation, exampleResources]);

  const handleFocus = () => {
    setIsFocused(true);
    setIsAnimating(false);
    clearAnimation();
    analyticsHero.focusInput();
    // Transfer the animated text to the actual input value
    setInputValue(displayText);
    setDisplayText("heroResourceInput.");
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Only restart animation if input is empty
    if (!inputValue.trim()) {
      setIsAnimating(true);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const value = inputValue.trim();
    if (value) {
      analyticsHero.submitResourceIdea(value);
      router.push(`/registry/new?resource=${encodeURIComponent(value)}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleAnimatedTextClick = () => {
    // Stop animation, clear input, and focus for user to type
    setIsFocused(true);
    setIsAnimating(false);
    clearAnimation();
    setInputValue("");
    setDisplayText("heroResourceInput.");
    analyticsHero.clickAnimatedResource();
    // Focus the textarea
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg">
      <div
        className={cn(
          "rounded-xl bg-muted/50 border px-4 py-3 backdrop-blur-sm transition-all duration-200 shadow-sm",
          isFocused && "border-foreground/30 ring-1 ring-ring"
        )}
      >
        {/* Textarea area with animated text overlay */}
        <div className="relative min-h-[44px]">
          {/* Animated placeholder text - clickable to redirect */}
          {!isFocused && isAnimating && (
            <button
              type="button"
              onClick={handleAnimatedTextClick}
              className="absolute inset-0 flex items-start text-start cursor-pointer hover:opacity-80 transition-opacity"
            >
              <span className="text-base text-muted-foreground">
                {displayText}
                <span className="inline-block w-0.5 h-5 bg-primary ms-0.5 animate-pulse align-middle" />
              </span>
            </button>
          )}
          
          {/* Actual textarea */}
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={isFocused ? t("heroResourceInput.placeholder") : ""}
            className={cn(
              "min-h-[44px] max-h-[100px] w-full resize-none text-base bg-transparent border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none placeholder:text-muted-foreground",
              !isFocused && isAnimating && "text-transparent caret-transparent pointer-events-none"
            )}
            aria-label={t("heroResourceInput.ariaLabel")}
          />
        </div>

        {/* Bottom row: Bot icon + model name + submit button */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Bot className="h-3 w-3" />
            <span>{t("heroResourceInput.modelName")}</span>
          </div>
          <Button
            type="submit"
            size="icon"
            disabled={!inputValue.trim()}
            className="h-7 w-7 rounded-full"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground mt-3 text-center">
        {t("heroResourceInput.hint")}
      </p>
    </form>
  );
}
