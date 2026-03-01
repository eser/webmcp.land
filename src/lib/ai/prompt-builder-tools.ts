import { and, eq, isNull, ilike, or, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { resources, resourceTags, tags } from "@/lib/schema";
import { semanticSearch, isAISearchEnabled } from "@/lib/ai/embeddings";

export interface ResourceBuilderState {
  title: string;
  description: string;
  endpointUrl: string;
  serverType: "MCP" | "WEBMCP";
  categoryId?: string;
  tagIds: string[];
  isPrivate: boolean;
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export const RESOURCE_BUILDER_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "search_resources",
      description: "Search for existing resources to use as examples or inspiration. Returns resources matching the query with their title, description, endpoint URL preview, and tags. Use serverType filter when looking for specific resource types.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query to find relevant resources"
          },
          limit: {
            type: "number",
            description: "Maximum number of resources to return (default 5, max 10)"
          },
          serverType: {
            type: "string",
            enum: ["MCP", "WEBMCP"],
            description: "Filter by resource server type."
          },
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "set_title",
      description: "Set the resource title. The title should be concise and descriptive.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "The title for the resource (max 200 characters)"
          }
        },
        required: ["title"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "set_description",
      description: "Set the resource description. Should briefly explain what the resource does.",
      parameters: {
        type: "object",
        properties: {
          description: {
            type: "string",
            description: "The description for the resource (max 500 characters)"
          }
        },
        required: ["description"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "set_endpoint_url",
      description: "Set the MCP/WebMCP endpoint URL for the resource.",
      parameters: {
        type: "object",
        properties: {
          endpointUrl: {
            type: "string",
            description: "The endpoint URL for the resource"
          }
        },
        required: ["endpointUrl"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "set_server_type",
      description: "Set the resource server type (MCP or WEBMCP).",
      parameters: {
        type: "object",
        properties: {
          serverType: {
            type: "string",
            enum: ["MCP", "WEBMCP"],
            description: "The type of resource server"
          },
        },
        required: ["serverType"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "set_tags",
      description: "Set the tags for the resource. Tags help users discover the resource.",
      parameters: {
        type: "object",
        properties: {
          tagNames: {
            type: "array",
            items: { type: "string" },
            description: "Array of tag names to apply to the resource"
          }
        },
        required: ["tagNames"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "set_category",
      description: "Set the category for the resource to organize it.",
      parameters: {
        type: "object",
        properties: {
          categoryName: {
            type: "string",
            description: "The name of the category"
          }
        },
        required: ["categoryName"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "set_privacy",
      description: "Set whether the resource is private (only visible to the author) or public.",
      parameters: {
        type: "object",
        properties: {
          isPrivate: {
            type: "boolean",
            description: "True for private, false for public"
          }
        },
        required: ["isPrivate"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_available_tags",
      description: "Get all available tags that can be applied to resources.",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_available_categories",
      description: "Get all available categories for organizing resources.",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_current_state",
      description: "Get the current state of the resource being built.",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  }
];

export async function executeToolCall(
  toolName: string,
  args: Record<string, unknown>,
  currentState: ResourceBuilderState,
  availableTags: Array<{ id: string; name: string; slug: string; color: string }>,
  availableCategories: Array<{ id: string; name: string; slug: string; parentId: string | null }>
): Promise<{ result: ToolResult; newState: ResourceBuilderState }> {
  const newState = { ...currentState };

  switch (toolName) {
    case "search_resources": {
      const query = args.query as string;
      const limit = Math.min(Math.max((args.limit as number) || 5, 1), 10);
      const serverType = args.serverType as string | undefined;

      try {
        // Run both full-text and semantic search in parallel
        const useSemanticSearch = await isAISearchEnabled();

        // Full-text search
        const textSearchPromise = db.query.resources.findMany({
          where: and(
            eq(resources.isPrivate, false),
            isNull(resources.deletedAt),
            ...(serverType ? [eq(resources.serverType, serverType as "MCP" | "WEBMCP")] : []),
            or(
              ilike(resources.title, `%${query}%`),
              ilike(resources.description, `%${query}%`),
              ilike(resources.endpointUrl, `%${query}%`),
            ),
          ),
          columns: {
            id: true,
            title: true,
            description: true,
            endpointUrl: true,
            serverType: true,
          },
          with: {
            tags: {
              columns: {},
              with: {
                tag: {
                  columns: { name: true, color: true },
                },
              },
            },
          },
          limit,
          orderBy: desc(resources.createdAt),
        });

        // Semantic search (if enabled)
        const semanticSearchPromise = useSemanticSearch
          ? semanticSearch(query, limit)
          : Promise.resolve([]);

        const [textResults, semanticResults] = await Promise.all([
          textSearchPromise,
          semanticSearchPromise
        ]);

        // Combine and deduplicate results
        const seenIds = new Set<string>();
        const combinedResults: Array<{
          id: string;
          title: string;
          description: string | null;
          endpointUrlPreview: string;
          serverType: string;
          tags: string[];
          source: "text" | "semantic" | "random";
          similarity?: string;
        }> = [];

        // Add semantic results first (higher relevance)
        for (const r of semanticResults) {
          if (seenIds.has(r.id)) continue;
          if (serverType && r.serverType !== serverType) continue;

          seenIds.add(r.id);
          combinedResults.push({
            id: r.id,
            title: r.title,
            description: r.description,
            endpointUrlPreview: r.endpointUrl.substring(0, 200) + (r.endpointUrl.length > 200 ? "..." : ""),
            serverType: r.serverType,
            tags: r.tags.map(t => t.tag.name),
            source: "semantic",
            similarity: Math.round(r.similarity * 100) + "%"
          });
        }

        // Add text search results
        for (const r of textResults) {
          if (seenIds.has(r.id)) continue;

          seenIds.add(r.id);
          combinedResults.push({
            id: r.id,
            title: r.title,
            description: r.description,
            endpointUrlPreview: r.endpointUrl.substring(0, 200) + (r.endpointUrl.length > 200 ? "..." : ""),
            serverType: r.serverType,
            tags: r.tags.map((t: { tag: { name: string } }) => t.tag.name),
            source: "text"
          });
        }

        // Limit final results
        let finalResults = combinedResults.slice(0, limit);

        // If no results found, get random resources to learn the style
        if (finalResults.length === 0) {
          const randomResources = await db.query.resources.findMany({
            where: and(
              eq(resources.isPrivate, false),
              isNull(resources.deletedAt),
            ),
            columns: {
              id: true,
              title: true,
              description: true,
              endpointUrl: true,
              serverType: true,
            },
            with: {
              tags: {
                columns: {},
                with: {
                  tag: {
                    columns: { name: true, color: true },
                  },
                },
              },
            },
            limit,
            orderBy: desc(resources.createdAt),
          });

          finalResults = randomResources.map(r => ({
            id: r.id,
            title: r.title,
            description: r.description,
            endpointUrlPreview: r.endpointUrl.substring(0, 200) + (r.endpointUrl.length > 200 ? "..." : ""),
            serverType: r.serverType,
            tags: r.tags.map((t: { tag: { name: string } }) => t.tag.name),
            source: "random" as const
          }));
        }

        return {
          result: {
            success: true,
            data: {
              resources: finalResults,
              count: finalResults.length,
              searchType: finalResults.length > 0 && finalResults[0].source === "random"
                ? "random_examples"
                : (useSemanticSearch ? "hybrid" : "text"),
              filters: { serverType },
              note: finalResults.length > 0 && finalResults[0].source === "random"
                ? "No matching resources found. Showing random examples to understand the resource style."
                : undefined
            }
          },
          newState
        };
      } catch (error) {
        return {
          result: { success: false, error: "Failed to search resources" },
          newState
        };
      }
    }

    case "set_title": {
      const title = (args.title as string).substring(0, 200);
      newState.title = title;
      return {
        result: { success: true, data: { title } },
        newState
      };
    }

    case "set_description": {
      const description = (args.description as string).substring(0, 500);
      newState.description = description;
      return {
        result: { success: true, data: { description } },
        newState
      };
    }

    case "set_endpoint_url": {
      newState.endpointUrl = args.endpointUrl as string;
      return {
        result: { success: true, data: { endpointUrl: newState.endpointUrl } },
        newState
      };
    }

    case "set_server_type": {
      const serverType = args.serverType as ResourceBuilderState["serverType"];
      newState.serverType = serverType;
      return {
        result: { success: true, data: { serverType } },
        newState
      };
    }

    case "set_tags": {
      const tagNames = args.tagNames as string[];
      const matchedTagIds: string[] = [];
      const matchedNames: string[] = [];

      for (const name of tagNames) {
        const tag = availableTags.find(
          t => t.name.toLowerCase() === name.toLowerCase() || t.slug === name.toLowerCase()
        );
        if (tag) {
          matchedTagIds.push(tag.id);
          matchedNames.push(tag.name);
        }
      }

      newState.tagIds = matchedTagIds;
      return {
        result: {
          success: true,
          data: {
            appliedTags: matchedNames,
            notFound: tagNames.filter(n => !matchedNames.map(m => m.toLowerCase()).includes(n.toLowerCase()))
          }
        },
        newState
      };
    }

    case "set_category": {
      const categoryName = args.categoryName as string;
      const category = availableCategories.find(
        c => c.name.toLowerCase() === categoryName.toLowerCase() || c.slug === categoryName.toLowerCase()
      );

      if (category) {
        newState.categoryId = category.id;
        return {
          result: { success: true, data: { category: category.name } },
          newState
        };
      }
      return {
        result: { success: false, error: `Category "${categoryName}" not found` },
        newState
      };
    }

    case "set_privacy": {
      newState.isPrivate = args.isPrivate as boolean;
      return {
        result: { success: true, data: { isPrivate: newState.isPrivate } },
        newState
      };
    }

    case "get_available_tags": {
      return {
        result: {
          success: true,
          data: { tags: availableTags.map(t => ({ name: t.name, color: t.color })) }
        },
        newState
      };
    }

    case "get_available_categories": {
      return {
        result: {
          success: true,
          data: {
            categories: availableCategories.map(c => ({
              name: c.name,
              isSubcategory: !!c.parentId
            }))
          }
        },
        newState
      };
    }

    case "get_current_state": {
      const tagNames = currentState.tagIds
        .map(id => availableTags.find(t => t.id === id)?.name)
        .filter(Boolean);
      const categoryName = availableCategories.find(c => c.id === currentState.categoryId)?.name;

      return {
        result: {
          success: true,
          data: {
            title: currentState.title || "(not set)",
            description: currentState.description || "(not set)",
            endpointUrl: currentState.endpointUrl || "(not set)",
            serverType: currentState.serverType,
            tags: tagNames.length ? tagNames : "(none)",
            category: categoryName || "(none)",
            isPrivate: currentState.isPrivate,
          }
        },
        newState
      };
    }

    default:
      return {
        result: { success: false, error: `Unknown tool: ${toolName}` },
        newState
      };
  }
}
