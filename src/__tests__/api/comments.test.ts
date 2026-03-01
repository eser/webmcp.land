import { NextRequest } from "next/server";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/resources/[id]/comments/route";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getConfig } from "@/lib/config";

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
        comments: { findMany: vi.fn().mockResolvedValue([]), findFirst: vi.fn().mockResolvedValue(null) },
      },
    },
  };
});

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/config", () => ({
  getConfig: vi.fn(),
}));


describe("GET /api/resources/[id]/comments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getConfig).mockResolvedValue({ features: { comments: true } } as never);
  });

  it("should return 403 if comments feature is disabled", async () => {
    vi.mocked(getConfig).mockResolvedValue({ features: { comments: false } } as never);

    const request = new Request("http://localhost:3000/api/resources/123/comments");
    const response = await GET(request as unknown as NextRequest, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("feature_disabled");
  });

  it("should return 404 for non-existent resource", async () => {
    vi.mocked(getSession).mockResolvedValue(null as any);
    mockSelectSequence(db, []);

    const request = new Request("http://localhost:3000/api/resources/123/comments");
    const response = await GET(request as unknown as NextRequest, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("not_found");
  });

  it("should return 404 for private resource not owned by user", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db, [{
      id: "123",
      isPrivate: true,
      authorId: "other-user",
    }]);

    const request = new Request("http://localhost:3000/api/resources/123/comments");
    const response = await GET(request as unknown as NextRequest, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("not_found");
  });

  it("should return comments for public resource", async () => {
    vi.mocked(getSession).mockResolvedValue(null as any);
    mockSelectSequence(db,
      [{ id: "123", isPrivate: false, authorId: "author1" }],
      [{
        id: "comment1",
        content: "Test comment",
        score: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        promptId: "123",
        authorId: "user1",
        parentId: null,
        flagged: false,
        deletedAt: null,
        authorName: "User One",
        authorUsername: "userone",
        authorAvatar: null,
        authorRole: "USER",
      }],
      [],  // vote counts
    );

    const request = new Request("http://localhost:3000/api/resources/123/comments");
    const response = await GET(request as unknown as NextRequest, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.comments).toHaveLength(1);
    expect(data.comments[0].content).toBe("Test comment");
  });

  it("should hide flagged comments from non-admins (shadow-ban)", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user2", role: "USER" } } as never);
    mockSelectSequence(db,
      [{ id: "123", isPrivate: false, authorId: "author1" }],
      [{
        id: "comment1",
        content: "Flagged comment",
        score: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        promptId: "123",
        authorId: "user1",
        parentId: null,
        flagged: true,
        deletedAt: null,
        authorName: "User",
        authorUsername: "user",
        authorAvatar: null,
        authorRole: "USER",
      }],
      [],  // vote counts
    );

    const request = new Request("http://localhost:3000/api/resources/123/comments");
    const response = await GET(request as unknown as NextRequest, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.comments).toHaveLength(0); // Flagged comment hidden
  });

  it("should show flagged comments to admins", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } } as never);
    mockSelectSequence(db,
      [{ id: "123", isPrivate: false, authorId: "author1" }],
      [{
        id: "comment1",
        content: "Flagged comment",
        score: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        promptId: "123",
        authorId: "user1",
        parentId: null,
        flagged: true,
        deletedAt: null,
        authorName: "User",
        authorUsername: "user",
        authorAvatar: null,
        authorRole: "USER",
      }],
      [],  // vote counts
    );

    const request = new Request("http://localhost:3000/api/resources/123/comments");
    const response = await GET(request as unknown as NextRequest, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.comments).toHaveLength(1);
    expect(data.comments[0].flagged).toBe(true);
  });

  it("should show own flagged comments to author", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1", role: "USER" } } as never);
    mockSelectSequence(db,
      [{ id: "123", isPrivate: false, authorId: "author1" }],
      [{
        id: "comment1",
        content: "My flagged comment",
        score: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        promptId: "123",
        authorId: "user1",
        parentId: null,
        flagged: true,
        deletedAt: null,
        authorName: "User",
        authorUsername: "user",
        authorAvatar: null,
        authorRole: "USER",
      }],
      [],  // vote counts
    );

    const request = new Request("http://localhost:3000/api/resources/123/comments");
    const response = await GET(request as unknown as NextRequest, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.comments).toHaveLength(1);
    // Flagged status hidden from non-admins
    expect(data.comments[0].flagged).toBe(false);
  });
});

