import { resolve } from "node:path";
import vinext from "vinext";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
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
