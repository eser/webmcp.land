"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Languages, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { analyticsTranslate } from "@/lib/analytics";

// Map locale codes to full language names for OpenAI
const localeToLanguage: Record<string, string> = {
  en: "English",
  tr: "Turkish",
  es: "Spanish",
  zh: "Chinese",
  ja: "Japanese",
  ar: "Arabic",
  pt: "Portuguese",
  fr: "French",
  de: "German",
  ko: "Korean",
  it: "Italian",
  ru: "Russian",
  he: "Hebrew",
  el: "Greek",
};

interface TranslateButtonProps {
  content: string;
  onTranslate: (translatedContent: string) => void;
  isLoggedIn: boolean;
}

export function TranslateButton({ content, onTranslate, isLoggedIn }: TranslateButtonProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const [isTranslating, setIsTranslating] = useState(false);
  const [isTranslated, setIsTranslated] = useState(false);

  // Don't show for English locale since most resources are in English
  if (locale === "en") {
    return null;
  }

  // Don't show for non-logged-in users
  if (!isLoggedIn) {
    return null;
  }

  const handleTranslate = async () => {
    if (isTranslating || isTranslated) return;

    setIsTranslating(true);
    try {
      const targetLanguage = localeToLanguage[locale] || locale;
      const response = await fetch("/api/resources/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          targetLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error("Translation failed");
      }

      const data = await response.json();
      onTranslate(data.translatedContent);
      setIsTranslated(true);
      analyticsTranslate.translate(targetLanguage);
      toast.success(t("resources.translated"));
    } catch (error) {
      console.error("Translation error:", error);
      toast.error(t("resources.translationFailed"));
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger render={<button
          onClick={handleTranslate}
          disabled={isTranslating || isTranslated}
          className={`inline-flex items-center justify-center rounded-sm p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none ${
            isTranslated 
              ? "text-green-500 opacity-50" 
              : "text-primary/60 hover:text-primary hover:bg-primary/10"
          }`}
          title={isTranslated ? t("resources.alreadyTranslated") : t("resources.translateToLanguage")}
         />}>
          {isTranslating ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Languages className="h-3 w-3" />
          )}
      </TooltipTrigger>
      <TooltipContent>
        {isTranslated ? t("resources.alreadyTranslated") : t("resources.translateToLanguage")}
      </TooltipContent>
    </Tooltip>
  );
}
