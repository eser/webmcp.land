import { NextRequest } from "next/server";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/resources/route";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

import { createChainMock, mockSelectSequence } from "../helpers/db-mock";

// Mock dependencies
vi.mock("@/lib/db", async () => {
  const { createChainMock } = await import("../helpers/db-mock");
  return {
    db: {
      select: vi.fn().mockReturnValue(createChainMock([])),
      insert: vi.fn().mockReturnValue(createChainMock([])),
      update: vi.fn().mockReturnValue(createChainMock([])),
      delete: vi.fn().mockReturnValue(createChainMock([])),
      execute: vi.fn().mockResolvedValue({ rows: [] }),
      transaction: vi.fn().mockImplementation(async (fn: Function) => fn({
        select: vi.fn().mockReturnValue(createChainMock()),
        insert: vi.fn().mockReturnValue(createChainMock()),
        update: vi.fn().mockReturnValue(createChainMock()),
        delete: vi.fn().mockReturnValue(createChainMock()),
      })),
      query: {
        resources: { findMany: vi.fn().mockResolvedValue([]), findFirst: vi.fn().mockResolvedValue(null) },
        users: { findMany: vi.fn().mockResolvedValue([]), findFirst: vi.fn().mockResolvedValue(null) },
        categories: { findMany: vi.fn().mockResolvedValue([]), findFirst: vi.fn().mockResolvedValue(null) },
        tags: { findMany: vi.fn().mockResolvedValue([]), findFirst: vi.fn().mockResolvedValue(null) },
        resourceVotes: { findMany: vi.fn().mockResolvedValue([]), findFirst: vi.fn().mockResolvedValue(null) },
        resourceVersions: { findMany: vi.fn().mockResolvedValue([]), findFirst: vi.fn().mockResolvedValue(null) },
        resourceConnections: { findMany: vi.fn().mockResolvedValue([]), findFirst: vi.fn().mockResolvedValue(null) },
        collections: { findMany: vi.fn().mockResolvedValue([]), findFirst: vi.fn().mockResolvedValue(null) },
      },
    },
  };
});

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

vi.mock("@/lib/webhook", () => ({
  triggerWebhooks: vi.fn(),
}));

vi.mock("@/lib/ai/embeddings", () => ({
  generateResourceEmbedding: vi.fn().mockResolvedValue(undefined),
  findAndSaveRelatedResources: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/slug", () => ({
  generateResourceSlug: vi.fn().mockResolvedValue("test-resource"),
}));

vi.mock("@/lib/ai/quality-check", () => ({
  checkResourceQuality: vi.fn().mockResolvedValue({ shouldDelist: false }),
}));

vi.mock("@/lib/similarity", () => ({
  isSimilarContent: vi.fn().mockReturnValue(false),
  normalizeContent: vi.fn().mockReturnValue("normalized content"),
}));


