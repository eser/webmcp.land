import { NextRequest } from "next/server";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PATCH, DELETE } from "@/app/api/resources/[id]/route";
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

vi.mock("@/lib/ai/embeddings", () => ({
  generateResourceEmbedding: vi.fn().mockResolvedValue(undefined),
  findAndSaveRelatedResources: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/slug", () => ({
  generateResourceSlug: vi.fn().mockResolvedValue("updated-slug"),
}));

vi.mock("@/lib/ai/quality-check", () => ({
  checkResourceQuality: vi.fn().mockResolvedValue({ shouldDelist: false }),
}));


describe("GET /api/resources/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 404 for non-existent resource", async () => {
    vi.mocked(getSession).mockResolvedValue(null as any);
    // db.select().from(prompts).where(...) returns empty
    mockSelectSequence(db, []);

    const request = new Request("http://localhost:3000/api/resources/non-existent");
    const response = await GET(request as unknown as NextRequest, { params: Promise.resolve({ id: "non-existent" }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("not_found");
  });

  it("should return 404 for deleted resource", async () => {
    vi.mocked(getSession).mockResolvedValue(null as any);
    mockSelectSequence(db, [{
      id: "123",
      deletedAt: new Date(),
      isPrivate: false,
      authorId: "user1",
    }]);

    const request = new Request("http://localhost:3000/api/resources/123");
    const response = await GET(request as unknown as NextRequest, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("not_found");
  });

  it("should return 403 for private resource not owned by user", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "other-user" } } as never);
    mockSelectSequence(db, [{
      id: "123",
      isPrivate: true,
      authorId: "owner",
      deletedAt: null,
    }]);

    const request = new Request("http://localhost:3000/api/resources/123");
    const response = await GET(request as unknown as NextRequest, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("forbidden");
  });

  it("should return resource with vote status for authenticated user", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    // Sequence: resource, author, tags, versions, vote count, user vote check
    mockSelectSequence(db,
      [{
        id: "123",
        title: "Test Resource",
        content: "Test content",
        isPrivate: false,
        authorId: "author",
        deletedAt: null,
        categoryId: null,
        slug: "test-prompt",
      }],
      [{ id: "author", name: "Author", username: "author", avatar: null, verified: false }], // author
      [],       // tags
      [],       // versions
      [{ value: 10 }], // vote count
      [{ userId: "user1" }],  // user vote check
    );
    vi.mocked(db.query.categories.findFirst).mockResolvedValue(null as any);

    const request = new Request("http://localhost:3000/api/resources/123");
    const response = await GET(request as unknown as NextRequest, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe("123");
    expect(data.voteCount).toBe(10);
    expect(data.hasVoted).toBe(true);
  });

  it("should return resource for owner even if private", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "owner" } } as never);
    // Sequence: resource, author, tags, versions, vote count, user vote check
    mockSelectSequence(db,
      [{
        id: "123",
        isPrivate: true,
        authorId: "owner",
        deletedAt: null,
        categoryId: null,
        slug: "test-prompt",
        title: "Test",
        content: "Test",
      }],
      [{ id: "owner", name: "Owner", username: "owner", avatar: null, verified: false }],
      [],             // tags
      [],             // versions
      [{ value: 0 }], // vote count
      [],             // user vote check
    );
    vi.mocked(db.query.categories.findFirst).mockResolvedValue(null as any);

    const request = new Request("http://localhost:3000/api/resources/123");
    const response = await GET(request as unknown as NextRequest, { params: Promise.resolve({ id: "123" }) });

    expect(response.status).toBe(200);
  });
});

