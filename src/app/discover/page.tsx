import { and, count, desc, eq, isNull } from "drizzle-orm";
import { DiscoveryResources } from "@/components/resources/discovery-resources";
import { StructuredData } from "@/components/seo/structured-data";
import { db } from "@/lib/db";
import { resources, resourceVotes } from "@/lib/schema";

export default async function DiscoverPage() {
  // Fetch top resources for structured data (ordered by vote count)
  const topResources = await db
    .select({
      id: resources.id,
      title: resources.title,
      description: resources.description,
      slug: resources.slug,
      voteCount: count(resourceVotes.resourceId),
    })
    .from(resources)
    .leftJoin(resourceVotes, eq(resources.id, resourceVotes.resourceId))
    .where(
      and(
        eq(resources.isPrivate, false),
        isNull(resources.deletedAt),
      )
    )
    .groupBy(resources.id)
    .orderBy(desc(count(resourceVotes.resourceId)))
    .limit(10);

  const itemListData = topResources.map((resource) => ({
    name: resource.title,
    url: `/registry/${resource.id}${resource.slug ? `_${resource.slug}` : ""}`,
    description: resource.description || undefined,
  }));

  return (
    <>
      <StructuredData
        type="itemList"
        data={{ items: itemListData }}
      />
      <StructuredData
        type="breadcrumb"
        data={{
          breadcrumbs: [
            { name: "Home", url: "/" },
            { name: "Discover", url: "/discover" },
          ],
        }}
      />
      <div className="flex flex-col">
        <DiscoveryResources />
      </div>
    </>
  );
}
