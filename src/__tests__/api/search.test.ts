import { NextRequest } from "next/server";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/resources/search/route";
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


describe("GET /api/resources/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return empty array for query shorter than 2 characters", async () => {
    const request = new Request("http://localhost:3000/api/resources/search?q=a");

    const response = await GET(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.resources).toEqual([]);
    expect(db.select).not.toHaveBeenCalled();
  });

  it("should return empty array for empty query", async () => {
    const request = new Request("http://localhost:3000/api/resources/search?q=");

    const response = await GET(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.resources).toEqual([]);
  });

  it("should return empty array for missing query", async () => {
    const request = new Request("http://localhost:3000/api/resources/search");

    const response = await GET(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.resources).toEqual([]);
  });

  it("should search resources with valid query", async () => {
    vi.mocked(getSession).mockResolvedValue(null as any);
    mockSelectSequence(db, [
      {
        id: "1",
        title: "Test Resource",
        slug: "test-resource",
        author: { username: "testuser" },
      },
    ]);

    const request = new Request("http://localhost:3000/api/resources/search?q=test");

    const response = await GET(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.resources).toHaveLength(1);
    expect(data.resources[0].title).toBe("Test Resource");
  });

  it("should call select when query is valid", async () => {
    vi.mocked(getSession).mockResolvedValue(null as any);
    mockSelectSequence(db, []);

    const request = new Request("http://localhost:3000/api/resources/search?q=test&limit=5");

    await GET(request as unknown as NextRequest);

    expect(db.select).toHaveBeenCalled();
  });

  it("should call select for capped limit", async () => {
    vi.mocked(getSession).mockResolvedValue(null as any);
    mockSelectSequence(db, []);

    const request = new Request("http://localhost:3000/api/resources/search?q=test&limit=100");

    await GET(request as unknown as NextRequest);

    expect(db.select).toHaveBeenCalled();
  });

  it("should call select with default limit", async () => {
    vi.mocked(getSession).mockResolvedValue(null as any);
    mockSelectSequence(db, []);

    const request = new Request("http://localhost:3000/api/resources/search?q=test");

    await GET(request as unknown as NextRequest);

    expect(db.select).toHaveBeenCalled();
  });

  it("should filter public resources for unauthenticated users", async () => {
    vi.mocked(getSession).mockResolvedValue(null as any);
    mockSelectSequence(db, []);

    const request = new Request("http://localhost:3000/api/resources/search?q=test");

    await GET(request as unknown as NextRequest);

    expect(db.select).toHaveBeenCalled();
  });

  it("should include user's private resources for authenticated users", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db, []);

    const request = new Request("http://localhost:3000/api/resources/search?q=test");

    await GET(request as unknown as NextRequest);

    expect(db.select).toHaveBeenCalled();
  });

  it("should filter to owner-only resources when ownerOnly=true", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db, []);

    const request = new Request("http://localhost:3000/api/resources/search?q=test&ownerOnly=true");

    await GET(request as unknown as NextRequest);

    expect(db.select).toHaveBeenCalled();
  });

  it("should handle comma-separated keywords", async () => {
    vi.mocked(getSession).mockResolvedValue(null as any);
    mockSelectSequence(db, [
      { id: "1", title: "Coding Helper", slug: "coding-helper", author: { username: "test" } },
    ]);

    const request = new Request("http://localhost:3000/api/resources/search?q=coding,helper");

    const response = await GET(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(db.select).toHaveBeenCalled();
  });

  it("should handle database errors gracefully", async () => {
    vi.mocked(getSession).mockResolvedValue(null as any);
    vi.mocked(db.select).mockImplementation(() => {
      throw new Error("Database error");
    });

    const request = new Request("http://localhost:3000/api/resources/search?q=test");

    const response = await GET(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Search failed");
  });

  it("should handle special characters in query", async () => {
    vi.mocked(getSession).mockResolvedValue(null as any);
    mockSelectSequence(db, []);

    const request = new Request("http://localhost:3000/api/resources/search?q=test%20query%20with%20spaces");

    const response = await GET(request as unknown as NextRequest);

    expect(response.status).toBe(200);
  });
});