describe("POST /api/resources/[id]/comments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getConfig).mockResolvedValue({ features: { comments: true } } as never);
  });

  it("should return 403 if comments feature is disabled", async () => {
    vi.mocked(getConfig).mockResolvedValue({ features: { comments: false } } as never);

    const request = new Request("http://localhost:3000/api/resources/123/comments", {
      method: "POST",
      body: JSON.stringify({ content: "Test comment" }),
    });
    const response = await POST(request as unknown as NextRequest, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("feature_disabled");
  });

  it("should return 401 if not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null as any);

    const request = new Request("http://localhost:3000/api/resources/123/comments", {
      method: "POST",
      body: JSON.stringify({ content: "Test comment" }),
    });
    const response = await POST(request as unknown as NextRequest, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("unauthorized");
  });

  it("should return 400 for empty content", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);

    const request = new Request("http://localhost:3000/api/resources/123/comments", {
      method: "POST",
      body: JSON.stringify({ content: "" }),
    });
    const response = await POST(request as unknown as NextRequest, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("validation_error");
  });

  it("should return 404 for non-existent resource", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db, []);

    const request = new Request("http://localhost:3000/api/resources/123/comments", {
      method: "POST",
      body: JSON.stringify({ content: "Test comment" }),
    });
    const response = await POST(request as unknown as NextRequest, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("not_found");
  });

  it("should create comment successfully", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db,
      [{ id: "123", isPrivate: false, authorId: "author1" }],
      [{ id: "user1", name: "Test User", username: "testuser", avatar: null, role: "USER" }],
    );
    vi.mocked(db.insert).mockReturnValue(createChainMock([{
      id: "comment1",
      content: "Test comment",
      score: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      promptId: "123",
      authorId: "user1",
      parentId: null,
    }]) as any);

    const request = new Request("http://localhost:3000/api/resources/123/comments", {
      method: "POST",
      body: JSON.stringify({ content: "Test comment" }),
    });
    const response = await POST(request as unknown as NextRequest, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.comment.id).toBe("comment1");
    expect(data.comment.content).toBe("Test comment");
  });

  it("should create notification for resource owner", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db,
      [{ id: "123", isPrivate: false, authorId: "author1" }],
      [{ id: "user1", name: "User", username: "user", avatar: null, role: "USER" }],
    );
    vi.mocked(db.insert).mockReturnValue(createChainMock([{
      id: "comment1",
      content: "Test",
      score: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      promptId: "123",
      authorId: "user1",
      parentId: null,
    }]) as any);

    const request = new Request("http://localhost:3000/api/resources/123/comments", {
      method: "POST",
      body: JSON.stringify({ content: "Test" }),
    });
    await POST(request as unknown as NextRequest, { params: Promise.resolve({ id: "123" }) });

    // insert should be called for both comment and notification
    expect(db.insert).toHaveBeenCalled();
  });

  it("should return 400 for invalid parent comment", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db,
      [{ id: "123", isPrivate: false, authorId: "author1" }],
      [],  // parent comment not found
    );

    const request = new Request("http://localhost:3000/api/resources/123/comments", {
      method: "POST",
      body: JSON.stringify({ content: "Reply", parentId: "nonexistent" }),
    });
    const response = await POST(request as unknown as NextRequest, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("invalid_parent");
  });
});
