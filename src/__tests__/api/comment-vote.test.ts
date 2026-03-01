import { NextRequest } from "next/server";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST, DELETE } from "@/app/api/resources/[id]/comments/[commentId]/vote/route";
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


describe("POST /api/resources/[id]/comments/[commentId]/vote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getConfig).mockResolvedValue({ features: { comments: true } } as never);
  });

  it("should return 403 if comments feature is disabled", async () => {
    vi.mocked(getConfig).mockResolvedValue({ features: { comments: false } } as never);

    const request = new Request("http://localhost:3000/api/resources/123/comments/456/vote", {
      method: "POST",
      body: JSON.stringify({ value: 1 }),
    });
    const response = await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123", commentId: "456" }),
    });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("feature_disabled");
  });

  it("should return 401 if not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null as any);

    const request = new Request("http://localhost:3000/api/resources/123/comments/456/vote", {
      method: "POST",
      body: JSON.stringify({ value: 1 }),
    });
    const response = await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123", commentId: "456" }),
    });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("unauthorized");
  });

  it("should return 400 for invalid vote value", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);

    const request = new Request("http://localhost:3000/api/resources/123/comments/456/vote", {
      method: "POST",
      body: JSON.stringify({ value: 5 }),
    });
    const response = await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123", commentId: "456" }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("validation_error");
  });

  it("should return 400 for missing vote value", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);

    const request = new Request("http://localhost:3000/api/resources/123/comments/456/vote", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const response = await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123", commentId: "456" }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("validation_error");
  });

  it("should return 400 for value of 0", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);

    const request = new Request("http://localhost:3000/api/resources/123/comments/456/vote", {
      method: "POST",
      body: JSON.stringify({ value: 0 }),
    });
    const response = await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123", commentId: "456" }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("validation_error");
  });

  it("should return 404 for non-existent comment", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db, []);

    const request = new Request("http://localhost:3000/api/resources/123/comments/456/vote", {
      method: "POST",
      body: JSON.stringify({ value: 1 }),
    });
    const response = await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123", commentId: "456" }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("not_found");
  });

  it("should return 404 if comment belongs to different resource", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db, [{ id: "456", promptId: "different-prompt" }]);

    const request = new Request("http://localhost:3000/api/resources/123/comments/456/vote", {
      method: "POST",
      body: JSON.stringify({ value: 1 }),
    });
    const response = await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123", commentId: "456" }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("not_found");
  });

  it("should create new upvote when no existing vote", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db, 
      [{ id: "456", promptId: "123" }],  // comment exists
      [],                                  // no existing vote
    );
    vi.mocked(db.insert).mockReturnValue(createChainMock([]) as any);
    vi.mocked(db.update).mockReturnValue(createChainMock([{ score: 1 }]) as any);

    const request = new Request("http://localhost:3000/api/resources/123/comments/456/vote", {
      method: "POST",
      body: JSON.stringify({ value: 1 }),
    });
    const response = await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123", commentId: "456" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(db.insert).toHaveBeenCalled();
  });

  it("should create new downvote when no existing vote", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db, 
      [{ id: "456", promptId: "123" }],
      [],
    );
    vi.mocked(db.insert).mockReturnValue(createChainMock([]) as any);
    vi.mocked(db.update).mockReturnValue(createChainMock([{ score: -1 }]) as any);

    const request = new Request("http://localhost:3000/api/resources/123/comments/456/vote", {
      method: "POST",
      body: JSON.stringify({ value: -1 }),
    });
    const response = await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123", commentId: "456" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(db.insert).toHaveBeenCalled();
  });

  it("should toggle off when voting same value twice", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db, 
      [{ id: "456", promptId: "123" }],
      [{ userId: "user1", commentId: "456", value: 1 }],  // existing upvote
    );
    vi.mocked(db.delete).mockReturnValue(createChainMock([]) as any);
    vi.mocked(db.update).mockReturnValue(createChainMock([{ score: 0 }]) as any);

    const request = new Request("http://localhost:3000/api/resources/123/comments/456/vote", {
      method: "POST",
      body: JSON.stringify({ value: 1 }),
    });
    const response = await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123", commentId: "456" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(db.delete).toHaveBeenCalled();
  });

  it("should switch vote when voting opposite value", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db, 
      [{ id: "456", promptId: "123" }],
      [{ userId: "user1", commentId: "456", value: 1 }],  // existing upvote
    );
    vi.mocked(db.update).mockReturnValue(createChainMock([{ score: -1 }]) as any);

    const request = new Request("http://localhost:3000/api/resources/123/comments/456/vote", {
      method: "POST",
      body: JSON.stringify({ value: -1 }),
    });
    const response = await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123", commentId: "456" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(db.update).toHaveBeenCalled();
  });

  it("should handle database errors", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    vi.mocked(db.select).mockImplementation(() => {
      throw new Error("DB Error");
    });

    const request = new Request("http://localhost:3000/api/resources/123/comments/456/vote", {
      method: "POST",
      body: JSON.stringify({ value: 1 }),
    });
    const response = await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123", commentId: "456" }),
    });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("server_error");
  });
});

describe("DELETE /api/resources/[id]/comments/[commentId]/vote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getConfig).mockResolvedValue({ features: { comments: true } } as never);
  });

  it("should return 403 if comments feature is disabled", async () => {
    vi.mocked(getConfig).mockResolvedValue({ features: { comments: false } } as never);

    const request = new Request("http://localhost:3000/api/resources/123/comments/456/vote", {
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

    const request = new Request("http://localhost:3000/api/resources/123/comments/456/vote", {
      method: "DELETE",
    });
    const response = await DELETE(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123", commentId: "456" }),
    });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("unauthorized");
  });

  it("should handle delete for non-existent comment gracefully", async () => {
    // The DELETE route does not check if the comment exists;
    // it simply deletes any matching vote and recalculates the score.
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    vi.mocked(db.delete).mockReturnValue(createChainMock([]) as any);
    vi.mocked(db.update).mockReturnValue(createChainMock([]) as any);
    mockSelectSequence(db, []);  // votes query returns empty

    const request = new Request("http://localhost:3000/api/resources/123/comments/456/vote", {
      method: "DELETE",
    });
    const response = await DELETE(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123", commentId: "456" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.score).toBe(0);
    expect(data.userVote).toBe(0);
  });

  it("should delete vote successfully", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db, 
      [{ id: "456", promptId: "123" }],
      [{ userId: "user1", commentId: "456", value: 1 }],
    );
    vi.mocked(db.delete).mockReturnValue(createChainMock([]) as any);
    vi.mocked(db.update).mockReturnValue(createChainMock([{ score: -1 }]) as any);

    const request = new Request("http://localhost:3000/api/resources/123/comments/456/vote", {
      method: "DELETE",
    });
    const response = await DELETE(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123", commentId: "456" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(db.delete).toHaveBeenCalled();
  });

  it("should handle removing non-existent vote gracefully", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db, 
      [{ id: "456", promptId: "123" }],
      [],  // no existing vote
    );
    vi.mocked(db.update).mockReturnValue(createChainMock([{ score: 0 }]) as any);

    const request = new Request("http://localhost:3000/api/resources/123/comments/456/vote", {
      method: "DELETE",
    });
    const response = await DELETE(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123", commentId: "456" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
  });
});
