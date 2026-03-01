import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { eq, and, or, desc, ilike, isNull, count, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, resources, categories, tags, resourceTags, resourceVotes } from "@/lib/schema";
import { isValidApiKeyFormat } from "@/lib/api-key";

interface AuthenticatedUser {
  id: string;
  username: string;
  resourcesPublicByDefault: boolean;
}

async function authenticateApiKey(apiKey: string | null): Promise<AuthenticatedUser | null> {
  if (!apiKey || !isValidApiKeyFormat(apiKey)) {
    return null;
  }

  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
      resourcesPublicByDefault: users.resourcesPublicByDefault,
    })
    .from(users)
    .where(eq(users.apiKey, apiKey));

  return user ?? null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function findOrCreateTags(tagNames: string[]): Promise<string[]> {
  const tagIds: string[] = [];
  for (const tagName of tagNames) {
    const tagSlug = slugify(tagName);
    if (!tagSlug) continue;
    let [existingTag] = await db.select().from(tags).where(eq(tags.slug, tagSlug));
    if (!existingTag) {
      [existingTag] = await db.insert(tags).values({ name: tagName, slug: tagSlug }).returning();
    }
    tagIds.push(existingTag.id);
  }
  return tagIds;
}

/**
 * Get the resource name/slug for MCP.
 * Priority: slug > slugify(title) > id
 */
function getResourceName(resource: { id: string; slug?: string | null; title: string }): string {
  if (resource.slug) return resource.slug;
  const titleSlug = slugify(resource.title);
  if (titleSlug) return titleSlug;
  return resource.id;
}

interface ServerOptions {
  categories?: string[];
  tags?: string[];
  users?: string[];
  authenticatedUser?: AuthenticatedUser | null;
}

