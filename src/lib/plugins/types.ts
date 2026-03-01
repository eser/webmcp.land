// ============================================
// Storage Plugin Types
// ============================================

export interface UploadResult {
  url: string;
  key?: string;
  size?: number;
  mimeType?: string;
}

export interface StoragePlugin {
  id: string;
  name: string;
  /**
   * Upload a file and return the URL
   */
  upload: (file: File | Buffer, options?: UploadOptions) => Promise<UploadResult>;
  /**
   * Delete a file by key/URL
   */
  delete?: (keyOrUrl: string) => Promise<void>;
  /**
   * Check if the plugin is properly configured
   */
  isConfigured: () => boolean;
}

export interface UploadOptions {
  filename?: string;
  mimeType?: string;
  folder?: string;
}

// ============================================
// Plugin Registry
// ============================================

export interface PluginRegistry {
  storage: Map<string, StoragePlugin>;
}
