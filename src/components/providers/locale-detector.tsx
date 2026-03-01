"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { LOCALE_COOKIE } from "@/lib/i18n/config";

/**
 * Client component that saves the auto-detected locale to a cookie on first visit.
 * This ensures the detected language is remembered without requiring user interaction.
 */
export function LocaleDetector() {
  const { i18n } = useTranslation();
  const locale = i18n.language;

  useEffect(() => {
    const hasLocaleCookie = document.cookie
      .split(";")
      .some((c) => c.trim().startsWith(`${LOCALE_COOKIE}=`));

    if (!hasLocaleCookie && locale) {
      document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    }
  }, [locale]);

  return null;
}