function createServer(options: ServerOptions = {}) {
  const server = new McpServer(
    {
      name: "webmcp-land",
      version: "1.0.0",
    },
    {
      capabilities: {
        prompts: { listChanged: false },
        tools: {},
      },
    }
  );

  const { authenticatedUser } = options;

  // Build Drizzle where conditions for resource filtering
  const buildResourceWhereConditions = (includeOwnPrivate: boolean = true) => {
    const conditions = [
      isNull(resources.deletedAt),
    ];

    // Handle visibility: public resources OR authenticated user's own resources
    if (authenticatedUser && includeOwnPrivate) {
      const usersFilter = options.users && options.users.length > 0 ? options.users : null;
      const includeAuthUserPrivate = !usersFilter || usersFilter.includes(authenticatedUser.username);

      if (includeAuthUserPrivate) {
        conditions.push(
          or(
            eq(resources.isPrivate, false),
            and(eq(resources.isPrivate, true), eq(resources.authorId, authenticatedUser.id))!
          )!
        );
      } else {
        conditions.push(eq(resources.isPrivate, false));
      }
    } else {
      conditions.push(eq(resources.isPrivate, false));
    }

    return conditions;
  };

  // Build filter conditions including category, tag, and user filters from server options
  const buildFilterConditions = async (includeOwnPrivate: boolean = true) => {
    const conditions = buildResourceWhereConditions(includeOwnPrivate);

    // Add category filter via subquery if needed
    if (options.categories && options.categories.length > 0) {
      const matchingCats = await db
        .select({ id: categories.id })
        .from(categories)
        .where(inArray(categories.slug, options.categories));
      const catIds = matchingCats.map((c) => c.id);
      if (catIds.length > 0) {
        conditions.push(inArray(resources.categoryId, catIds));
      }
    }

    // Add tag filter via subquery if needed
    if (options.tags && options.tags.length > 0) {
      const matchingTags = await db
        .select({ id: tags.id })
        .from(tags)
        .where(inArray(tags.slug, options.tags));
      const tagIds = matchingTags.map((t) => t.id);
      if (tagIds.length > 0) {
        const resourceIdsWithTags = await db
          .select({ resourceId: resourceTags.resourceId })
          .from(resourceTags)
          .where(inArray(resourceTags.tagId, tagIds));
        const rIds = resourceIdsWithTags.map((r) => r.resourceId);
        if (rIds.length > 0) {
          conditions.push(inArray(resources.id, rIds));
        }
      }
    }

    // Add users filter via subquery if needed
    if (options.users && options.users.length > 0) {
      const matchingUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(inArray(users.username, options.users));
      const userIds = matchingUsers.map((u) => u.id);
      if (userIds.length > 0) {
        conditions.push(inArray(resources.authorId, userIds));
      }
    }

    return conditions;
  };

  // Dynamic MCP Prompts - expose database resources as MCP prompts
  server.server.setRequestHandler(ListPromptsRequestSchema, async (request) => {
    const cursor = request.params?.cursor;
    const page = cursor ? parseInt(cursor, 10) : 1;
    const perPage = 20;

    const conditions = await buildFilterConditions();

    const results = await db
      .select({
        id: resources.id,
        slug: resources.slug,
        title: resources.title,
        description: resources.description,
        endpointUrl: resources.endpointUrl,
        serverType: resources.serverType,
      })
      .from(resources)
      .where(and(...conditions))
      .orderBy(desc(resources.createdAt))
      .offset((page - 1) * perPage)
      .limit(perPage + 1);

    const hasMore = results.length > perPage;
    const pageResults = hasMore ? results.slice(0, perPage) : results;

    return {
      prompts: pageResults.map((r) => {
        return {
          name: getResourceName(r),
          title: r.title,
          description: r.description || `${r.serverType} service at ${r.endpointUrl}`,
          arguments: [],
        };
      }),
      nextCursor: hasMore ? String(page + 1) : undefined,
    };
  });

  server.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const resourceSlug = request.params.name;

    const conditions = await buildFilterConditions();

    // Query directly by slug or id first
    const selectFields = {
      id: resources.id,
      slug: resources.slug,
      title: resources.title,
      description: resources.description,
      endpointUrl: resources.endpointUrl,
      serverType: resources.serverType,
      status: resources.status,
    };

    let [resource] = await db
      .select(selectFields)
      .from(resources)
      .where(and(
        ...conditions,
        or(
          eq(resources.slug, resourceSlug),
          eq(resources.id, resourceSlug)
        )
      ))
      .limit(1);

    // If not found by slug/id, try matching by slugified title
    if (!resource) {
      [resource] = await db
        .select(selectFields)
        .from(resources)
        .where(and(
          ...conditions,
          ilike(resources.title, `%${resourceSlug.replace(/-/g, "%")}%`)
        ))
        .limit(1);

      // Verify the slugified title actually matches
      if (resource && slugify(resource.title) !== resourceSlug) {
        resource = undefined as unknown as typeof resource;
      }
    }

    if (!resource) {
      throw new Error(`Resource not found: ${resourceSlug}`);
    }

    return {
      description: resource.description || resource.title,
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: JSON.stringify({
              title: resource.title,
              endpointUrl: resource.endpointUrl,
              serverType: resource.serverType,
              status: resource.status,
              description: resource.description,
            }, null, 2),
          },
        },
      ],
    };
  });

  server.registerTool(
    "search_resources",
    {
      title: "Search Resources",
      description:
        "Search for MCP/WebMCP services by keyword. Returns matching resources with title, description, endpoint URL, server type, author, category, and tags. Use this to discover MCP services for various tasks.",
      inputSchema: {
        query: z.string().describe("Search query to find relevant resources"),
        limit: z
          .number()
          .min(1)
          .max(50)
          .default(10)
          .describe("Maximum number of resources to return (default 10, max 50)"),
        serverType: z
          .enum(["MCP", "WEBMCP"])
          .optional()
          .describe("Filter by server type"),
        category: z.string().optional().describe("Filter by category slug"),
        tag: z.string().optional().describe("Filter by tag slug"),
      },
    },
    async ({ query, limit = 10, serverType, category, tag }) => {
      try {
        const conditions = await buildFilterConditions();

        // Add search filter
        conditions.push(
          or(
            ilike(resources.title, `%${query}%`),
            ilike(resources.description, `%${query}%`),
            ilike(resources.endpointUrl, `%${query}%`)
          )!
        );

        if (serverType) conditions.push(eq(resources.serverType, serverType));

        if (category) {
          const [cat] = await db
            .select({ id: categories.id })
            .from(categories)
            .where(eq(categories.slug, category));
          if (cat) conditions.push(eq(resources.categoryId, cat.id));
        }

        if (tag) {
          const [tagRow] = await db
            .select({ id: tags.id })
            .from(tags)
            .where(eq(tags.slug, tag));
          if (tagRow) {
            const resourceIdsWithTag = await db
              .select({ resourceId: resourceTags.resourceId })
              .from(resourceTags)
              .where(eq(resourceTags.tagId, tagRow.id));
            const rIds = resourceIdsWithTag.map((r) => r.resourceId);
            if (rIds.length > 0) {
              conditions.push(inArray(resources.id, rIds));
            }
          }
        }

        const results = await db.query.resources.findMany({
          where: and(...conditions),
          limit: Math.min(limit, 50),
          orderBy: [desc(resources.createdAt)],
          columns: {
            id: true,
            slug: true,
            title: true,
            description: true,
            endpointUrl: true,
            serverType: true,
            status: true,
            capabilities: true,
            methods: true,
            useCases: true,
            createdAt: true,
          },
          with: {
            author: { columns: { username: true, name: true } },
            category: { columns: { name: true, slug: true } },
            tags: { with: { tag: { columns: { name: true, slug: true } } } },
            votes: { columns: { userId: true } },
          },
        });

        const mappedResults = results.map((r) => ({
          id: r.id,
          slug: getResourceName(r),
          title: r.title,
          description: r.description,
          endpointUrl: r.endpointUrl,
          serverType: r.serverType,
          status: r.status,
          capabilities: r.capabilities,
          methods: r.methods,
          useCases: r.useCases,
          author: r.author.name || r.author.username,
          category: r.category?.name || null,
          tags: r.tags.map((t) => t.tag.name),
          votes: r.votes.length,
          createdAt: r.createdAt.toISOString(),
        }));

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ query, count: mappedResults.length, resources: mappedResults }, null, 2),
            },
          ],
        };
      } catch (error) {
        console.error("MCP search_resources error:", error);
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ error: "Failed to search resources" }) }],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    "get_resource",
    {
      title: "Get Resource",
      description:
        "Get an MCP/WebMCP service resource by ID. Returns full details including endpoint URL, server type, capabilities, methods, and use cases.",
      inputSchema: {
        id: z.string().describe("The ID of the resource to retrieve"),
      },
    },
    async ({ id }) => {
      try {
        const resource = await db.query.resources.findFirst({
          where: and(
            eq(resources.id, id),
            eq(resources.isPrivate, false),
            isNull(resources.deletedAt)
          ),
          columns: {
            id: true,
            slug: true,
            title: true,
            description: true,
            endpointUrl: true,
            serverType: true,
            status: true,
            capabilities: true,
            methods: true,
            useCases: true,
          },
          with: {
            author: { columns: { username: true, name: true } },
            category: { columns: { name: true, slug: true } },
            tags: { with: { tag: { columns: { name: true, slug: true } } } },
          },
        });

        if (!resource) {
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ error: "Resource not found" }) }],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  ...resource,
                  author: resource.author.name || resource.author.username,
                  category: resource.category?.name || null,
                  tags: resource.tags.map((t) => t.tag.name),
                  link: `https://webmcp.land/resources/${resource.id}_${getResourceName(resource)}`,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        console.error("MCP get_resource error:", error);
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ error: "Failed to get resource" }) }],
          isError: true,
        };
      }
    }
  );

  // Save resource tool - requires authentication
  server.registerTool(
    "save_resource",
    {
      title: "Save Resource",
      description:
        "Save a new MCP/WebMCP service resource to your webmcp.land account. Requires API key authentication. Resources are private by default unless configured otherwise in settings.",
      inputSchema: {
        title: z.string().min(1).max(200).describe("Title of the resource"),
        endpointUrl: z.string().url().describe("The endpoint URL of the MCP/WebMCP service"),
        serverType: z.enum(["MCP", "WEBMCP"]).default("MCP").describe("Server type (default: MCP)"),
        description: z.string().max(500).optional().describe("Optional description of the resource"),
        capabilities: z.any().optional().describe("Optional capabilities of the service (JSON)"),
        methods: z.any().optional().describe("Optional methods exposed by the service (JSON)"),
        useCases: z.any().optional().describe("Optional use cases for the service (JSON)"),
        tags: z.array(z.string()).max(10).optional().describe("Optional array of tag names (will be created if they don't exist)"),
        category: z.string().optional().describe("Optional category slug"),
        isPrivate: z.boolean().optional().describe("Whether the resource is private (default: uses your account setting)"),
      },
    },
    async ({ title, endpointUrl, serverType, description, capabilities, methods, useCases, tags: tagNames, category, isPrivate }) => {
      if (!authenticatedUser) {
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ error: "Authentication required. Please provide an API key." }) }],
          isError: true,
        };
      }

      try {
        // Determine privacy setting
        const shouldBePrivate = isPrivate !== undefined ? isPrivate : !authenticatedUser.resourcesPublicByDefault;

        // Find or create tags
        const tagIds = tagNames && tagNames.length > 0 ? await findOrCreateTags(tagNames) : [];

        // Find category if provided
        let categoryId: string | null = null;
        if (category) {
          const [cat] = await db
            .select({ id: categories.id })
            .from(categories)
            .where(eq(categories.slug, category));
          if (cat) categoryId = cat.id;
        }

        // Create the resource
        const [resource] = await db
          .insert(resources)
          .values({
            title,
            slug: slugify(title),
            endpointUrl,
            serverType: serverType || "MCP",
            description: description || null,
            capabilities: capabilities || null,
            methods: methods || null,
            useCases: useCases || null,
            isPrivate: shouldBePrivate,
            authorId: authenticatedUser.id,
            categoryId,
          })
          .returning();

        // Create tag associations
        if (tagIds.length > 0) {
          await db.insert(resourceTags).values(
            tagIds.map((tagId) => ({ resourceId: resource.id, tagId }))
          );
        }

        // Fetch the created resource with relations
        const createdResource = await db.query.resources.findFirst({
          where: eq(resources.id, resource.id),
          columns: {
            id: true,
            slug: true,
            title: true,
            description: true,
            endpointUrl: true,
            serverType: true,
            status: true,
            isPrivate: true,
            createdAt: true,
          },
          with: {
            tags: { with: { tag: { columns: { name: true, slug: true } } } },
            category: { columns: { name: true, slug: true } },
          },
        });

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  success: true,
                  resource: {
                    ...createdResource,
                    tags: createdResource!.tags.map((t) => t.tag.name),
                    category: createdResource!.category?.name || null,
                    link: createdResource!.isPrivate ? null : `https://webmcp.land/resources/${createdResource!.id}_${getResourceName(createdResource!)}`,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        console.error("MCP save_resource error:", error);
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ error: "Failed to save resource" }) }],
          isError: true,
        };
      }
    }
  );

  return server;
}

