import { NextRequest } from "next/server";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/resources/[id]/connections/route";
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


describe("GET /api/resources/[id]/connections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 404 for non-existent resource", async () => {
    mockSelectSequence(db, []);

    const request = new Request("http://localhost:3000/api/resources/123/connections");
    const response = await GET(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Resource not found");
  });

  it("should return empty connections for resource with none", async () => {
    mockSelectSequence(db, 
      [{ id: "123", isPrivate: false, authorId: "user1" }],
      [],  // outgoing
      [],  // incoming
    );
    vi.mocked(getSession).mockResolvedValue(null as any);

    const request = new Request("http://localhost:3000/api/resources/123/connections");
    const response = await GET(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.outgoing).toEqual([]);
    expect(data.incoming).toEqual([]);
  });

  it("should return outgoing and incoming connections", async () => {
    mockSelectSequence(db, 
      [{ id: "123", isPrivate: false, authorId: "user1" }],
      [{
        id: "conn1",
        label: "next",
        order: 0,
        target: { id: "target1", title: "Target Prompt", slug: "target", isPrivate: false, authorId: "user1" },
      }],
      [{
        id: "conn2",
        label: "previous",
        order: 0,
        source: { id: "source1", title: "Source Prompt", slug: "source", isPrivate: false, authorId: "user2" },
      }],
    );
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);

    const request = new Request("http://localhost:3000/api/resources/123/connections");
    const response = await GET(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.outgoing).toHaveLength(1);
    expect(data.incoming).toHaveLength(1);
  });

  it("should filter out private resources the user cannot see", async () => {
    mockSelectSequence(db, 
      [{ id: "123", isPrivate: false, authorId: "user1" }],
      [{
        id: "conn1",
        label: "next",
        target: { id: "target1", title: "Private", slug: "private", isPrivate: true, authorId: "other-user" },
      }],
      [],
    );
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);

    const request = new Request("http://localhost:3000/api/resources/123/connections");
    const response = await GET(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(data.outgoing).toHaveLength(0);
  });

  it("should show private resources owned by the user", async () => {
    mockSelectSequence(db, 
      [{ id: "123", isPrivate: false, authorId: "user1" }],
      [{
        id: "conn1",
        label: "next",
        target: { id: "target1", title: "My Private", slug: "private", isPrivate: true, authorId: "user1" },
      }],
      [],
    );
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);

    const request = new Request("http://localhost:3000/api/resources/123/connections");
    const response = await GET(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(data.outgoing).toHaveLength(1);
  });
});

describe("POST /api/resources/[id]/connections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null as any);

    const request = new Request("http://localhost:3000/api/resources/123/connections", {
      method: "POST",
      body: JSON.stringify({ targetId: "456", label: "next" }),
    });
    const response = await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 404 if source resource not found", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db, []);

    const request = new Request("http://localhost:3000/api/resources/123/connections", {
      method: "POST",
      body: JSON.stringify({ targetId: "456", label: "next" }),
    });
    const response = await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Source resource not found");
  });

  it("should return 403 if user does not own source resource", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1", role: "USER" } } as never);
    mockSelectSequence(db, [{ authorId: "other-user" }]);

    const request = new Request("http://localhost:3000/api/resources/123/connections", {
      method: "POST",
      body: JSON.stringify({ targetId: "456", label: "next" }),
    });
    const response = await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("You can only add connections to your own resources");
  });

  it("should return 404 if target resource not found", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1", role: "USER" } } as never);
    mockSelectSequence(db, 
      [{ authorId: "user1" }],  // Source
      [],                         // Target not found
    );

    const request = new Request("http://localhost:3000/api/resources/123/connections", {
      method: "POST",
      body: JSON.stringify({ targetId: "456", label: "next" }),
    });
    const response = await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Target resource not found");
  });

  it("should return 403 if user does not own target resource", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1", role: "USER" } } as never);
    mockSelectSequence(db, 
      [{ authorId: "user1" }],                    // Source
      [{ id: "456", title: "T", authorId: "other-user" }],  // Target
    );

    const request = new Request("http://localhost:3000/api/resources/123/connections", {
      method: "POST",
      body: JSON.stringify({ targetId: "456", label: "next" }),
    });
    const response = await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("You can only connect to your own resources");
  });

  it("should return 400 for self-connection", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db, 
      [{ authorId: "user1" }],
      [{ id: "123", title: "T", authorId: "user1" }],
    );

    const request = new Request("http://localhost:3000/api/resources/123/connections", {
      method: "POST",
      body: JSON.stringify({ targetId: "123", label: "next" }),
    });
    const response = await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Cannot connect a resource to itself");
  });

  it("should return 400 if connection already exists", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db, 
      [{ authorId: "user1" }],
      [{ id: "456", title: "T", authorId: "user1" }],
      [{ id: "existing" }],  // existing connection
    );

    const request = new Request("http://localhost:3000/api/resources/123/connections", {
      method: "POST",
      body: JSON.stringify({ targetId: "456", label: "next" }),
    });
    const response = await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Connection already exists");
  });

  it("should create connection successfully", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db, 
      [{ authorId: "user1" }],                      // source resource
      [{ id: "456", title: "Target", authorId: "user1" }],  // target resource
      [],                                              // no existing connection
      [],                                              // no last connection (for order)
      [{ slug: "target" }],                           // slug lookup
    );
    vi.mocked(db.insert).mockReturnValue(createChainMock([{
      id: "conn1",
      sourceId: "123",
      targetId: "456",
      label: "next",
      order: 0,
    }]) as any);

    const request = new Request("http://localhost:3000/api/resources/123/connections", {
      method: "POST",
      body: JSON.stringify({ targetId: "456", label: "next" }),
    });
    const response = await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.label).toBe("next");
  });

  it("should return 400 for missing required fields", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);

    const request = new Request("http://localhost:3000/api/resources/123/connections", {
      method: "POST",
      body: JSON.stringify({ targetId: "456" }), // Missing label
    });
    const response = await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });

    expect(response.status).toBe(400);
  });

  it("should allow admin to create connections for any resource", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "admin1", role: "ADMIN" } } as never);
    mockSelectSequence(db, 
      [{ authorId: "other-user" }],
      [{ id: "456", title: "T", authorId: "another-user" }],
      [],  // no existing connection
      [],  // no last connection
      [{ slug: "target" }],
    );
    vi.mocked(db.insert).mockReturnValue(createChainMock([{
      id: "conn1",
      sourceId: "123",
      targetId: "456",
      label: "admin-link",
      order: 0,
    }]) as any);

    const request = new Request("http://localhost:3000/api/resources/123/connections", {
      method: "POST",
      body: JSON.stringify({ targetId: "456", label: "admin-link" }),
    });
    const response = await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });

    expect(response.status).toBe(201);
  });
});
