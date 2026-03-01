import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import vinext from "vinext";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig, type Plugin } from "vite";

/**
 * Prevents Node.js-only packages (pg, sharp, etc.) from being bundled into
 * the client JavaScript. These packages use Node APIs like Buffer that don't
 * exist in browsers. In vinext's RSC architecture, server component code can
 * leak into the client bundle via the RSC entry facade — this plugin stubs
 * those packages with empty modules in the client environment.
 */
function serverOnlyDeps(): Plugin {
  const SERVER_PACKAGES = ["pg", "sharp"];
  const STUB = "\0server-only-stub:";

  return {
    name: "server-only-deps",
    enforce: "pre",
    resolveId(id) {
      // Only stub in the client environment
      const envName =
        this.environment?.name ?? (this as any).ssr === false
          ? "client"
          : undefined;
      if (envName === "client" && SERVER_PACKAGES.includes(id)) {
        return STUB + id;
      }
    },
    load(id) {
      if (id.startsWith(STUB)) {
        return "export default {}; export const Pool = class {};";
      }
    },
    config() {
      // Also externalize from RSC and SSR environments so they resolve at
      // Node runtime instead of being bundled (prevents heavy native code
      // from inflating the server bundle).
      return {
        ssr: {
          external: SERVER_PACKAGES,
        },
      };
    },
  };
}

export default defineConfig({
  plugins: [
    serverOnlyDeps(),
    tailwindcss(),
    vinext({ appDir: resolve(import.meta.dirname, "src") }),
    sentryVitePlugin({
      org: "prompts-chat",
      project: "javascript-nextjs",
      silent: true,
    }),
  ],
  build: {
    sourcemap: true,
  },
  optimizeDeps: {
    include: ["react/jsx-runtime", "react/jsx-dev-runtime", "react-dom/client"],
  },
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "src"),
    },
  },
});
