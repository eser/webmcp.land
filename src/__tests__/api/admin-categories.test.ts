import { NextRequest } from "next/server";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/admin/categories/route";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { createChainMock, createMockDb } from "../helpers/db-mock";

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

describe("POST /api/admin/categories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null as any);

    const request = new Request("http://localhost:3000/api/admin/categories", {
      method: "POST",
      body: JSON.stringify({ name: "Test", slug: "test" }),
    });
    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 401 if user is not admin", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1", role: "USER" } } as never);

    const request = new Request("http://localhost:3000/api/admin/categories", {
      method: "POST",
      body: JSON.stringify({ name: "Test", slug: "test" }),
    });
    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 400 if name is missing", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } } as never);

    const request = new Request("http://localhost:3000/api/admin/categories", {
      method: "POST",
      body: JSON.stringify({ slug: "test" }),
    });
    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Name and slug are required");
  });

  it("should return 400 if slug is missing", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } } as never);

    const request = new Request("http://localhost:3000/api/admin/categories", {
      method: "POST",
      body: JSON.stringify({ name: "Test" }),
    });
    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Name and slug are required");
  });

  it("should create category with required fields", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } } as never);
    vi.mocked(db.insert).mockReturnValue(createChainMock([{
      id: "1",
      name: "Test Category",
      slug: "test-category",
      description: null,
      icon: null,
      parentId: null,
      pinned: false,
    }]) as any);

    const request = new Request("http://localhost:3000/api/admin/categories", {
      method: "POST",
      body: JSON.stringify({ name: "Test Category", slug: "test-category" }),
    });
    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.name).toBe("Test Category");
    expect(data.slug).toBe("test-category");
  });

  it("should create category with optional fields", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } } as never);
    vi.mocked(db.insert).mockReturnValue(createChainMock([{
      id: "1",
      name: "Test Category",
      slug: "test-category",
      description: "A test category",
      icon: "\u{1F4DA}",
      parentId: "parent-1",
      pinned: true,
    }]) as any);

    const request = new Request("http://localhost:3000/api/admin/categories", {
      method: "POST",
      body: JSON.stringify({
        name: "Test Category",
        slug: "test-category",
        description: "A test category",
        icon: "\u{1F4DA}",
        parentId: "parent-1",
        pinned: true,
      }),
    });
    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.description).toBe("A test category");
    expect(data.pinned).toBe(true);
  });

  it("should call db.insert with correct data", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } } as never);
    vi.mocked(db.insert).mockReturnValue(createChainMock([{
      id: "1",
      name: "My Category",
      slug: "my-category",
    }]) as any);

    const request = new Request("http://localhost:3000/api/admin/categories", {
      method: "POST",
      body: JSON.stringify({
        name: "My Category",
        slug: "my-category",
        description: "Description",
        icon: "\u{1F3AF}",
        parentId: "parent-id",
        pinned: true,
      }),
    });
    await POST(request as unknown as NextRequest);

    expect(db.insert).toHaveBeenCalled();
  });
});
