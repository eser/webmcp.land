import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react() as any],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", "dist", "packages"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        "packages/",
        "src/**/*.d.ts",
        "vitest.config.ts",
        "vitest.setup.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Map next/* imports to vinext shims so Vite can resolve them in tests
      "next/server": path.resolve(__dirname, "node_modules/vinext/dist/shims/server.js"),
      "next/cache": path.resolve(__dirname, "node_modules/vinext/dist/shims/cache.js"),
      "next/navigation": path.resolve(__dirname, "node_modules/vinext/dist/shims/navigation.js"),
      "next/headers": path.resolve(__dirname, "node_modules/vinext/dist/shims/headers.js"),
      "next/image": path.resolve(__dirname, "node_modules/vinext/dist/shims/image.js"),
      "next/link": path.resolve(__dirname, "node_modules/vinext/dist/shims/link.js"),
      "next": path.resolve(__dirname, "node_modules/vinext/dist/shims/app.js"),
      "server-only": path.resolve(__dirname, "node_modules/vinext/dist/shims/server-only.js"),
      "client-only": path.resolve(__dirname, "node_modules/vinext/dist/shims/client-only.js"),
    },
  },
});
