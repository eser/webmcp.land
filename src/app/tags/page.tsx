import Link from "next/link";
import { getLocale, getTranslations } from "@/i18n/request";
import { unstable_cache } from "next/cache";
import { Tag } from "lucide-react";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { tags, resourceTags, resources } from "@/lib/schema";

// Cached tags query
const getTags = unstable_cache(
  async () => {
    // Get tags with visible resource counts using a join
    const rows = await db
      .select({
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
        color: tags.color,
        resourceCount: count(resourceTags.resourceId),
      })
      .from(tags)
      .leftJoin(resourceTags, eq(tags.id, resourceTags.tagId))
      .leftJoin(
        resources,
        and(
          eq(resourceTags.resourceId, resources.id),
          eq(resources.isPrivate, false),
          isNull(resources.deletedAt),
        )
      )
      .groupBy(tags.id)
      .orderBy(desc(count(resourceTags.resourceId)));

    return rows;
  },
  ["tags-page"],
  { tags: ["tags"] }
);

export default async function TagsPage() {
  const t = await getTranslations("tags");

  // Fetch all tags with resource counts, ordered by popularity (cached)
  const tagsList = await getTags();

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      {tagsList.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/30">
          <Tag className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{t("noTags")}</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tagsList.map((tag) => (
            <Link
              key={tag.id}
              href={`/tags/${tag.slug}`}
              prefetch={false}
              className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors hover:border-foreground/30"
              style={{
                backgroundColor: tag.color + "10",
                borderColor: tag.color + "30",
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              <span className="text-sm font-medium group-hover:underline">
                {tag.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {tag.resourceCount}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
