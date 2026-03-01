/**
 * Generates a URL path for a resource, including the slug if available
 * Format: /registry/{id} or /registry/{id}_{slug}
 */
export function getResourceUrl(id: string, slug?: string | null): string {
  if (slug) {
    return `/registry/${id}_${slug}`;
  }
  return `/registry/${id}`;
}

/**
 * Generates edit URL for a resource
 */
export function getResourceEditUrl(id: string, slug?: string | null): string {
  return `${getResourceUrl(id, slug)}/edit`;
}

/**
 * Generates changes URL for a resource
 */
export function getResourceChangesUrl(id: string, slug?: string | null): string {
  return `${getResourceUrl(id, slug)}/changes/new`;
}
