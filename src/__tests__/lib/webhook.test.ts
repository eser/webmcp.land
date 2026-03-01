import { describe, it, expect, vi, beforeEach } from "vitest";
import { WEBHOOK_PLACEHOLDERS, SLACK_PRESET_PAYLOAD, triggerWebhooks } from "@/lib/webhook";
import { db } from "@/lib/db";
import { createChainMock, createMockDb } from "../helpers/db-mock";

// Mock the db module
vi.mock("@/lib/db", async () => {
  const { createMockDb } = await import("../helpers/db-mock");
  return createMockDb();
});

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("WEBHOOK_PLACEHOLDERS", () => {
  it("should have all required placeholders", () => {
    expect(WEBHOOK_PLACEHOLDERS.RESOURCE_ID).toBe("{{RESOURCE_ID}}");
    expect(WEBHOOK_PLACEHOLDERS.RESOURCE_TITLE).toBe("{{RESOURCE_TITLE}}");
    expect(WEBHOOK_PLACEHOLDERS.RESOURCE_DESCRIPTION).toBe("{{RESOURCE_DESCRIPTION}}");
    expect(WEBHOOK_PLACEHOLDERS.RESOURCE_ENDPOINT_URL).toBe("{{RESOURCE_ENDPOINT_URL}}");
    expect(WEBHOOK_PLACEHOLDERS.RESOURCE_TYPE).toBe("{{RESOURCE_TYPE}}");
    expect(WEBHOOK_PLACEHOLDERS.RESOURCE_URL).toBe("{{RESOURCE_URL}}");
    expect(WEBHOOK_PLACEHOLDERS.AUTHOR_USERNAME).toBe("{{AUTHOR_USERNAME}}");
    expect(WEBHOOK_PLACEHOLDERS.AUTHOR_NAME).toBe("{{AUTHOR_NAME}}");
    expect(WEBHOOK_PLACEHOLDERS.AUTHOR_AVATAR).toBe("{{AUTHOR_AVATAR}}");
    expect(WEBHOOK_PLACEHOLDERS.CATEGORY_NAME).toBe("{{CATEGORY_NAME}}");
    expect(WEBHOOK_PLACEHOLDERS.TAGS).toBe("{{TAGS}}");
    expect(WEBHOOK_PLACEHOLDERS.TIMESTAMP).toBe("{{TIMESTAMP}}");
    expect(WEBHOOK_PLACEHOLDERS.SITE_URL).toBe("{{SITE_URL}}");
  });

  it("should have consistent placeholder format", () => {
    Object.values(WEBHOOK_PLACEHOLDERS).forEach((placeholder) => {
      expect(placeholder).toMatch(/^\{\{[A-Z_]+\}\}$/);
    });
  });

  it("should have unique placeholder values", () => {
    const values = Object.values(WEBHOOK_PLACEHOLDERS);
    const uniqueValues = new Set(values);
    expect(uniqueValues.size).toBe(values.length);
  });
});

describe("SLACK_PRESET_PAYLOAD", () => {
  it("should be valid JSON when placeholders are replaced", () => {
    // Replace all placeholders with test values
    let payload = SLACK_PRESET_PAYLOAD;
    Object.values(WEBHOOK_PLACEHOLDERS).forEach((placeholder) => {
      payload = payload.replace(new RegExp(placeholder.replace(/[{}]/g, "\\$&"), "g"), "test");
    });

    expect(() => JSON.parse(payload)).not.toThrow();
  });

  it("should contain expected Slack block types", () => {
    expect(SLACK_PRESET_PAYLOAD).toContain('"type": "header"');
    expect(SLACK_PRESET_PAYLOAD).toContain('"type": "actions"');
    expect(SLACK_PRESET_PAYLOAD).toContain('"type": "section"');
    expect(SLACK_PRESET_PAYLOAD).toContain('"type": "context"');
    expect(SLACK_PRESET_PAYLOAD).toContain('"type": "divider"');
  });

  it("should contain all relevant placeholders", () => {
    expect(SLACK_PRESET_PAYLOAD).toContain(WEBHOOK_PLACEHOLDERS.RESOURCE_TITLE);
    expect(SLACK_PRESET_PAYLOAD).toContain(WEBHOOK_PLACEHOLDERS.RESOURCE_URL);
    expect(SLACK_PRESET_PAYLOAD).toContain(WEBHOOK_PLACEHOLDERS.RESOURCE_ENDPOINT_URL);
    expect(SLACK_PRESET_PAYLOAD).toContain(WEBHOOK_PLACEHOLDERS.RESOURCE_DESCRIPTION);
    expect(SLACK_PRESET_PAYLOAD).toContain(WEBHOOK_PLACEHOLDERS.AUTHOR_USERNAME);
    expect(SLACK_PRESET_PAYLOAD).toContain(WEBHOOK_PLACEHOLDERS.AUTHOR_NAME);
    expect(SLACK_PRESET_PAYLOAD).toContain(WEBHOOK_PLACEHOLDERS.CATEGORY_NAME);
    expect(SLACK_PRESET_PAYLOAD).toContain(WEBHOOK_PLACEHOLDERS.TAGS);
  });

  it("should have View Resource button", () => {
    expect(SLACK_PRESET_PAYLOAD).toContain("View Resource");
  });
});

