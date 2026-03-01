/**
 * Type declarations for next/* modules.
 *
 * At runtime, vinext intercepts these imports via resolve.alias and provides
 * its own shim implementations. These declarations re-export vinext's shim
 * types so TypeScript can resolve them without the `next` package installed.
 */

declare module "next" {
  export { Metadata } from "vinext/shims/metadata";

  export namespace MetadataRoute {
    type Robots = {
      rules: Array<{ userAgent?: string | string[]; allow?: string | string[]; disallow?: string | string[] }> | { userAgent?: string | string[]; allow?: string | string[]; disallow?: string | string[] };
      sitemap?: string | string[];
      host?: string;
    };
    type Sitemap = Array<{
      url: string;
      lastModified?: string | Date;
      changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
      priority?: number;
      alternates?: { languages?: Record<string, string> };
    }>;
  }
}

declare module "next/cache" {
  export * from "vinext/shims/cache";
}

declare module "next/headers" {
  export * from "vinext/shims/headers";
}

declare module "next/image" {
  export { default } from "vinext/shims/image";
  export * from "vinext/shims/image";
}

declare module "next/link" {
  export { default } from "vinext/shims/link";
  export * from "vinext/shims/link";
}

declare module "next/navigation" {
  export * from "vinext/shims/navigation";
}

declare module "next/og" {
  export * from "vinext/shims/og";
}

declare module "next/script" {
  export { default } from "vinext/shims/script";
  export * from "vinext/shims/script";
}

declare module "next/server" {
  export * from "vinext/shims/server";
}
