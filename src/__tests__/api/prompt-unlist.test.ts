import { NextRequest } from "next/server";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/resources/[id]/unlist/route";
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

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));


describe("POST /api/resources/[id]/unlist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null as any);

    const request = new Request("http://localhost:3000/api/resources/123/unlist", {
      method: "POST",
    });
    const response = await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("unauthorized");
  });

  it("should return 403 if user is not admin", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1", role: "USER" } } as never);

    const request = new Request("http://localhost:3000/api/resources/123/unlist", {
      method: "POST",
    });
    const response = await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("forbidden");
  });

  it("should return 404 for non-existent resource", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } } as never);
    mockSelectSequence(db, []);

    const request = new Request("http://localhost:3000/api/resources/123/unlist", {
      method: "POST",
    });
    const response = await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("not_found");
  });

  it("should toggle unlisted status from false to true", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } } as never);
    mockSelectSequence(db, [{ id: "123", isUnlisted: false }]);
    vi.mocked(db.update).mockReturnValue(createChainMock([]) as any);

    const request = new Request("http://localhost:3000/api/resources/123/unlist", {
      method: "POST",
    });
    const response = await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.isUnlisted).toBe(true);
    expect(data.message).toBe("Resource unlisted");
  });

  it("should toggle unlisted status from true to false (relist)", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } } as never);
    mockSelectSequence(db, [{ id: "123", isUnlisted: true }]);
    vi.mocked(db.update).mockReturnValue(createChainMock([]) as any);

    const request = new Request("http://localhost:3000/api/resources/123/unlist", {
      method: "POST",
    });
    const response = await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.isUnlisted).toBe(false);
    expect(data.message).toBe("Resource relisted");
  });

  it("should set unlistedAt when unlisting", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } } as never);
    mockSelectSequence(db, [{ id: "123", isUnlisted: false }]);
    vi.mocked(db.update).mockReturnValue(createChainMock([]) as any);

    const request = new Request("http://localhost:3000/api/resources/123/unlist", {
      method: "POST",
    });
    await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });

    expect(db.update).toHaveBeenCalled();
  });

  it("should clear unlistedAt when relisting", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } } as never);
    mockSelectSequence(db, [{ id: "123", isUnlisted: true }]);
    vi.mocked(db.update).mockReturnValue(createChainMock([]) as any);

    const request = new Request("http://localhost:3000/api/resources/123/unlist", {
      method: "POST",
    });
    await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });

    expect(db.update).toHaveBeenCalled();
  });
});
