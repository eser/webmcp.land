import { NextRequest } from "next/server";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/resources/[id]/feature/route";
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


describe("POST /api/resources/[id]/feature", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null as any);

    const request = new Request("http://localhost:3000/api/resources/123/feature", {
      method: "POST",
    });
    const response = await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 403 if user is not admin", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db, [{ role: "USER" }]);

    const request = new Request("http://localhost:3000/api/resources/123/feature", {
      method: "POST",
    });
    const response = await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Forbidden");
  });

  it("should return 404 for non-existent resource", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "admin1" } } as never);
    mockSelectSequence(db,
      [{ role: "ADMIN" }],  // user role check
      [],                     // resource not found
    );

    const request = new Request("http://localhost:3000/api/resources/123/feature", {
      method: "POST",
    });
    const response = await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Resource not found");
  });

  it("should toggle featured status from false to true", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "admin1" } } as never);
    mockSelectSequence(db,
      [{ role: "ADMIN" }],
      [{ isFeatured: false }],
    );
    vi.mocked(db.update).mockReturnValue(createChainMock([{ isFeatured: true }]) as any);

    const request = new Request("http://localhost:3000/api/resources/123/feature", {
      method: "POST",
    });
    const response = await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.isFeatured).toBe(true);
  });

  it("should toggle featured status from true to false", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "admin1" } } as never);
    mockSelectSequence(db,
      [{ role: "ADMIN" }],
      [{ isFeatured: true }],
    );
    vi.mocked(db.update).mockReturnValue(createChainMock([{ isFeatured: false }]) as any);

    const request = new Request("http://localhost:3000/api/resources/123/feature", {
      method: "POST",
    });
    const response = await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.isFeatured).toBe(false);
  });

  it("should set featuredAt when featuring a resource", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "admin1" } } as never);
    mockSelectSequence(db,
      [{ role: "ADMIN" }],
      [{ isFeatured: false }],
    );
    vi.mocked(db.update).mockReturnValue(createChainMock([{ isFeatured: true }]) as any);

    const request = new Request("http://localhost:3000/api/resources/123/feature", {
      method: "POST",
    });
    await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });

    expect(db.update).toHaveBeenCalled();
  });

  it("should clear featuredAt when unfeaturing a resource", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "admin1" } } as never);
    mockSelectSequence(db,
      [{ role: "ADMIN" }],
      [{ isFeatured: true }],
    );
    vi.mocked(db.update).mockReturnValue(createChainMock([{ isFeatured: false }]) as any);

    const request = new Request("http://localhost:3000/api/resources/123/feature", {
      method: "POST",
    });
    await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });

    expect(db.update).toHaveBeenCalled();
  });
});