describe("PATCH /api/resources/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null as any);

    const request = new Request("http://localhost:3000/api/resources/123", {
      method: "PATCH",
      body: JSON.stringify({ title: "Updated" }),
    });

    const response = await PATCH(request as unknown as NextRequest, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("unauthorized");
  });

  it("should return 404 for non-existent resource", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db, []);

    const request = new Request("http://localhost:3000/api/resources/123", {
      method: "PATCH",
      body: JSON.stringify({ title: "Updated" }),
    });

    const response = await PATCH(request as unknown as NextRequest, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("not_found");
  });

  it("should return 403 if user does not own the resource", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1", role: "USER" } } as never);
    mockSelectSequence(db, [{
      authorId: "other-user",
      content: "original",
    }]);

    const request = new Request("http://localhost:3000/api/resources/123", {
      method: "PATCH",
      body: JSON.stringify({ title: "Updated" }),
    });

    const response = await PATCH(request as unknown as NextRequest, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("forbidden");
  });

  it("should allow admin to update any resource", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } } as never);
    const updatedResource = {
      id: "123",
      title: "Updated",
      isPrivate: false,
      isUnlisted: false,
      authorId: "other-user",
      categoryId: null,
      content: "Updated content",
    };
    // Sequence: find resource, update resource, get author, tags, etc.
    mockSelectSequence(db,
      [{ authorId: "other-user", content: "original" }],
    );
    vi.mocked(db.update).mockReturnValue(createChainMock([updatedResource]) as any);
    // Subsequent selects for response building
    vi.mocked(db.insert).mockReturnValue(createChainMock([]) as any);
    vi.mocked(db.query.categories.findFirst).mockResolvedValue(null as any);

    const request = new Request("http://localhost:3000/api/resources/123", {
      method: "PATCH",
      body: JSON.stringify({ title: "Updated" }),
    });

    const response = await PATCH(request as unknown as NextRequest, { params: Promise.resolve({ id: "123" }) });

    expect(response.status).toBe(200);
    expect(db.update).toHaveBeenCalled();
  });

  it("should update resource successfully", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    const updatedResource = {
      id: "123",
      title: "Updated Title",
      content: "Updated content",
      isPrivate: false,
      isUnlisted: false,
      authorId: "user1",
      categoryId: null,
    };
    mockSelectSequence(db,
      [{ authorId: "user1", content: "original" }],
    );
    vi.mocked(db.update).mockReturnValue(createChainMock([updatedResource]) as any);
    vi.mocked(db.insert).mockReturnValue(createChainMock([]) as any);
    vi.mocked(db.query.categories.findFirst).mockResolvedValue(null as any);

    const request = new Request("http://localhost:3000/api/resources/123", {
      method: "PATCH",
      body: JSON.stringify({ title: "Updated Title", content: "Updated content" }),
    });

    const response = await PATCH(request as unknown as NextRequest, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.title).toBe("Updated Title");
    expect(db.insert).toHaveBeenCalled(); // New version created
  });
});

describe("DELETE /api/resources/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null as any);

    const request = new Request("http://localhost:3000/api/resources/123", {
      method: "DELETE",
    });

    const response = await DELETE(request as unknown as NextRequest, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("unauthorized");
  });

  it("should return 404 for non-existent resource", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db, []);

    const request = new Request("http://localhost:3000/api/resources/123", {
      method: "DELETE",
    });

    const response = await DELETE(request as unknown as NextRequest, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("not_found");
  });

  it("should return 400 if resource already deleted", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db, [{
      id: "123",
      authorId: "user1",
      deletedAt: new Date(),
    }]);

    const request = new Request("http://localhost:3000/api/resources/123", {
      method: "DELETE",
    });

    const response = await DELETE(request as unknown as NextRequest, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("already_deleted");
  });

  it("should return 403 if user cannot delete resource", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1", role: "USER" } } as never);
    mockSelectSequence(db, [{
      id: "123",
      authorId: "user1",
      deletedAt: null,
      isUnlisted: false,
      delistReason: null,
    }]);

    const request = new Request("http://localhost:3000/api/resources/123", {
      method: "DELETE",
    });

    const response = await DELETE(request as unknown as NextRequest, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("forbidden");
  });

  it("should allow admin to delete any resource", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } } as never);
    mockSelectSequence(db, [{
      id: "123",
      authorId: "other-user",
      deletedAt: null,
      isUnlisted: false,
    }]);
    vi.mocked(db.update).mockReturnValue(createChainMock([{}]) as any);

    const request = new Request("http://localhost:3000/api/resources/123", {
      method: "DELETE",
    });

    const response = await DELETE(request as unknown as NextRequest, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("should allow owner to delete delisted resource", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1", role: "USER" } } as never);
    mockSelectSequence(db, [{
      id: "123",
      authorId: "user1",
      deletedAt: null,
      isUnlisted: true,
      delistReason: "LOW_QUALITY",
    }]);
    vi.mocked(db.update).mockReturnValue(createChainMock([{}]) as any);

    const request = new Request("http://localhost:3000/api/resources/123", {
      method: "DELETE",
    });

    const response = await DELETE(request as unknown as NextRequest, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
