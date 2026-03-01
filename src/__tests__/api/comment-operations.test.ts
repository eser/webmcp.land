import { NextRequest } from "next/server";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DELETE } from "@/app/api/resources/[id]/comments/[commentId]/route";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getConfig } from "@/lib/config";

import { createChainMock, mockSelectSequence, createMockDb } from "../helpers/db-mock";

vi.mock("@/lib/db", async () => {
  const { createMockDb } = await import("../helpers/db-mock");
  return createMockDb();
});

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/config", () => ({
  getConfig: vi.fn(),
}));


describe("DELETE /api/resources/[id]/comments/[commentId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getConfig).mockResolvedValue({ features: { comments: true } } as never);
  });

  it("should return 403 if comments feature is disabled", async () => {
    vi.mocked(getConfig).mockResolvedValue({ features: { comments: false } } as never);

    const request = new Request("http://localhost:3000/api/resources/123/comments/456", {
      method: "DELETE",
    });
    const response = await DELETE(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123", commentId: "456" }),
    });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("feature_disabled");
  });

  it("should return 401 if not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null as any);

    const request = new Request("http://localhost:3000/api/resources/123/comments/456", {
      method: "DELETE",
    });
    const response = await DELETE(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123", commentId: "456" }),
    });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("unauthorized");
  });

  it("should return 404 for non-existent comment", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1", role: "USER" } } as never);
    mockSelectSequence(db, []);

    const request = new Request("http://localhost:3000/api/resources/123/comments/456", {
      method: "DELETE",
    });
    const response = await DELETE(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123", commentId: "456" }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("not_found");
  });

  it("should return 404 if comment belongs to different resource", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1", role: "USER" } } as never);
    mockSelectSequence(db, [{
      id: "456",
      promptId: "different-prompt",
      authorId: "user1",
    }]);

    const request = new Request("http://localhost:3000/api/resources/123/comments/456", {
      method: "DELETE",
    });
    const response = await DELETE(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123", commentId: "456" }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("not_found");
  });

  it("should return 403 if user is not author or admin", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1", role: "USER" } } as never);
    mockSelectSequence(db, [{
      id: "456",
      promptId: "123",
      authorId: "other-user",
    }]);

    const request = new Request("http://localhost:3000/api/resources/123/comments/456", {
      method: "DELETE",
    });
    const response = await DELETE(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123", commentId: "456" }),
    });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("forbidden");
  });

  it("should allow author to delete own comment", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1", role: "USER" } } as never);
    mockSelectSequence(db, [{
      id: "456",
      promptId: "123",
      authorId: "user1",
    }]);
    vi.mocked(db.update).mockReturnValue(createChainMock([{}]) as any);

    const request = new Request("http://localhost:3000/api/resources/123/comments/456", {
      method: "DELETE",
    });
    const response = await DELETE(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123", commentId: "456" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.deleted).toBe(true);
    expect(db.update).toHaveBeenCalled();
  });

  it("should allow admin to delete any comment", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } } as never);
    mockSelectSequence(db, [{
      id: "456",
      promptId: "123",
      authorId: "other-user",
    }]);
    vi.mocked(db.update).mockReturnValue(createChainMock([{}]) as any);

    const request = new Request("http://localhost:3000/api/resources/123/comments/456", {
      method: "DELETE",
    });
    const response = await DELETE(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123", commentId: "456" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.deleted).toBe(true);
  });

  it("should soft delete by setting deletedAt timestamp", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1", role: "USER" } } as never);
    mockSelectSequence(db, [{
      id: "456",
      promptId: "123",
      authorId: "user1",
    }]);
    vi.mocked(db.update).mockReturnValue(createChainMock([{}]) as any);

    const request = new Request("http://localhost:3000/api/resources/123/comments/456", {
      method: "DELETE",
    });
    await DELETE(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123", commentId: "456" }),
    });

    expect(db.update).toHaveBeenCalled();
  });
});
