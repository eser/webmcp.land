export interface BrandingConfig {
  name: string;
  logo: string;
  logoDark?: string;
  favicon: string;
  description: string;
  appStoreUrl?: string;
  chromeExtensionUrl?: string;
}

export interface ThemeConfig {
  // Appearance
  radius: "none" | "sm" | "md" | "lg"; // Border radius
  variant: "flat" | "default" | "brutal"; // UI style variant
  density: "compact" | "default" | "comfortable"; // Spacing density
  // Colors (CSS oklch values or hex)
  colors: {
    primary: string;
    secondary?: string;
    accent?: string;
  };
}

export type AuthProvider = "credentials" | "google" | "azure" | "github" | "apple" | string;

export interface AuthConfig {
  /** @deprecated Use `providers` array instead */
  provider?: AuthProvider;
  /** Array of auth providers to enable (e.g., ["github", "google"]) */
  providers?: AuthProvider[];
  allowRegistration: boolean;
}

export interface I18nConfig {
  locales: string[];
  defaultLocale: string;
}

export interface FeaturesConfig {
  privateResources: boolean;
  changeRequests: boolean;
  categories: boolean;
  tags: boolean;
  aiSearch?: boolean;
  discovery?: boolean;
  mcp?: boolean;
  comments?: boolean;
}

export interface Sponsor {
  name: string;
  logo: string;
  darkLogo?: string;
  url: string;
  className?: string;
}

export interface HomepageConfig {
  // Hide webmcp.land repo branding (achievements, GitHub links) and use clone's branding
  useCloneBranding?: boolean;
  achievements?: {
    enabled: boolean;
  };
  sponsors?: {
    enabled: boolean;
    items: Sponsor[];
  };
}

export interface WebMCPConfig {
  branding: BrandingConfig;
  theme: ThemeConfig;
  auth: AuthConfig;
  i18n: I18nConfig;
  features: FeaturesConfig;
  homepage?: HomepageConfig;
}

/** @deprecated Use WebMCPConfig instead */
export type PromptsConfig = WebMCPConfig;

export function defineConfig(config: WebMCPConfig): WebMCPConfig {
  return config;
}

// Load the user's config
let cachedConfig: WebMCPConfig | null = null;

/**
 * Apply runtime environment variable overrides to config.
 * This allows customization via Docker env vars without rebuilding.
 *
 * All env vars are prefixed with WMCP_ to avoid conflicts.
 *
 * Supported env vars:
 *   WMCP_NAME, WMCP_DESCRIPTION, WMCP_LOGO, WMCP_LOGO_DARK, WMCP_FAVICON, WMCP_COLOR
 *   WMCP_THEME_RADIUS (none|sm|md|lg), WMCP_THEME_VARIANT (default|flat|brutal), WMCP_THEME_DENSITY
 *   WMCP_AUTH_PROVIDERS (comma-separated), WMCP_ALLOW_REGISTRATION (true|false)
 *   WMCP_LOCALES (comma-separated), WMCP_DEFAULT_LOCALE
 *   WMCP_FEATURE_* (true|false for each feature)
 */
