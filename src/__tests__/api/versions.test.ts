import { NextRequest } from "next/server";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/resources/[id]/versions/route";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

import { createChainMock, mockSelectSequence } from "../helpers/db-mock";

vi.mock("@/lib/db", async () => {
  const { createChainMock } = await import("../helpers/db-mock");
  return {
    db: {
      select: vi.fn().mockReturnValue(createChainMock([])),
      insert: vi.fn().mockReturnValue(createChainMock([])),
      update: vi.fn().mockReturnValue(createChainMock([])),
      delete: vi.fn().mockReturnValue(createChainMock([])),
      execute: vi.fn().mockResolvedValue({ rows: [] }),
      transaction: vi.fn().mockImplementation(async (fn: Function) => fn({
        select: vi.fn().mockReturnValue(createChainMock()),
        insert: vi.fn().mockReturnValue(createChainMock()),
        update: vi.fn().mockReturnValue(createChainMock()),
        delete: vi.fn().mockReturnValue(createChainMock()),
      })),
      query: {},
    },
  };
});

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}));


describe("GET /api/resources/[id]/versions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return empty array for resource with no versions", async () => {
    mockSelectSequence(db, []);

    const request = new Request("http://localhost:3000/api/resources/123/versions");
    const response = await GET(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
  });

  it("should return versions ordered by version desc", async () => {
    mockSelectSequence(db, [
      {
        id: "v3",
        version: 3,
        content: "Version 3 content",
        changeNote: "Version 3",
        createdAt: new Date(),
        author: { name: "User", username: "user" },
      },
      {
        id: "v2",
        version: 2,
        content: "Version 2 content",
        changeNote: "Version 2",
        createdAt: new Date(),
        author: { name: "User", username: "user" },
      },
      {
        id: "v1",
        version: 1,
        content: "Version 1 content",
        changeNote: "Version 1",
        createdAt: new Date(),
        author: { name: "User", username: "user" },
      },
    ]);

    const request = new Request("http://localhost:3000/api/resources/123/versions");
    const response = await GET(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(3);
    expect(data[0].version).toBe(3);
    expect(data[1].version).toBe(2);
    expect(data[2].version).toBe(1);
  });

  it("should include author info in response", async () => {
    mockSelectSequence(db, [
      {
        id: "v1",
        version: 1,
        content: "Content",
        changeNote: "Initial",
        createdAt: new Date(),
        author: { name: "Test User", username: "testuser" },
      },
    ]);

    const request = new Request("http://localhost:3000/api/resources/123/versions");
    const response = await GET(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data[0].author.name).toBe("Test User");
    expect(data[0].author.username).toBe("testuser");
  });

  it("should call select to fetch versions", async () => {
    mockSelectSequence(db, []);

    const request = new Request("http://localhost:3000/api/resources/123/versions");
    await GET(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });

    expect(db.select).toHaveBeenCalled();
  });
});