describe("GET /api/resources", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return paginated resources", async () => {
    const mockResources = [
      {
        id: "1",
        title: "Test Resource",
        content: "Test content",
        type: "TEXT",
        isPrivate: false,
        authorId: "user1",
        categoryId: null,
        slug: "test-prompt",
        description: null,
        viewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        isFeatured: false,
        isUnlisted: false,
        deletedAt: null,
        mediaUrl: null,
        requiresMediaUpload: false,
        structuredFormat: null,
        bestWithModels: null,
        bestWithMCP: null,
        workflowLink: null,
      },
    ];

    // GET makes multiple select calls: resources query, count query, authors, tags, contributors, votes, connections, etc.
    mockSelectSequence(db,
      mockResources,    // resources query
      [{ value: 1 }],   // count query
      [{ id: "user1", name: "Test User", username: "testuser", avatar: null, verified: false }], // authors
      [],                // tags
      [],                // contributors
      [],                // vote counts
      [],                // outgoing connections
      [],                // incoming connections
      [],                // user examples
    );
    vi.mocked(db.query.categories.findMany).mockResolvedValue([]);

    const request = new Request("http://localhost:3000/api/resources?page=1&perPage=24");
    const response = await GET(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.resources).toHaveLength(1);
    expect(data.total).toBe(1);
    expect(data.page).toBe(1);
    expect(data.perPage).toBe(24);
  });

  it("should filter by type", async () => {
    mockSelectSequence(db, [], [{ value: 0 }]);
    vi.mocked(db.query.categories.findMany).mockResolvedValue([]);

    const request = new Request("http://localhost:3000/api/resources?type=IMAGE");
    const response = await GET(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(db.select).toHaveBeenCalled();
  });

  it("should filter by category", async () => {
    mockSelectSequence(db, [], [{ value: 0 }]);
    vi.mocked(db.query.categories.findMany).mockResolvedValue([]);

    const request = new Request("http://localhost:3000/api/resources?category=cat-123");
    const response = await GET(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(db.select).toHaveBeenCalled();
  });

  it("should filter by search query", async () => {
    mockSelectSequence(db, [], [{ value: 0 }]);
    vi.mocked(db.query.categories.findMany).mockResolvedValue([]);

    const request = new Request("http://localhost:3000/api/resources?q=test");
    const response = await GET(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(db.select).toHaveBeenCalled();
  });

  it("should support sorting by upvotes", async () => {
    mockSelectSequence(db, [], [{ value: 0 }]);
    vi.mocked(db.query.categories.findMany).mockResolvedValue([]);

    const request = new Request("http://localhost:3000/api/resources?sort=upvotes");
    const response = await GET(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(db.select).toHaveBeenCalled();
  });

  it("should handle database errors", async () => {
    vi.mocked(db.select).mockImplementation(() => {
      throw new Error("DB Error");
    });

    const request = new Request("http://localhost:3000/api/resources");
    const response = await GET(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("server_error");
  });
});

describe("POST /api/resources", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: user is not flagged
    mockSelectSequence(db,
      [{ flagged: false }],  // user check
      [],                     // rate limit check (no recent resource)
    );
  });

  const validResourceData = {
    title: "Test Resource",
    description: "A test resource",
    content: "This is test content",
    type: "TEXT",
    tagIds: [],
    isPrivate: false,
  };

  it("should return 401 if not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null as any);

    const request = new Request("http://localhost:3000/api/resources", {
      method: "POST",
      body: JSON.stringify(validResourceData),
    });

    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("unauthorized");
  });

  it("should return 400 for invalid input", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);

    const request = new Request("http://localhost:3000/api/resources", {
      method: "POST",
      body: JSON.stringify({ title: "" }), // Missing required fields
    });

    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("validation_error");
  });

  it("should return 429 for rate limiting", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    // User not flagged, but has recent resource
    mockSelectSequence(db,
      [{ flagged: false }],                  // user check
      [{ id: "recent" }],                    // rate limit check (recent resource found)
    );

    const request = new Request("http://localhost:3000/api/resources", {
      method: "POST",
      body: JSON.stringify(validResourceData),
    });

    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toBe("rate_limit");
  });

  it("should create resource successfully", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    const mockResource = {
      id: "new-resource",
      title: "Test Resource",
      slug: "test-resource",
      content: "This is test content",
      type: "TEXT",
      isPrivate: false,
      authorId: "user1",
      categoryId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Sequence: user check, rate limit, similarity check resources, insert resource, select author, insert version
    mockSelectSequence(db,
      [{ flagged: false }],                  // user check
      [],                                     // rate limit (no recent)
      [],                                     // similarity check: public resources
    );
    // Mock insert to return the new resource
    vi.mocked(db.insert).mockReturnValue(createChainMock([mockResource]) as any);
    // Mock query for category
    vi.mocked(db.query.categories.findFirst).mockResolvedValue(null as any);

    const request = new Request("http://localhost:3000/api/resources", {
      method: "POST",
      body: JSON.stringify(validResourceData),
    });

    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe("new-resource");
    expect(db.insert).toHaveBeenCalled();
  });

  it("should return 429 when flagged user exceeds daily limit", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    // User IS flagged, and has exceeded daily limit
    mockSelectSequence(db,
      [{ flagged: true }],       // user check - flagged
      [{ value: 5 }],            // daily count
    );

    const request = new Request("http://localhost:3000/api/resources", {
      method: "POST",
      body: JSON.stringify(validResourceData),
    });

    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toBe("daily_limit");
  });
});