// ── App Router Route Handlers ─────────────────────────────────────────────

/**
 * Bridge between Web API Request/Response and Node.js-style objects
 * needed by StreamableHTTPServerTransport.handleRequest().
 */
function createMockNodeObjects(request: Request) {
  const url = new URL(request.url);

  // Mock IncomingMessage — transport reads method, headers, url
  const mockReq = {
    method: request.method,
    url: url.pathname + url.search,
    headers: Object.fromEntries(request.headers),
    on: () => mockReq,
    once: () => mockReq,
    emit: () => false,
    removeListener: () => mockReq,
  };

  // Mock ServerResponse — transport writes status, headers, body
  let statusCode = 200;
  const responseHeaders: Record<string, string | string[]> = {};
  const encoder = new TextEncoder();
  let streamController: ReadableStreamDefaultController<Uint8Array> | null = null;
  let responseClosed = false;

  const readable = new ReadableStream<Uint8Array>({
    start(controller) {
      streamController = controller;
    },
    cancel() {
      responseClosed = true;
      // Trigger 'close' listeners
      for (const fn of closeListeners) fn();
    },
  });

  const closeListeners: (() => void)[] = [];

  const mockRes = {
    writeHead(status: number, headers?: Record<string, string | string[]>) {
      statusCode = status;
      if (headers) {
        for (const [k, v] of Object.entries(headers)) {
          responseHeaders[k] = v;
        }
      }
      return mockRes;
    },
    setHeader(name: string, value: string | string[]) {
      responseHeaders[name] = value;
      return mockRes;
    },
    getHeader(name: string) {
      return responseHeaders[name];
    },
    write(chunk: string | Buffer | Uint8Array) {
      if (responseClosed || !streamController) return false;
      const data = typeof chunk === "string"
        ? encoder.encode(chunk)
        : chunk instanceof Uint8Array
          ? chunk
          : new Uint8Array(chunk);
      try {
        streamController.enqueue(data);
      } catch {
        // Stream already closed
      }
      return true;
    },
    end(chunk?: string | Buffer | Uint8Array) {
      if (chunk) mockRes.write(chunk);
      if (streamController && !responseClosed) {
        try {
          streamController.close();
        } catch {
          // Already closed
        }
      }
      responseClosed = true;
      return mockRes;
    },
    on(event: string, handler: () => void) {
      if (event === "close") closeListeners.push(handler);
      return mockRes;
    },
    once(event: string, handler: () => void) {
      if (event === "close") closeListeners.push(handler);
      return mockRes;
    },
    emit() { return false; },
    removeListener() { return mockRes; },
    headersSent: false,
    statusCode: 200,
  };

  return {
    mockReq,
    mockRes,
    getResponse: () => {
      const webHeaders = new Headers();
      for (const [k, v] of Object.entries(responseHeaders)) {
        if (Array.isArray(v)) {
          for (const val of v) webHeaders.append(k, val);
        } else {
          webHeaders.set(k, v);
        }
      }
      return new Response(readable, {
        status: statusCode,
        headers: webHeaders,
      });
    },
  };
}

