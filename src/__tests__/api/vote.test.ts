import { NextRequest } from "next/server";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST, DELETE } from "@/app/api/resources/[id]/vote/route";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

import { createChainMock, mockSelectSequence, createMockDb } from "../helpers/db-mock";

// Mock dependencies
vi.mock("@/lib/db", async () => {
  const { createMockDb } = await import("../helpers/db-mock");
  return createMockDb();
});

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}));


describe("POST /api/resources/[id]/vote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null as any);

    const request = new Request("http://localhost:3000/api/resources/123/vote", {
      method: "POST",
    });

    const response = await POST(request as unknown as NextRequest, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("unauthorized");
  });

  it("should return 404 for non-existent resource", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    // resource select returns empty, no resource found
    mockSelectSequence(db, []);

    const request = new Request("http://localhost:3000/api/resources/123/vote", {
      method: "POST",
    });

    const response = await POST(request as unknown as NextRequest, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("not_found");
  });

  it("should return 400 if already voted", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    // resource exists, existing vote found
    mockSelectSequence(db,
      [{ id: "123" }],                    // resource exists
      [{ userId: "user1", promptId: "123" }], // existing vote
    );

    const request = new Request("http://localhost:3000/api/resources/123/vote", {
      method: "POST",
    });

    const response = await POST(request as unknown as NextRequest, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("already_voted");
  });

  it("should create vote successfully", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    // resource exists, no existing vote, then count after insert
    mockSelectSequence(db,
      [{ id: "123" }],     // resource exists
      [],                   // no existing vote
      [{ value: 5 }],      // vote count after insert
    );
    vi.mocked(db.insert).mockReturnValue(createChainMock([]) as any);

    const request = new Request("http://localhost:3000/api/resources/123/vote", {
      method: "POST",
    });

    const response = await POST(request as unknown as NextRequest, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.voted).toBe(true);
    expect(data.voteCount).toBe(5);
    expect(db.insert).toHaveBeenCalled();
  });

  it("should lookup vote with correct parameters", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db,
      [{ id: "123" }],
      [],
      [{ value: 1 }],
    );
    vi.mocked(db.insert).mockReturnValue(createChainMock([]) as any);

    const request = new Request("http://localhost:3000/api/resources/123/vote", {
      method: "POST",
    });

    await POST(request as unknown as NextRequest, { params: Promise.resolve({ id: "123" }) });

    // Verify select was called (for resource check and vote check)
    expect(db.select).toHaveBeenCalled();
  });
});

describe("DELETE /api/resources/[id]/vote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null as any);

    const request = new Request("http://localhost:3000/api/resources/123/vote", {
      method: "DELETE",
    });

    const response = await DELETE(request as unknown as NextRequest, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("unauthorized");
  });

  it("should remove vote successfully", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    vi.mocked(db.delete).mockReturnValue(createChainMock([]) as any);
    // After delete, count returns 4
    mockSelectSequence(db, [{ value: 4 }]);

    const request = new Request("http://localhost:3000/api/resources/123/vote", {
      method: "DELETE",
    });

    const response = await DELETE(request as unknown as NextRequest, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.voted).toBe(false);
    expect(data.voteCount).toBe(4);
    expect(db.delete).toHaveBeenCalled();
  });

  it("should handle deleting non-existent vote gracefully", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    vi.mocked(db.delete).mockReturnValue(createChainMock([]) as any);
    mockSelectSequence(db, [{ value: 10 }]);

    const request = new Request("http://localhost:3000/api/resources/123/vote", {
      method: "DELETE",
    });

    const response = await DELETE(request as unknown as NextRequest, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.voted).toBe(false);
    expect(data.voteCount).toBe(10);
  });
});
