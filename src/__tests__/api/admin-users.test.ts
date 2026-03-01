import { NextRequest } from "next/server";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/admin/users/route";
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


describe("GET /api/admin/users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null as any);

    const request = new Request("http://localhost:3000/api/admin/users");
    const response = await GET(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("unauthorized");
  });

  it("should return 403 if user is not admin", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1", role: "USER" } } as never);

    const request = new Request("http://localhost:3000/api/admin/users");
    const response = await GET(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("forbidden");
  });

  it("should return users with pagination for admin", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } } as never);
    // The route builds promptsCountSq subquery that calls db.select(),
    // then Promise.all has two more db.select() calls (main query + count query).
    // Total: 3 db.select() calls.
    mockSelectSequence(db,
      [],  // promptsCountSq subquery builder
      [{
        id: "1",
        email: "test@example.com",
        username: "testuser",
        name: "Test User",
        avatar: null,
        role: "USER",
        verified: true,
        flagged: false,
        flaggedAt: null,
        flaggedReason: null,
        dailyGenerationLimit: 10,
        generationCreditsRemaining: 5,
        createdAt: new Date(),
        _count: { prompts: 3 },
      }],
      [{ total: 1 }],
    );

    const request = new Request("http://localhost:3000/api/admin/users");
    const response = await GET(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.users).toHaveLength(1);
    expect(data.pagination.total).toBe(1);
  });

  it("should call select for search filter", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } } as never);
    mockSelectSequence(db, [], [], [{ total: 0 }]);

    const request = new Request("http://localhost:3000/api/admin/users?search=john");
    await GET(request as unknown as NextRequest);

    expect(db.select).toHaveBeenCalled();
  });

  it("should call select for admin filter", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } } as never);
    mockSelectSequence(db, [], [], [{ total: 0 }]);

    const request = new Request("http://localhost:3000/api/admin/users?filter=admin");
    await GET(request as unknown as NextRequest);

    expect(db.select).toHaveBeenCalled();
  });

  it("should call select for verified filter", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } } as never);
    mockSelectSequence(db, [], [], [{ total: 0 }]);

    const request = new Request("http://localhost:3000/api/admin/users?filter=verified");
    await GET(request as unknown as NextRequest);

    expect(db.select).toHaveBeenCalled();
  });

  it("should call select for unverified filter", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } } as never);
    mockSelectSequence(db, [], [], [{ total: 0 }]);

    const request = new Request("http://localhost:3000/api/admin/users?filter=unverified");
    await GET(request as unknown as NextRequest);

    expect(db.select).toHaveBeenCalled();
  });

  it("should call select for flagged filter", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } } as never);
    mockSelectSequence(db, [], [], [{ total: 0 }]);

    const request = new Request("http://localhost:3000/api/admin/users?filter=flagged");
    await GET(request as unknown as NextRequest);

    expect(db.select).toHaveBeenCalled();
  });

  it("should handle pagination", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } } as never);
    // 1 subquery builder + main query + count query = 3 calls
    mockSelectSequence(db, [], [], [{ total: 100 }]);

    const request = new Request("http://localhost:3000/api/admin/users?page=3&limit=25");
    const response = await GET(request as unknown as NextRequest);
    const data = await response.json();

    expect(data.pagination.page).toBe(3);
    expect(data.pagination.totalPages).toBe(4);
  });

  it("should sort by username ascending", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } } as never);
    mockSelectSequence(db, [], [], [{ total: 0 }]);

    const request = new Request("http://localhost:3000/api/admin/users?sortBy=username&sortOrder=asc");
    await GET(request as unknown as NextRequest);

    expect(db.select).toHaveBeenCalled();
  });
});