describe("POST /api/resources/[id]/versions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null as any);

    const request = new Request("http://localhost:3000/api/resources/123/versions", {
      method: "POST",
      body: JSON.stringify({ content: "New content" }),
    });
    const response = await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("unauthorized");
  });

  it("should return 404 for non-existent resource", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db, []);

    const request = new Request("http://localhost:3000/api/resources/123/versions", {
      method: "POST",
      body: JSON.stringify({ content: "New content" }),
    });
    const response = await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("not_found");
  });

  it("should return 403 if user does not own the resource", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db, [{
      authorId: "other-user",
      content: "Original content",
    }]);

    const request = new Request("http://localhost:3000/api/resources/123/versions", {
      method: "POST",
      body: JSON.stringify({ content: "New content" }),
    });
    const response = await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("forbidden");
  });

  it("should create version with empty description", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db,
      [{ authorId: "user1", description: "Original" }],
      [],  // no previous versions
    );

    const request = new Request("http://localhost:3000/api/resources/123/versions", {
      method: "POST",
      body: JSON.stringify({ description: "" }),
    });
    const response = await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });

    expect(response.status).toBe(201);
  });

  it("should create version with no fields", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db,
      [{ authorId: "user1", description: "Original" }],
      [],  // no previous versions
    );

    const request = new Request("http://localhost:3000/api/resources/123/versions", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const response = await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });

    expect(response.status).toBe(201);
  });

  it("should create version even with same description", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db,
      [{ authorId: "user1", description: "Same content" }],
      [],  // no previous versions
    );

    const request = new Request("http://localhost:3000/api/resources/123/versions", {
      method: "POST",
      body: JSON.stringify({ description: "Same content" }),
    });
    const response = await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });

    expect(response.status).toBe(201);
  });

  it("should create version with incrementing version number", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db,
      [{ authorId: "user1", content: "Original content" }],
      [{ version: 2 }],  // latest version
    );
    vi.mocked(db.transaction).mockImplementation(async (fn: Function) => {
      const tx = {
        insert: vi.fn().mockReturnValue(createChainMock([{
          id: "v3",
          version: 3,
          content: "New content",
          changeNote: "Version 3",
          createdAt: new Date(),
        }])),
        update: vi.fn().mockReturnValue(createChainMock([])),
        select: vi.fn().mockReturnValue(createChainMock([{ name: "User", username: "user" }])),
      };
      return fn(tx);
    });

    const request = new Request("http://localhost:3000/api/resources/123/versions", {
      method: "POST",
      body: JSON.stringify({ content: "New content" }),
    });
    const response = await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(201);
  });

  it("should use default changeNote when not provided", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db,
      [{ authorId: "user1", content: "Original content" }],
      [],  // no previous versions
    );
    vi.mocked(db.transaction).mockImplementation(async (fn: Function) => {
      const tx = {
        insert: vi.fn().mockReturnValue(createChainMock([{
          id: "v1",
          version: 1,
          content: "New content",
          changeNote: "Version 1",
          createdAt: new Date(),
        }])),
        update: vi.fn().mockReturnValue(createChainMock([])),
        select: vi.fn().mockReturnValue(createChainMock([{ name: "User", username: "user" }])),
      };
      return fn(tx);
    });

    const request = new Request("http://localhost:3000/api/resources/123/versions", {
      method: "POST",
      body: JSON.stringify({ content: "New content" }),
    });
    const response = await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.changeNote).toBe("Version 1");
  });

  it("should use custom changeNote when provided", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db,
      [{ authorId: "user1", content: "Original content" }],
      [],
    );
    vi.mocked(db.transaction).mockImplementation(async (fn: Function) => {
      const tx = {
        insert: vi.fn().mockReturnValue(createChainMock([{
          id: "v1",
          version: 1,
          content: "New content",
          changeNote: "Fixed typo in instructions",
          createdAt: new Date(),
        }])),
        update: vi.fn().mockReturnValue(createChainMock([])),
        select: vi.fn().mockReturnValue(createChainMock([{ name: "User", username: "user" }])),
      };
      return fn(tx);
    });

    const request = new Request("http://localhost:3000/api/resources/123/versions", {
      method: "POST",
      body: JSON.stringify({
        content: "New content",
        changeNote: "Fixed typo in instructions",
      }),
    });
    const response = await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.changeNote).toBe("Fixed typo in instructions");
  });

  it("should start at version 1 when no previous versions exist", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db,
      [{ authorId: "user1", content: "Original content" }],
      [],
    );
    vi.mocked(db.transaction).mockImplementation(async (fn: Function) => {
      const tx = {
        insert: vi.fn().mockReturnValue(createChainMock([{
          id: "v1",
          version: 1,
          content: "New content",
          changeNote: "Version 1",
          createdAt: new Date(),
        }])),
        update: vi.fn().mockReturnValue(createChainMock([])),
        select: vi.fn().mockReturnValue(createChainMock([{ name: "User", username: "user" }])),
      };
      return fn(tx);
    });

    const request = new Request("http://localhost:3000/api/resources/123/versions", {
      method: "POST",
      body: JSON.stringify({ content: "New content" }),
    });
    const response = await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.version).toBe(1);
  });

  it("should return created version with author info", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db,
      [{ authorId: "user1", content: "Original content" }],
      [],
    );
    vi.mocked(db.transaction).mockImplementation(async (fn: Function) => {
      const tx = {
        insert: vi.fn().mockReturnValue(createChainMock([{
          id: "v1",
          version: 1,
          content: "New content",
          changeNote: "Version 1",
          createdAt: new Date(),
        }])),
        update: vi.fn().mockReturnValue(createChainMock([])),
        select: vi.fn().mockReturnValue(createChainMock([{ name: "Test User", username: "testuser" }])),
      };
      return fn(tx);
    });

    const request = new Request("http://localhost:3000/api/resources/123/versions", {
      method: "POST",
      body: JSON.stringify({ content: "New content" }),
    });
    const response = await POST(request as unknown as NextRequest, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.author.name).toBe("Test User");
    expect(data.author.username).toBe("testuser");
  });
});
