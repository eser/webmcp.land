import { NextRequest } from "next/server";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST, DELETE, PATCH } from "@/app/api/user/api-key/route";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { generateApiKey } from "@/lib/api-key";
import { createChainMock, createMockDb } from "../helpers/db-mock";

// Mock dependencies
vi.mock("@/lib/db", async () => {
  const { createMockDb } = await import("../helpers/db-mock");
  return createMockDb();
});

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/api-key", () => ({
  generateApiKey: vi.fn(),
}));

describe("GET /api/user/api-key", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 401 if session has no user id", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: {} } as never);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 404 if user not found", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    vi.mocked(db.select).mockReturnValue(createChainMock([]) as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("User not found");
  });

  it("should return hasApiKey: false when no key exists", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    vi.mocked(db.select).mockReturnValue(createChainMock([{
      apiKey: null,
      mcpPromptsPublicByDefault: true,
    }]) as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.hasApiKey).toBe(false);
    expect(data.apiKey).toBeNull();
  });

  it("should return hasApiKey: true and key when exists", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    vi.mocked(db.select).mockReturnValue(createChainMock([{
      apiKey: "pchat_abc123def456",
      mcpPromptsPublicByDefault: true,
    }]) as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.hasApiKey).toBe(true);
    expect(data.apiKey).toBe("pchat_abc123def456");
  });

  it("should return mcpPromptsPublicByDefault setting", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    vi.mocked(db.select).mockReturnValue(createChainMock([{
      apiKey: "pchat_abc123",
      mcpPromptsPublicByDefault: false,
    }]) as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.mcpPromptsPublicByDefault).toBe(false);
  });
});

describe("POST /api/user/api-key", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null as any);

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should generate and return new API key", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    vi.mocked(generateApiKey).mockReturnValue("pchat_newkey123");
    vi.mocked(db.update).mockReturnValue(createChainMock([]) as any);

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.apiKey).toBe("pchat_newkey123");
  });

  it("should update user with new key", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    vi.mocked(generateApiKey).mockReturnValue("pchat_newkey123");
    vi.mocked(db.update).mockReturnValue(createChainMock([]) as any);

    await POST();

    expect(db.update).toHaveBeenCalled();
  });

  it("should call generateApiKey function", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    vi.mocked(generateApiKey).mockReturnValue("pchat_test");
    vi.mocked(db.update).mockReturnValue(createChainMock([]) as any);

    await POST();

    expect(generateApiKey).toHaveBeenCalled();
  });
});

describe("DELETE /api/user/api-key", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null as any);

    const response = await DELETE();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should set apiKey to null", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    vi.mocked(db.update).mockReturnValue(createChainMock([]) as any);

    await DELETE();

    expect(db.update).toHaveBeenCalled();
  });

  it("should return success: true", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    vi.mocked(db.update).mockReturnValue(createChainMock([]) as any);

    const response = await DELETE();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});

describe("PATCH /api/user/api-key", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null as any);

    const request = new Request("http://localhost:3000/api/user/api-key", {
      method: "PATCH",
      body: JSON.stringify({ mcpPromptsPublicByDefault: true }),
    });
    const response = await PATCH(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 400 for missing mcpPromptsPublicByDefault", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);

    const request = new Request("http://localhost:3000/api/user/api-key", {
      method: "PATCH",
      body: JSON.stringify({}),
    });
    const response = await PATCH(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid request");
  });

  it("should return 400 for non-boolean value", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);

    const request = new Request("http://localhost:3000/api/user/api-key", {
      method: "PATCH",
      body: JSON.stringify({ mcpPromptsPublicByDefault: "true" }),
    });
    const response = await PATCH(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid request");
  });

  it("should return 400 for number value", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);

    const request = new Request("http://localhost:3000/api/user/api-key", {
      method: "PATCH",
      body: JSON.stringify({ mcpPromptsPublicByDefault: 1 }),
    });
    const response = await PATCH(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid request");
  });

  it("should update mcpPromptsPublicByDefault to true", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    vi.mocked(db.update).mockReturnValue(createChainMock([]) as any);

    const request = new Request("http://localhost:3000/api/user/api-key", {
      method: "PATCH",
      body: JSON.stringify({ mcpPromptsPublicByDefault: true }),
    });
    const response = await PATCH(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(db.update).toHaveBeenCalled();
  });

  it("should update mcpPromptsPublicByDefault to false", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user1" } } as never);
    vi.mocked(db.update).mockReturnValue(createChainMock([]) as any);

    const request = new Request("http://localhost:3000/api/user/api-key", {
      method: "PATCH",
      body: JSON.stringify({ mcpPromptsPublicByDefault: false }),
    });
    const response = await PATCH(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(db.update).toHaveBeenCalled();
  });
});
