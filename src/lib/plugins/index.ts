import { registerBuiltInStoragePlugins } from "./storage";

// Export all types
export * from "./types";
export * from "./registry";

// Initialize all built-in plugins
let initialized = false;

export function initializePlugins(): void {
  if (initialized) return;

  registerBuiltInStoragePlugins();

  initialized = true;
}
