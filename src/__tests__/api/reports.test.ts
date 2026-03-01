import { NextRequest } from "next/server";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/reports/route";
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


describe("POST /api/reports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null as any);

    const request = new Request("http://localhost:3000/api/reports", {
      method: "POST",
      body: JSON.stringify({ promptId: "123", reason: "SPAM" }),
    });

    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 400 for invalid reason", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);

    const request = new Request("http://localhost:3000/api/reports", {
      method: "POST",
      body: JSON.stringify({ promptId: "123", reason: "INVALID_REASON" }),
    });

    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid request data");
  });

  it("should return 400 for missing promptId", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);

    const request = new Request("http://localhost:3000/api/reports", {
      method: "POST",
      body: JSON.stringify({ reason: "SPAM" }),
    });

    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid request data");
  });

  it("should return 404 if prompt not found", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db, []);

    const request = new Request("http://localhost:3000/api/reports", {
      method: "POST",
      body: JSON.stringify({ promptId: "nonexistent", reason: "SPAM" }),
    });

    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Prompt not found");
  });

  it("should return 400 when reporting own prompt (non-relist)", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db, [{
      id: "123",
      authorId: "user1", // Same as reporter
    }]);

    const request = new Request("http://localhost:3000/api/reports", {
      method: "POST",
      body: JSON.stringify({ promptId: "123", reason: "SPAM" }),
    });

    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("You cannot report your own prompt");
  });

  it("should allow relist request on own prompt", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db,
      [{ id: "123", authorId: "user1" }],
      [],  // no existing report
    );
    vi.mocked(db.insert).mockReturnValue(createChainMock([]) as any);

    const request = new Request("http://localhost:3000/api/reports", {
      method: "POST",
      body: JSON.stringify({ promptId: "123", reason: "RELIST_REQUEST" }),
    });

    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("should return 400 if already reported", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db,
      [{ id: "123", authorId: "other-user" }],
      [{ id: "existing-report" }],
    );

    const request = new Request("http://localhost:3000/api/reports", {
      method: "POST",
      body: JSON.stringify({ promptId: "123", reason: "SPAM" }),
    });

    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("You have already reported this prompt");
  });

  it("should create report successfully", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db,
      [{ id: "123", authorId: "other-user" }],
      [],  // no existing report
    );
    vi.mocked(db.insert).mockReturnValue(createChainMock([]) as any);

    const request = new Request("http://localhost:3000/api/reports", {
      method: "POST",
      body: JSON.stringify({
        promptId: "123",
        reason: "SPAM",
        details: "This is spam content",
      }),
    });

    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(db.insert).toHaveBeenCalled();
  });

  it("should accept all valid reason types", async () => {
    const reasons = ["SPAM", "INAPPROPRIATE", "COPYRIGHT", "MISLEADING", "RELIST_REQUEST", "OTHER"];

    for (const reason of reasons) {
      vi.clearAllMocks();
      vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
      mockSelectSequence(db,
        [{
          id: "123",
          authorId: reason === "RELIST_REQUEST" ? "user1" : "other-user",
        }],
        [],
      );
      vi.mocked(db.insert).mockReturnValue(createChainMock([]) as any);

      const request = new Request("http://localhost:3000/api/reports", {
        method: "POST",
        body: JSON.stringify({ promptId: "123", reason }),
      });

      const response = await POST(request as unknown as NextRequest);

      expect(response.status).toBe(200);
    }
  });

  it("should handle null details", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db,
      [{ id: "123", authorId: "other-user" }],
      [],
    );
    vi.mocked(db.insert).mockReturnValue(createChainMock([]) as any);

    const request = new Request("http://localhost:3000/api/reports", {
      method: "POST",
      body: JSON.stringify({ promptId: "123", reason: "SPAM" }),
    });

    await POST(request as unknown as NextRequest);

    expect(db.insert).toHaveBeenCalled();
  });

  it("should check for pending reports only", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    mockSelectSequence(db,
      [{ id: "123", authorId: "other-user" }],
      [],
    );
    vi.mocked(db.insert).mockReturnValue(createChainMock([]) as any);

    const request = new Request("http://localhost:3000/api/reports", {
      method: "POST",
      body: JSON.stringify({ promptId: "123", reason: "SPAM" }),
    });

    await POST(request as unknown as NextRequest);

    // Verify select was called for both prompt lookup and existing report check
    expect(db.select).toHaveBeenCalledTimes(2);
  });

  it("should handle database errors gracefully", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    vi.mocked(db.select).mockImplementation(() => {
      throw new Error("Database error");
    });

    const request = new Request("http://localhost:3000/api/reports", {
      method: "POST",
      body: JSON.stringify({ promptId: "123", reason: "SPAM" }),
    });

    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Internal server error");
  });
});
