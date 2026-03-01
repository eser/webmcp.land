import type { StoragePlugin, PluginRegistry } from "./types";

// Global plugin registry
const registry: PluginRegistry = {
  storage: new Map(),
};

// ============================================
// Storage Plugin Registration
// ============================================

export function registerStoragePlugin(plugin: StoragePlugin): void {
  registry.storage.set(plugin.id, plugin);
}

export function getStoragePlugin(id: string): StoragePlugin | undefined {
  return registry.storage.get(id);
}

export function getAllStoragePlugins(): StoragePlugin[] {
  return Array.from(registry.storage.values());
}

// ============================================
// Registry Access
// ============================================

export function getRegistry(): PluginRegistry {
  return registry;
}
