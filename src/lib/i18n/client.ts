"use client";

import { changeLanguage } from "@/i18n/i18n";
import { LOCALE_COOKIE } from "./config";

/**
 * Set the user's locale preference (client-side)
 * Updates i18next language and persists to cookie
 */
export function setLocale(locale: string): void {
  changeLanguage(locale);
  window.location.reload();
}

/**
 * Get the current locale from cookie (client-side)
 */
export function getLocaleClient(): string | null {
  const match = document.cookie.match(new RegExp(`(^| )${LOCALE_COOKIE}=([^;]+)`));
  return match ? match[2] : null;
}
