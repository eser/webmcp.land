import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, supportedLocales, defaultLocale } from "@/lib/i18n/config";

/**
 * Parse Accept-Language header and find the best matching supported locale
 */
function detectLocaleFromHeader(acceptLanguage: string | null): string | null {
  if (!acceptLanguage) return null;

  const languages = acceptLanguage
    .split(",")
    .map((part) => {
      const [lang, qPart] = part.trim().split(";");
      const q = qPart ? parseFloat(qPart.split("=")[1]) : 1;
      return { lang: lang.trim().toLowerCase(), q };
    })
    .sort((a, b) => b.q - a.q);

  for (const { lang } of languages) {
    const baseLocale = lang.split("-")[0];
    if (supportedLocales.includes(baseLocale)) {
      return baseLocale;
    }
    if (supportedLocales.includes(lang)) {
      return lang;
    }
  }

  return null;
}

/**
 * Detect the current locale from cookie or Accept-Language header (server-side)
 */
export async function getLocale(): Promise<string> {
  const cookieStore = await cookies();
  const headerStore = await headers();

  let locale = cookieStore.get(LOCALE_COOKIE)?.value;

  if (!locale || !supportedLocales.includes(locale)) {
    const acceptLanguage = headerStore.get("accept-language");
    const detected = detectLocaleFromHeader(acceptLanguage);
    locale = detected ?? defaultLocale;
  }

  return locale;
}

/**
 * Load messages for a given locale (server-side)
 */
export async function getMessages(locale?: string): Promise<Record<string, any>> {
  const lang = locale ?? await getLocale();
  try {
    return (await import(`@/../messages/${lang}.json`)).default;
  } catch {
    return (await import(`@/../messages/${defaultLocale}.json`)).default;
  }
}

/**
 * Create a scoped translation function for server components.
 * Equivalent to next-intl's getTranslations("namespace").
 */
export async function getTranslations(namespace: string): Promise<(key: string, params?: Record<string, any>) => string> {
  const messages = await getMessages();
  return (key: string, params?: Record<string, any>) => {
    const fullKey = `${namespace}.${key}`;
    const parts = fullKey.split(".");
    let val: any = messages;
    for (const p of parts) {
      val = val?.[p];
    }
    if (typeof val !== "string") return fullKey;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        val = val.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      }
    }
    return val;
  };
}