function applyEnvOverrides(config: WebMCPConfig): WebMCPConfig {
  const env = process.env;

  // Helper functions
  const envBool = (key: string, fallback: boolean): boolean => {
    const val = env[key];
    if (val === undefined) return fallback;
    return val.toLowerCase() === 'true' || val === '1';
  };

  const envArray = (key: string, fallback: string[]): string[] => {
    const val = env[key];
    if (!val) return fallback;
    return val.split(',').map(s => s.trim()).filter(Boolean);
  };

  return {
    branding: {
      name: env.WMCP_NAME || config.branding.name,
      description: env.WMCP_DESCRIPTION || config.branding.description,
      logo: env.WMCP_LOGO || config.branding.logo,
      logoDark: env.WMCP_LOGO_DARK || env.WMCP_LOGO || config.branding.logoDark,
      favicon: env.WMCP_FAVICON || config.branding.favicon,
      appStoreUrl: config.branding.appStoreUrl,
      chromeExtensionUrl: config.branding.chromeExtensionUrl,
    },
    theme: {
      radius: (env.WMCP_THEME_RADIUS as ThemeConfig['radius']) || config.theme.radius,
      variant: (env.WMCP_THEME_VARIANT as ThemeConfig['variant']) || config.theme.variant,
      density: (env.WMCP_THEME_DENSITY as ThemeConfig['density']) || config.theme.density,
      colors: {
        primary: env.WMCP_COLOR || config.theme.colors.primary,
        secondary: config.theme.colors.secondary,
        accent: config.theme.colors.accent,
      },
    },
    auth: {
      providers: env.WMCP_AUTH_PROVIDERS
        ? envArray('WMCP_AUTH_PROVIDERS', config.auth.providers || ['credentials'])
        : config.auth.providers,
      allowRegistration: env.WMCP_ALLOW_REGISTRATION !== undefined
        ? envBool('WMCP_ALLOW_REGISTRATION', config.auth.allowRegistration)
        : config.auth.allowRegistration,
    },
    i18n: {
      locales: env.WMCP_LOCALES
        ? envArray('WMCP_LOCALES', config.i18n.locales)
        : config.i18n.locales,
      defaultLocale: env.WMCP_DEFAULT_LOCALE || config.i18n.defaultLocale,
    },
    features: {
      privateResources: envBool('WMCP_FEATURE_PRIVATE_RESOURCES', config.features.privateResources),
      changeRequests: envBool('WMCP_FEATURE_CHANGE_REQUESTS', config.features.changeRequests),
      categories: envBool('WMCP_FEATURE_CATEGORIES', config.features.categories),
      tags: envBool('WMCP_FEATURE_TAGS', config.features.tags),
      aiSearch: envBool('WMCP_FEATURE_AI_SEARCH', config.features.aiSearch ?? false),
      discovery: envBool('WMCP_FEATURE_DISCOVERY', config.features.discovery ?? false),
      mcp: envBool('WMCP_FEATURE_MCP', config.features.mcp ?? false),
      comments: envBool('WMCP_FEATURE_COMMENTS', config.features.comments ?? true),
    },
    homepage: env.WMCP_NAME ? {
      // If custom branding via env, use clone branding mode
      useCloneBranding: true,
      achievements: { enabled: false },
      sponsors: { enabled: false, items: [] },
    } : config.homepage,
  };
}

export async function getConfig(): Promise<WebMCPConfig> {
  if (cachedConfig) return cachedConfig;

  let baseConfig: WebMCPConfig;

  try {
    // Dynamic import of user config
    const userConfig = await import("@/../webmcp.config");
    baseConfig = userConfig.default;
  } catch {
    // Fallback to default config
    baseConfig = {
      branding: {
        name: "webmcp.land",
        logo: "/logo.svg",
        logoDark: "/logo-dark.svg",
        favicon: "/favicon.ico",
        description: "Discover and connect MCP services for any task",
      },
      theme: {
        radius: "sm",
        variant: "flat",
        density: "compact",
        colors: {
          primary: "#6366f1",
        },
      },
      auth: {
        providers: ["credentials"],
        allowRegistration: true,
      },
      i18n: {
        locales: ["en"],
        defaultLocale: "en",
      },
      features: {
        privateResources: true,
        changeRequests: true,
        categories: true,
        tags: true,
        aiSearch: false,
        discovery: false,
        comments: true,
      },
    };
  }

  // Apply runtime environment variable overrides
  cachedConfig = applyEnvOverrides(baseConfig);
  return cachedConfig;
}

// Sync version for client components (must be initialized first)
export function getConfigSync(): WebMCPConfig {
  if (!cachedConfig) {
    throw new Error("Config not initialized. Call getConfig() first in a server component.");
  }
  return cachedConfig;
}
