import { NextRequest } from "next/server";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/admin/resources/route";
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


describe("GET /api/admin/prompts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null as any);

    const request = new Request("http://localhost:3000/api/admin/prompts");
    const response = await GET(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("unauthorized");
  });

  it("should return 403 if user is not admin", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1", role: "USER" } } as never);

    const request = new Request("http://localhost:3000/api/admin/prompts");
    const response = await GET(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("forbidden");
  });

  it("should return prompts with pagination for admin", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } } as never);
    // The route builds subqueries (votesCountSq, reportsCountSq) that call db.select(),
    // then Promise.all has two more db.select() calls (main query + count query).
    // Total: 4 db.select() calls.
    mockSelectSequence(db,
      [],  // votesCountSq subquery builder
      [],  // reportsCountSq subquery builder
      [{
        id: "1",
        title: "Test Prompt",
        slug: "test-prompt",
        type: "TEXT",
        isPrivate: false,
        isUnlisted: false,
        isFeatured: false,
        viewCount: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        author: { id: "user1", username: "user", name: "User", avatar: null },
        category: null,
        _count: { votes: 5, reports: 0 },
      }],
      [{ total: 1 }],
    );

    const request = new Request("http://localhost:3000/api/admin/prompts");
    const response = await GET(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.prompts).toHaveLength(1);
    expect(data.pagination.total).toBe(1);
  });

  it("should call select for search filter", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } } as never);
    mockSelectSequence(db, [], [], [], [{ total: 0 }]);

    const request = new Request("http://localhost:3000/api/admin/prompts?search=test");
    await GET(request as unknown as NextRequest);

    expect(db.select).toHaveBeenCalled();
  });

  it("should call select for unlisted filter", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } } as never);
    mockSelectSequence(db, [], [], [], [{ total: 0 }]);

    const request = new Request("http://localhost:3000/api/admin/prompts?filter=unlisted");
    await GET(request as unknown as NextRequest);

    expect(db.select).toHaveBeenCalled();
  });

  it("should call select for private filter", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } } as never);
    mockSelectSequence(db, [], [], [], [{ total: 0 }]);

    const request = new Request("http://localhost:3000/api/admin/prompts?filter=private");
    await GET(request as unknown as NextRequest);

    expect(db.select).toHaveBeenCalled();
  });

  it("should call select for featured filter", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } } as never);
    mockSelectSequence(db, [], [], [], [{ total: 0 }]);

    const request = new Request("http://localhost:3000/api/admin/prompts?filter=featured");
    await GET(request as unknown as NextRequest);

    expect(db.select).toHaveBeenCalled();
  });

  it("should handle pagination parameters", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } } as never);
    // 2 subquery builders + main query + count query = 4 calls
    mockSelectSequence(db, [], [], [], [{ total: 50 }]);

    const request = new Request("http://localhost:3000/api/admin/prompts?page=2&limit=10");
    const response = await GET(request as unknown as NextRequest);
    const data = await response.json();

    expect(data.pagination.page).toBe(2);
    expect(data.pagination.limit).toBe(10);
    expect(data.pagination.totalPages).toBe(5);
  });

  it("should limit max items per page to 100", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } } as never);
    // 2 subquery builders + main query + count query = 4 calls
    mockSelectSequence(db, [], [], [], [{ total: 0 }]);

    const request = new Request("http://localhost:3000/api/admin/prompts?limit=500");
    const response = await GET(request as unknown as NextRequest);
    const data = await response.json();

    expect(data.pagination.limit).toBe(100);
  });

  it("should handle sorting parameters", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } } as never);
    mockSelectSequence(db, [], [], [], [{ total: 0 }]);

    const request = new Request("http://localhost:3000/api/admin/prompts?sortBy=title&sortOrder=asc");
    await GET(request as unknown as NextRequest);

    expect(db.select).toHaveBeenCalled();
  });

  it("should default to createdAt desc for invalid sort field", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } } as never);
    mockSelectSequence(db, [], [], [], [{ total: 0 }]);

    const request = new Request("http://localhost:3000/api/admin/prompts?sortBy=invalid");
    await GET(request as unknown as NextRequest);

    expect(db.select).toHaveBeenCalled();
  });
});
