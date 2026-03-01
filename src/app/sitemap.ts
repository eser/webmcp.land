import { MetadataRoute } from "next";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, resources, tags } from "@/lib/schema";

// Revalidate sitemap every hour (3600 seconds)
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.BETTER_AUTH_URL || "https://webmcp.land";

  // Static pages - always included
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/discover`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tags`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  // Dynamic pages - skip if database is unavailable (e.g., during build)
  try {
    const [categoriesList, resourcesList, tagsList] = await Promise.all([
      db.select({ slug: categories.slug }).from(categories),
      db.select({ id: resources.id, slug: resources.slug, updatedAt: resources.updatedAt })
        .from(resources)
        .where(and(eq(resources.isPrivate, false), isNull(resources.deletedAt)))
        .orderBy(desc(resources.updatedAt))
        .limit(1000),
      db.select({ slug: tags.slug }).from(tags),
    ]);

    const categoryPages: MetadataRoute.Sitemap = categoriesList.map((category) => ({
      url: `${baseUrl}/categories/${category.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const resourcePages: MetadataRoute.Sitemap = resourcesList.map((resource) => ({
      url: `${baseUrl}/registry/${resource.id}_${resource.slug}`,
      lastModified: resource.updatedAt,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    const tagPages: MetadataRoute.Sitemap = tagsList.map((tag) => ({
      url: `${baseUrl}/tags/${tag.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    }));

    return [...staticPages, ...categoryPages, ...resourcePages, ...tagPages];
  } catch {
    // Database unavailable (build time) - return static pages only
    return [...staticPages];
  }
}