function parseServerOptions(request: Request): { serverOptions: ServerOptions; apiKey: string | null } {
  const url = new URL(request.url);
  const categoriesParam = url.searchParams.get("categories");
  const tagsParam = url.searchParams.get("tags");
  const usersParam = url.searchParams.get("users");

  // Extract API key from header or query parameter
  const apiKeyHeader = request.headers.get("resources_api_key") || request.headers.get("resources-api-key");
  const apiKeyParam = url.searchParams.get("api_key");
  const apiKey = apiKeyHeader || apiKeyParam;

  const serverOptions: ServerOptions = {};
  if (categoriesParam) {
    serverOptions.categories = categoriesParam.split(",").map((c) => c.trim());
  }
  if (tagsParam) {
    serverOptions.tags = tagsParam.split(",").map((t) => t.trim());
  }
  if (usersParam) {
    serverOptions.users = usersParam.split(",").map((u) => u.trim());
  }

  return { serverOptions, apiKey };
}

export async function GET() {
  return Response.json({
    name: "webmcp-land",
    version: "1.0.0",
    description: "MCP server for webmcp.land - Search and discover MCP/WebMCP services",
    protocol: "Model Context Protocol (MCP)",
    capabilities: {
      tools: true,
      prompts: true,
    },
    tools: [
      { name: "search_resources", description: "Search for MCP/WebMCP services by keyword." },
      { name: "get_resource", description: "Get a resource by ID." },
      { name: "save_resource", description: "Save a new MCP/WebMCP service resource (requires API key authentication)." },
    ],
    prompts: {
      description: "All public resources are available as MCP prompts. Use prompts/list to browse and prompts/get to retrieve service details.",
      usage: "Access via slash commands in MCP clients (e.g., /resource-slug)",
    },
    endpoint: "/api/mcp",
  });
}

