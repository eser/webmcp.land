"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ICU from "i18next-icu";
import resourcesToBackend from "i18next-resources-to-backend";

import { defaultLocale, supportedLocales, LOCALE_COOKIE } from "@/lib/i18n/config";

const loadResources = resourcesToBackend(
  (language: string) => import(`@/../messages/${language}.json`),
);

i18n
  .use(ICU)
  .use(loadResources)
  .use(initReactI18next)
  .init({
    fallbackLng: defaultLocale,
    supportedLngs: [...supportedLocales],
    debug: false,
    lng: defaultLocale,

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: true,
    },
  });

export default i18n;

export async function changeLanguage(locale: string): Promise<void> {
  if (supportedLocales.includes(locale)) {
    await i18n.changeLanguage(locale);
    if (typeof document !== "undefined") {
      document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
    }
  }
}

export function getCurrentLanguage(): string {
  return i18n.language ?? defaultLocale;
}
