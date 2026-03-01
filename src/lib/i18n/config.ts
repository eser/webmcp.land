// Cookie name for storing locale preference
export const LOCALE_COOKIE = "NEXT_LOCALE";

// Default timezone for consistent server/client rendering
export const defaultTimeZone = "UTC";

// Supported locales - keep in sync with webmcp.config.ts
export const supportedLocales = ["en", "tr", "es", "zh", "ja", "ar", "pt", "fr", "it", "de", "nl", "ko", "ru", "he", "el", "fa", "az"];
export const defaultLocale = "en";

// RTL locales
export const rtlLocales = ["ar", "he", "fa"];

// Check if a locale is RTL
export function isRtlLocale(locale: string): boolean {
  return rtlLocales.includes(locale);
}

// Get supported locales
export function getSupportedLocales() {
  return supportedLocales;
}

// Get default locale
export function getDefaultLocale() {
  return defaultLocale;
}
