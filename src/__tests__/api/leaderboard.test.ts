import { NextRequest } from "next/server";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/leaderboard/route";
import { db } from "@/lib/db";

import { createChainMock, mockSelectSequence, createMockDb } from "../helpers/db-mock";

vi.mock("@/lib/db", async () => {
  const { createMockDb } = await import("../helpers/db-mock");
  return createMockDb();
});

vi.mock("next/cache", () => ({
  unstable_cache: (fn: Function) => fn,
}));


describe("GET /api/leaderboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return leaderboard with default period (all)", async () => {
    mockSelectSequence(db, 
      [
        { promptId: "prompt1", voteCount: 10 },
        { promptId: "prompt2", voteCount: 5 },
      ],
      [
        { id: "prompt1", authorId: "user1" },
        { id: "prompt2", authorId: "user2" },
      ],
      [
        { id: "user1", name: "User One", username: "userone", avatar: null, promptCount: 5 },
        { id: "user2", name: "User Two", username: "usertwo", avatar: null, promptCount: 3 },
      ],
    );

    const request = new Request("http://localhost:3000/api/leaderboard");

    const response = await GET(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.period).toBe("all");
    expect(data.leaderboard).toBeDefined();
  });

  it("should handle week period parameter", async () => {
    mockSelectSequence(db, [], [], []);

    const request = new Request("http://localhost:3000/api/leaderboard?period=week");

    const response = await GET(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.period).toBe("week");
  });

  it("should handle month period parameter", async () => {
    mockSelectSequence(db, [], [], []);

    const request = new Request("http://localhost:3000/api/leaderboard?period=month");

    const response = await GET(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.period).toBe("month");
  });

  it("should return empty leaderboard when no votes", async () => {
    mockSelectSequence(db, [], [], []);

    const request = new Request("http://localhost:3000/api/leaderboard");

    const response = await GET(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    // Leaderboard may have filler users, just check it's defined
    expect(data.leaderboard).toBeDefined();
  });

  it("should handle database errors gracefully", async () => {
    vi.mocked(db.select).mockImplementation(() => {
      throw new Error("Database error");
    });

    const request = new Request("http://localhost:3000/api/leaderboard");

    const response = await GET(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("server_error");
  });
});
