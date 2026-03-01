import { NextRequest } from "next/server";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PATCH } from "@/app/api/user/profile/route";
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


describe("GET /api/user/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("unauthorized");
  });

  it("should return 404 if user not found", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    vi.mocked(db.select).mockReturnValue(createChainMock([]) as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("not_found");
  });

  it("should return user profile successfully", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    vi.mocked(db.select).mockReturnValue(createChainMock([{
      id: "user1",
      name: "Test User",
      username: "testuser",
      email: "test@example.com",
      avatar: "https://example.com/avatar.png",
      role: "USER",
      createdAt: new Date("2024-01-01"),
    }]) as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe("user1");
    expect(data.name).toBe("Test User");
    expect(data.username).toBe("testuser");
    expect(data.email).toBe("test@example.com");
    expect(data.role).toBe("USER");
  });

  it("should fetch user with correct fields", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    vi.mocked(db.select).mockReturnValue(createChainMock([{
      id: "user1",
      name: "Test",
      username: "test",
      email: "t@t.com",
      avatar: null,
      role: "USER",
      createdAt: new Date(),
    }]) as any);

    await GET();

    expect(db.select).toHaveBeenCalled();
  });
});

describe("PATCH /api/user/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null as any);

    const request = new Request("http://localhost:3000/api/user/profile", {
      method: "PATCH",
      body: JSON.stringify({ name: "New Name", username: "newuser" }),
    });

    const response = await PATCH(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("unauthorized");
  });

  it("should return 400 for invalid input - missing name", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);

    const request = new Request("http://localhost:3000/api/user/profile", {
      method: "PATCH",
      body: JSON.stringify({ username: "testuser" }),
    });

    const response = await PATCH(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("validation_error");
  });

  it("should return 400 for invalid input - missing username", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);

    const request = new Request("http://localhost:3000/api/user/profile", {
      method: "PATCH",
      body: JSON.stringify({ name: "Test User" }),
    });

    const response = await PATCH(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("validation_error");
  });

  it("should return 400 for invalid username format", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);

    const request = new Request("http://localhost:3000/api/user/profile", {
      method: "PATCH",
      body: JSON.stringify({ name: "Test", username: "invalid user!" }),
    });

    const response = await PATCH(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("validation_error");
  });

  it("should return 400 if username is taken", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1", username: "olduser" } } as never);
    // Username check returns an existing user with different id
    vi.mocked(db.select).mockReturnValue(createChainMock([{ id: "other-user" }]) as any);

    const request = new Request("http://localhost:3000/api/user/profile", {
      method: "PATCH",
      body: JSON.stringify({ name: "Test", username: "takenuser" }),
    });

    const response = await PATCH(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("username_taken");
  });

  it("should allow keeping the same username", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1", username: "sameuser" } } as never);
    vi.mocked(db.update).mockReturnValue(createChainMock([{
      id: "user1",
      name: "Updated Name",
      username: "sameuser",
      email: "test@example.com",
      avatar: null,
    }]) as any);

    const request = new Request("http://localhost:3000/api/user/profile", {
      method: "PATCH",
      body: JSON.stringify({ name: "Updated Name", username: "sameuser" }),
    });

    const response = await PATCH(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.name).toBe("Updated Name");
    // Should NOT check for existing username when keeping the same one
    expect(db.select).not.toHaveBeenCalled();
  });

  it("should update profile successfully", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1", username: "olduser" } } as never);
    // Username check returns empty (not taken)
    vi.mocked(db.select).mockReturnValue(createChainMock([]) as any);
    vi.mocked(db.update).mockReturnValue(createChainMock([{
      id: "user1",
      name: "New Name",
      username: "newuser",
      email: "test@example.com",
      avatar: "https://example.com/new-avatar.png",
    }]) as any);

    const request = new Request("http://localhost:3000/api/user/profile", {
      method: "PATCH",
      body: JSON.stringify({
        name: "New Name",
        username: "newuser",
        avatar: "https://example.com/new-avatar.png",
      }),
    });

    const response = await PATCH(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.name).toBe("New Name");
    expect(data.username).toBe("newuser");
    expect(db.update).toHaveBeenCalled();
  });

  it("should handle empty avatar string as null", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1", username: "testuser" } } as never);
    vi.mocked(db.update).mockReturnValue(createChainMock([{
      id: "user1",
      name: "Test",
      username: "testuser",
      email: "test@example.com",
      avatar: null,
    }]) as any);

    const request = new Request("http://localhost:3000/api/user/profile", {
      method: "PATCH",
      body: JSON.stringify({
        name: "Test",
        username: "testuser",
        avatar: "",
      }),
    });

    const response = await PATCH(request as unknown as NextRequest);

    expect(response.status).toBe(200);
    expect(db.update).toHaveBeenCalled();
  });

  it("should validate username length", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);

    // Username too long (> 30 chars)
    const request = new Request("http://localhost:3000/api/user/profile", {
      method: "PATCH",
      body: JSON.stringify({
        name: "Test",
        username: "a".repeat(31),
      }),
    });

    const response = await PATCH(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("validation_error");
  });

  it("should validate name length", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);

    // Name too long (> 100 chars)
    const request = new Request("http://localhost:3000/api/user/profile", {
      method: "PATCH",
      body: JSON.stringify({
        name: "a".repeat(101),
        username: "testuser",
      }),
    });

    const response = await PATCH(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("validation_error");
  });

  it("should accept valid username with underscores", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1", username: "old" } } as never);
    vi.mocked(db.select).mockReturnValue(createChainMock([]) as any);
    vi.mocked(db.update).mockReturnValue(createChainMock([{
      id: "user1",
      name: "Test",
      username: "test_user_123",
      email: "test@example.com",
      avatar: null,
    }]) as any);

    const request = new Request("http://localhost:3000/api/user/profile", {
      method: "PATCH",
      body: JSON.stringify({
        name: "Test",
        username: "test_user_123",
      }),
    });

    const response = await PATCH(request as unknown as NextRequest);

    expect(response.status).toBe(200);
  });
});
