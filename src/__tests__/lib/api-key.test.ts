import { describe, it, expect } from "vitest";
import { generateApiKey, isValidApiKeyFormat } from "@/lib/api-key";

describe("generateApiKey", () => {
  it("should generate a key with wmcp_ prefix", () => {
    const key = generateApiKey();
    expect(key.startsWith("wmcp_")).toBe(true);
  });

  it("should generate a key with correct total length", () => {
    const key = generateApiKey();
    // wmcp_ (5 chars) + 64 hex chars = 69 total
    expect(key.length).toBe(69);
  });

  it("should generate unique keys", () => {
    const keys = new Set<string>();
    for (let i = 0; i < 100; i++) {
      keys.add(generateApiKey());
    }
    expect(keys.size).toBe(100);
  });

  it("should only contain valid hex characters after prefix", () => {
    const key = generateApiKey();
    const randomPart = key.slice(5); // Remove wmcp_ prefix
    expect(randomPart).toMatch(/^[a-f0-9]{64}$/);
  });

  it("should generate keys that pass validation", () => {
    for (let i = 0; i < 10; i++) {
      const key = generateApiKey();
      expect(isValidApiKeyFormat(key)).toBe(true);
    }
  });
});

describe("isValidApiKeyFormat", () => {
  it("should return true for valid API key", () => {
    const validKey = "wmcp_" + "a".repeat(64);
    expect(isValidApiKeyFormat(validKey)).toBe(true);
  });

  it("should return true for key with mixed hex characters", () => {
    const validKey = "wmcp_0123456789abcdef".padEnd(69, "0");
    expect(isValidApiKeyFormat(validKey)).toBe(true);
  });

  it("should return false for key without wmcp_ prefix", () => {
    const invalidKey = "wrong_" + "a".repeat(64);
    expect(isValidApiKeyFormat(invalidKey)).toBe(false);
  });

  it("should return false for key with missing prefix", () => {
    const invalidKey = "a".repeat(64);
    expect(isValidApiKeyFormat(invalidKey)).toBe(false);
  });

  it("should return false for key that is too short", () => {
    const shortKey = "wmcp_" + "a".repeat(32);
    expect(isValidApiKeyFormat(shortKey)).toBe(false);
  });

  it("should return false for key that is too long", () => {
    const longKey = "wmcp_" + "a".repeat(100);
    expect(isValidApiKeyFormat(longKey)).toBe(false);
  });

  it("should return false for key with invalid characters", () => {
    const invalidKey = "wmcp_" + "g".repeat(64); // 'g' is not hex
    expect(isValidApiKeyFormat(invalidKey)).toBe(false);
  });

  it("should return false for key with uppercase hex", () => {
    const invalidKey = "wmcp_" + "A".repeat(64);
    expect(isValidApiKeyFormat(invalidKey)).toBe(false);
  });

  it("should return false for empty string", () => {
    expect(isValidApiKeyFormat("")).toBe(false);
  });

  it("should return false for just the prefix", () => {
    expect(isValidApiKeyFormat("wmcp_")).toBe(false);
  });

  it("should return false for key with spaces", () => {
    const invalidKey = "wmcp_" + "a".repeat(32) + " " + "a".repeat(31);
    expect(isValidApiKeyFormat(invalidKey)).toBe(false);
  });

  it("should return false for key with special characters", () => {
    const invalidKey = "wmcp_" + "a".repeat(63) + "!";
    expect(isValidApiKeyFormat(invalidKey)).toBe(false);
  });
});
