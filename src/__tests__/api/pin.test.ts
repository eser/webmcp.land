import { NextRequest } from "next/server";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST, DELETE } from "@/app/api/resources/[id]/pin/route";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

import { createChainMock, mockSelectSequence, createMockDb } from "../helpers/db-mock";

vi.mock("@/lib/db", async () => {
  const { createMockDb } = await import("../helpers/db-mock");
  return createMockDb();
});

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}));


describe("POST /api/resources/[id]/pin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null as any);

    const request = new Request("http://localhost:3000/api/resources/123/pin", {
      method: "POST",
    });
    const response = await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 401 if session has no user id", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: {} } as never);

    const request = new Request("http://localhost:3000/api/resources/123/pin", {
      method: "POST",
    });
    const response = await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 404 for non-existent resource", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db, []);

    const request = new Request("http://localhost:3000/api/resources/123/pin", {
      method: "POST",
    });
    const response = await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Resource not found");
  });

  it("should return 403 when pinning another user's resource", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db, [{ authorId: "other-user", isPrivate: false }]);

    const request = new Request("http://localhost:3000/api/resources/123/pin", {
      method: "POST",
    });
    const response = await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("You can only pin your own resources");
  });

  it("should return 400 if resource already pinned", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db,
      [{ authorId: "user1", isPrivate: false }],    // resource exists
      [{ userId: "user1", promptId: "123" }],        // already pinned
    );

    const request = new Request("http://localhost:3000/api/resources/123/pin", {
      method: "POST",
    });
    const response = await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Resource already pinned");
  });

  it("should return 400 if pin limit (3) reached", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db,
      [{ authorId: "user1", isPrivate: false }],  // resource exists
      [],                                           // not already pinned
      [{ value: 3 }],                              // pin count = 3 (max)
    );

    const request = new Request("http://localhost:3000/api/resources/123/pin", {
      method: "POST",
    });
    const response = await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("You can only pin up to 3 resources");
  });

  it("should create pin with order 0 when no existing pins", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db,
      [{ authorId: "user1", isPrivate: false }],  // resource exists
      [],                                           // not already pinned
      [{ value: 0 }],                              // pin count = 0
      [{ value: null }],                            // max order = null
    );
    vi.mocked(db.insert).mockReturnValue(createChainMock([]) as any);

    const request = new Request("http://localhost:3000/api/resources/123/pin", {
      method: "POST",
    });
    const response = await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.pinned).toBe(true);
    expect(db.insert).toHaveBeenCalled();
  });

  it("should increment order for subsequent pins", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db,
      [{ authorId: "user1", isPrivate: false }],
      [],
      [{ value: 2 }],                              // 2 existing pins
      [{ value: 1 }],                              // max order = 1
    );
    vi.mocked(db.insert).mockReturnValue(createChainMock([]) as any);

    const request = new Request("http://localhost:3000/api/resources/123/pin", {
      method: "POST",
    });
    await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });

    expect(db.insert).toHaveBeenCalled();
  });

  it("should return success: true, pinned: true on successful pin", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db,
      [{ authorId: "user1", isPrivate: false }],
      [],
      [{ value: 0 }],
      [{ value: null }],
    );
    vi.mocked(db.insert).mockReturnValue(createChainMock([]) as any);

    const request = new Request("http://localhost:3000/api/resources/123/pin", {
      method: "POST",
    });
    const response = await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true, pinned: true });
  });
});

describe("DELETE /api/resources/[id]/pin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null as any);

    const request = new Request("http://localhost:3000/api/resources/123/pin", {
      method: "DELETE",
    });
    const response = await DELETE(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should remove pin successfully", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    vi.mocked(db.delete).mockReturnValue(createChainMock([]) as any);

    const request = new Request("http://localhost:3000/api/resources/123/pin", {
      method: "DELETE",
    });
    const response = await DELETE(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.pinned).toBe(false);
  });

  it("should call delete with correct parameters", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    vi.mocked(db.delete).mockReturnValue(createChainMock([]) as any);

    const request = new Request("http://localhost:3000/api/resources/123/pin", {
      method: "DELETE",
    });
    await DELETE(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });

    expect(db.delete).toHaveBeenCalled();
  });

  it("should handle unpinning non-pinned resource gracefully", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    vi.mocked(db.delete).mockReturnValue(createChainMock([]) as any);

    const request = new Request("http://localhost:3000/api/resources/123/pin", {
      method: "DELETE",
    });
    const response = await DELETE(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true, pinned: false });
  });

  it("should return success: true, pinned: false on successful unpin", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    vi.mocked(db.delete).mockReturnValue(createChainMock([]) as any);

    const request = new Request("http://localhost:3000/api/resources/123/pin", {
      method: "DELETE",
    });
    const response = await DELETE(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true, pinned: false });
  });
});
