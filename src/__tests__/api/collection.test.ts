import { NextRequest } from "next/server";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST, DELETE } from "@/app/api/collection/route";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

import { createChainMock, mockSelectSequence } from "../helpers/db-mock";

vi.mock("@/lib/db", async () => {
  const { createChainMock } = await import("../helpers/db-mock");
  return {
    db: {
      select: vi.fn().mockReturnValue(createChainMock([])),
      insert: vi.fn().mockReturnValue(createChainMock([])),
      update: vi.fn().mockReturnValue(createChainMock([])),
      delete: vi.fn().mockReturnValue(createChainMock([])),
      execute: vi.fn().mockResolvedValue({ rows: [] }),
      query: {
        collections: {
          findMany: vi.fn().mockResolvedValue([]),
        },
      },
    },
  };
});

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}));


describe("GET /api/collection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return empty collections array", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    vi.mocked(db.query.collections.findMany).mockResolvedValue([]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.collections).toEqual([]);
  });

  it("should return user collections with prompt details", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    vi.mocked(db.query.collections.findMany).mockResolvedValue([
      {
        id: "col1",
        userId: "user1",
        resourceId: "prompt1",
        createdAt: new Date(),
        resource: {
          id: "prompt1",
          title: "Test Prompt",
          author: {
            id: "author1",
            name: "Author",
            username: "author",
            avatar: null,
            verified: false,
          },
          category: null,
          tags: [],
          votes: [1, 2, 3, 4, 5],
          contributors: [],
        },
      },
    ] as never);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.collections).toHaveLength(1);
    expect(data.collections[0].resource.title).toBe("Test Prompt");
  });

  it("should fetch collections using query API", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    vi.mocked(db.query.collections.findMany).mockResolvedValue([]);

    await GET();

    expect(db.query.collections.findMany).toHaveBeenCalled();
  });
});

describe("POST /api/collection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null as any);

    const request = new Request("http://localhost:3000/api/collection", {
      method: "POST",
      body: JSON.stringify({ resourceId: "123" }),
    });

    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 400 for invalid input - missing resourceId", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);

    const request = new Request("http://localhost:3000/api/collection", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid input");
  });

  it("should return 400 for empty resourceId", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);

    const request = new Request("http://localhost:3000/api/collection", {
      method: "POST",
      body: JSON.stringify({ resourceId: "" }),
    });

    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid input");
  });

  it("should return 400 if already in collection", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db, [{ id: "existing" }]);

    const request = new Request("http://localhost:3000/api/collection", {
      method: "POST",
      body: JSON.stringify({ resourceId: "123" }),
    });

    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Already in collection");
  });

  it("should return 404 if prompt not found", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db,
      [],  // no existing collection
      [],  // no prompt found
    );

    const request = new Request("http://localhost:3000/api/collection", {
      method: "POST",
      body: JSON.stringify({ resourceId: "nonexistent" }),
    });

    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Resource not found");
  });

  it("should return 403 when adding private prompt not owned by user", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db,
      [],  // no existing collection
      [{
        id: "123",
        isPrivate: true,
        authorId: "other-user",
      }],
    );

    const request = new Request("http://localhost:3000/api/collection", {
      method: "POST",
      body: JSON.stringify({ resourceId: "123" }),
    });

    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Cannot add private resource");
  });

  it("should allow adding own private prompt to collection", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db,
      [],  // no existing collection
      [{
        id: "123",
        isPrivate: true,
        authorId: "user1",
      }],
    );
    vi.mocked(db.insert).mockReturnValue(createChainMock([{
      id: "col1",
      userId: "user1",
      resourceId: "123",
    }]) as any);

    const request = new Request("http://localhost:3000/api/collection", {
      method: "POST",
      body: JSON.stringify({ resourceId: "123" }),
    });

    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.added).toBe(true);
  });

  it("should add public prompt to collection successfully", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db,
      [],  // no existing collection
      [{
        id: "123",
        isPrivate: false,
        authorId: "other-user",
      }],
    );
    vi.mocked(db.insert).mockReturnValue(createChainMock([{
      id: "col1",
      userId: "user1",
      resourceId: "123",
    }]) as any);

    const request = new Request("http://localhost:3000/api/collection", {
      method: "POST",
      body: JSON.stringify({ resourceId: "123" }),
    });

    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.added).toBe(true);
    expect(data.collection.id).toBe("col1");
    expect(db.insert).toHaveBeenCalled();
  });
});

describe("DELETE /api/collection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null as any);

    const request = new Request("http://localhost:3000/api/collection?resourceId=123", {
      method: "DELETE",
    });

    const response = await DELETE(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 400 if resourceId missing", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);

    const request = new Request("http://localhost:3000/api/collection", {
      method: "DELETE",
    });

    const response = await DELETE(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("resourceId required");
  });

  it("should remove prompt from collection successfully", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    vi.mocked(db.delete).mockReturnValue(createChainMock([]) as any);

    const request = new Request("http://localhost:3000/api/collection?resourceId=123", {
      method: "DELETE",
    });

    const response = await DELETE(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.removed).toBe(true);
    expect(db.delete).toHaveBeenCalled();
  });

  it("should handle delete error gracefully", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    vi.mocked(db.delete).mockImplementation(() => {
      throw new Error("Not found");
    });

    const request = new Request("http://localhost:3000/api/collection?resourceId=123", {
      method: "DELETE",
    });

    const response = await DELETE(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to remove from collection");
  });
});
