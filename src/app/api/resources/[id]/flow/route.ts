import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { and, eq, inArray, isNull, ne } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { resources, resourceConnections, users } from "@/lib/schema";

interface FlowNode {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  endpointUrl: string;
  serverType: string;
  status: string;
  authorId: string;
  authorUsername: string;
  authorAvatar: string | null;
}

interface FlowEdge {
  source: string;
  target: string;
  label: string;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Cached function to fetch flow data (revalidates on resource-flow tag)
const getFlowData = unstable_cache(
  async (resourceId: string) => {
    // Step 1: Collect all connected resource IDs using BFS on connections only
    const allResourceIds = new Set<string>([resourceId]);
    const allEdges: Array<{ source: string; target: string; label: string; targetPrivate: boolean; targetAuthorId: string; sourcePrivate?: boolean; sourceAuthorId?: string }> = [];
    const visitedForEdges = new Set<string>();
    const queue: string[] = [resourceId];

    // Fetch all connections in batches - much faster than one-by-one
    while (queue.length > 0) {
      const currentBatch = queue.splice(0, queue.length);
      const unvisited = currentBatch.filter(rid => !visitedForEdges.has(rid));
      if (unvisited.length === 0) break;

      unvisited.forEach(rid => visitedForEdges.add(rid));

      // Batch fetch connections for all current nodes
      const [outgoing, incoming] = await Promise.all([
        db.select({
          sourceId: resourceConnections.sourceId,
          targetId: resourceConnections.targetId,
          label: resourceConnections.label,
          targetIsPrivate: resources.isPrivate,
          targetAuthorId: resources.authorId,
        })
        .from(resourceConnections)
        .innerJoin(resources, eq(resourceConnections.targetId, resources.id))
        .where(
          and(
            inArray(resourceConnections.sourceId, unvisited),
            ne(resourceConnections.label, "related"),
            isNull(resources.deletedAt),
          )
        ),
        db.select({
          sourceId: resourceConnections.sourceId,
          targetId: resourceConnections.targetId,
          label: resourceConnections.label,
          sourceIsPrivate: resources.isPrivate,
          sourceAuthorId: resources.authorId,
        })
        .from(resourceConnections)
        .innerJoin(resources, eq(resourceConnections.sourceId, resources.id))
        .where(
          and(
            inArray(resourceConnections.targetId, unvisited),
            ne(resourceConnections.label, "related"),
            isNull(resources.deletedAt),
          )
        ),
      ]);

      // Process outgoing
      for (const conn of outgoing) {
        allResourceIds.add(conn.targetId);
        allEdges.push({
          source: conn.sourceId,
          target: conn.targetId,
          label: conn.label,
          targetPrivate: conn.targetIsPrivate,
          targetAuthorId: conn.targetAuthorId,
        });
        if (!visitedForEdges.has(conn.targetId)) {
          queue.push(conn.targetId);
        }
      }

      // Process incoming
      for (const conn of incoming) {
        allResourceIds.add(conn.sourceId);
        // Only add edge if not already added
        const edgeExists = allEdges.some(
          e => e.source === conn.sourceId && e.target === conn.targetId
        );
        if (!edgeExists) {
          allEdges.push({
            source: conn.sourceId,
            target: conn.targetId,
            label: conn.label,
            sourcePrivate: conn.sourceIsPrivate,
            sourceAuthorId: conn.sourceAuthorId,
            targetPrivate: false,
            targetAuthorId: "",
          });
        }
        if (!visitedForEdges.has(conn.sourceId)) {
          queue.push(conn.sourceId);
        }
      }
    }

    // Step 2: Batch fetch all resource details in ONE query
    const resourceRows = await db.select({
      id: resources.id,
      title: resources.title,
      slug: resources.slug,
      description: resources.description,
      endpointUrl: resources.endpointUrl,
      serverType: resources.serverType,
      status: resources.status,
      isPrivate: resources.isPrivate,
      authorId: resources.authorId,
      authorUsername: users.username,
      authorAvatar: users.avatar,
    })
    .from(resources)
    .innerJoin(users, eq(resources.authorId, users.id))
    .where(
      and(
        inArray(resources.id, Array.from(allResourceIds)),
        isNull(resources.deletedAt),
      )
    );

    return { resources: resourceRows, allEdges };
  },
  ["resource-flow"],
  { tags: ["resource-flow"], revalidate: 60 } // Cache for 60 seconds, revalidate on resource-flow tag
);

/**
 * Get the full flow graph for a resource.
 * Optimized: Fetches all connections first, then batch-loads resources.
 * Cached with "resource-flow" tag - revalidate when resources/connections change.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    // Get session and resource check in parallel
    const [[resource], session] = await Promise.all([
      db.select({
        id: resources.id,
        isPrivate: resources.isPrivate,
        authorId: resources.authorId,
      }).from(resources).where(and(eq(resources.id, id), isNull(resources.deletedAt))),
      getSession(),
    ]);

    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    const userId = session?.user?.id;

    // Helper to check if user can see a resource
    const canSee = (r: { isPrivate: boolean; authorId: string }) =>
      !r.isPrivate || r.authorId === userId;

    if (!canSee(resource)) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    // Get cached flow data
    const { resources: resourceRows, allEdges } = await getFlowData(id);

    // Build nodes map - filter by visibility
    const nodes: FlowNode[] = resourceRows
      .filter(r => canSee(r))
      .map(r => ({
        id: r.id,
        title: r.title,
        slug: r.slug,
        description: r.description,
        endpointUrl: r.endpointUrl,
        serverType: r.serverType,
        status: r.status,
        authorId: r.authorId,
        authorUsername: r.authorUsername,
        authorAvatar: r.authorAvatar,
      }));

    // Filter edges to only include visible nodes
    const nodeIds = new Set(nodes.map(n => n.id));
    const edges: FlowEdge[] = allEdges
      .filter(e => nodeIds.has(e.source) && nodeIds.has(e.target))
      .map(e => ({ source: e.source, target: e.target, label: e.label }));

    return NextResponse.json({
      nodes,
      edges,
      currentResourceId: id,
    });
  } catch (error) {
    console.error("Failed to fetch flow:", error);
    return NextResponse.json(
      { error: "Failed to fetch flow" },
      { status: 500 }
    );
  }
}
