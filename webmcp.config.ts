import { defineConfig } from "@/lib/config";

// Set to true to use clone branding (hide webmcp.land repo branding)
const useCloneBranding = false;

export default defineConfig({
  // Branding - customize for white-label
  branding: {
    name: "webmcp.land",
    logo: "/logo.svg",
    logoDark: "/logo-dark.svg",
    favicon: "/logo.svg",
    description: "Discover and connect MCP services for any task",

    // Delete this if useCloneBranding is true
    appStoreUrl: "https://apps.apple.com/tr/app/webmcp-land/id6756895736",
    chromeExtensionUrl: "https://chromewebstore.google.com/detail/webmcpland/eemdohkhbaifiocagjlhibfbhamlbeej",
  },

  // Theme - design system configuration
  theme: {
    // Border radius: "none" | "sm" | "md" | "lg"
    radius: "sm",
    // UI style: "flat" | "default" | "brutal"
    variant: "default",
    // Spacing density: "compact" | "default" | "comfortable"
    density: "default",
    // Colors (hex or oklch)
    colors: {
      primary: "#6366f1", // Indigo
    },
  },

  // Authentication plugins
  auth: {
    // Available: "credentials" | "google" | "azure" | "github" | "apple" | custom
    // Use `providers` array to enable multiple auth providers
    providers: ["github", "google", "apple"],
    // Allow public registration (only applies to credentials provider)
    allowRegistration: false,
  },

  // Internationalization
  i18n: {
    locales: ["en", "tr", "es", "zh", "ja", "ar", "pt", "fr", "it", "de", "nl", "ko", "ru", "he", "el", "az", "fa"],
    defaultLocale: "en",
  },

  // Features
  features: {
    // Allow users to create private resources
    privateResources: true,
    // Enable change request system for versioning
    changeRequests: true,
    // Enable categories
    categories: true,
    // Enable tags
    tags: true,
    // Enable AI-powered semantic search (requires OPENAI_API_KEY)
    aiSearch: true,
    // Enable MCP endpoint discovery features
    discovery: true,
    // Enable MCP (Model Context Protocol) features including API key generation
    mcp: true,
    // Enable comments on resources
    comments: true,
  },

  // Homepage customization
  homepage: {
    // Set to true to hide webmcp.land repo branding and use your own branding
    useCloneBranding,
    achievements: {
      enabled: !useCloneBranding,
    },
    sponsors: {
      enabled: !useCloneBranding,
      items: [
        // Add sponsors here
      ],
    },
  },
});