describe("triggerWebhooks", () => {
  const mockResourceData = {
    id: "resource-123",
    title: "Test Resource",
    description: "A test description",
    endpointUrl: "https://example.com/mcp",
    serverType: "mcp",
    isPrivate: false,
    author: {
      username: "testuser",
      name: "Test User",
      avatar: "https://example.com/avatar.png",
    },
    category: {
      name: "Testing",
      slug: "testing",
    },
    tags: [
      { tag: { name: "test", slug: "test" } },
      { tag: { name: "example", slug: "example" } },
    ],
  };

  beforeEach(() => {
    vi.resetAllMocks();
    mockFetch.mockResolvedValue({ ok: true });
  });

  it("should not make fetch calls when no webhooks configured", async () => {
    vi.mocked(db.select).mockReturnValue(createChainMock([]) as any);

    await triggerWebhooks("RESOURCE_CREATED", mockResourceData);

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should call fetch for each enabled webhook", async () => {
    vi.mocked(db.select).mockReturnValue(createChainMock([
      {
        id: "wh1",
        name: "Webhook 1",
        url: "https://example.com/hook1",
        method: "POST",
        payload: '{"test": "{{RESOURCE_ID}}"}',
        headers: {},
        events: ["RESOURCE_CREATED"],
        isEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "wh2",
        name: "Webhook 2",
        url: "https://example.com/hook2",
        method: "POST",
        payload: '{"data": "{{RESOURCE_TITLE}}"}',
        headers: {},
        events: ["RESOURCE_CREATED"],
        isEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]) as any);

    await triggerWebhooks("RESOURCE_CREATED", mockResourceData);

    // Give time for the fire-and-forget promises to execute
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("should replace placeholders in payload", async () => {
    vi.mocked(db.select).mockReturnValue(createChainMock([
      {
        id: "wh1",
        name: "Test Webhook",
        url: "https://example.com/hook",
        method: "POST",
        payload: '{"id": "{{RESOURCE_ID}}", "title": "{{RESOURCE_TITLE}}"}',
        headers: {},
        events: ["RESOURCE_CREATED"],
        isEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]) as any);

    await triggerWebhooks("RESOURCE_CREATED", mockResourceData);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockFetch).toHaveBeenCalledWith(
      "https://example.com/hook",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("resource-123"),
      })
    );
  });

  it("should include custom headers", async () => {
    vi.mocked(db.select).mockReturnValue(createChainMock([
      {
        id: "wh1",
        name: "Test Webhook",
        url: "https://example.com/hook",
        method: "POST",
        payload: "{}",
        headers: { Authorization: "Bearer token123" },
        events: ["RESOURCE_CREATED"],
        isEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]) as any);

    await triggerWebhooks("RESOURCE_CREATED", mockResourceData);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          Authorization: "Bearer token123",
        }),
      })
    );
  });

  it("should handle fetch errors gracefully", async () => {
    vi.mocked(db.select).mockReturnValue(createChainMock([
      {
        id: "wh1",
        name: "Failing Webhook",
        url: "https://example.com/hook",
        method: "POST",
        payload: "{}",
        headers: {},
        events: ["RESOURCE_CREATED"],
        isEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]) as any);

    mockFetch.mockRejectedValue(new Error("Network error"));

    // Should not throw
    await expect(triggerWebhooks("RESOURCE_CREATED", mockResourceData)).resolves.not.toThrow();
  });

  it("should handle database errors gracefully", async () => {
    vi.mocked(db.select).mockImplementation(() => {
      throw new Error("DB Error");
    });

    // Should not throw
    await expect(triggerWebhooks("RESOURCE_CREATED", mockResourceData)).resolves.not.toThrow();
  });

  it("should use correct HTTP method from config", async () => {
    vi.mocked(db.select).mockReturnValue(createChainMock([
      {
        id: "wh1",
        name: "PUT Webhook",
        url: "https://example.com/hook",
        method: "PUT",
        payload: "{}",
        headers: {},
        events: ["RESOURCE_CREATED"],
        isEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]) as any);

    await triggerWebhooks("RESOURCE_CREATED", mockResourceData);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: "PUT",
      })
    );
  });
});