export async function DELETE() {
  return new Response(null, { status: 204 });
}

export async function POST(request: Request) {
  const { serverOptions, apiKey } = parseServerOptions(request);

  // Authenticate user if API key is provided
  const authenticatedUser = await authenticateApiKey(apiKey);
  serverOptions.authenticatedUser = authenticatedUser;

  const server = createServer(serverOptions);

  try {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    await server.connect(transport);

    const body = await request.json();

    const { mockReq, mockRes, getResponse } = createMockNodeObjects(request);

    // Handle the request through the transport
    await transport.handleRequest(mockReq as any, mockRes as any, body);

    const response = getResponse();

    // Clean up when the response stream ends
    const originalBody = response.body;
    if (originalBody) {
      const cleanup = () => {
        transport.close();
        server.close();
      };

      // Wrap the readable stream to add cleanup on completion
      const reader = originalBody.getReader();
      const wrappedStream = new ReadableStream({
        async pull(controller) {
          const { done, value } = await reader.read();
          if (done) {
            controller.close();
            cleanup();
          } else {
            controller.enqueue(value);
          }
        },
        cancel() {
          reader.cancel();
          cleanup();
        },
      });

      return new Response(wrappedStream, {
        status: response.status,
        headers: response.headers,
      });
    }

    transport.close();
    server.close();
    return response;
  } catch (error) {
    console.error("MCP error:", error);
    return Response.json(
      {
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      },
      { status: 500 }
    );
  }
}
