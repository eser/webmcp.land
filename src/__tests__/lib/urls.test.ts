import { describe, it, expect } from "vitest";
import { getResourceUrl, getResourceEditUrl, getResourceChangesUrl } from "@/lib/urls";

describe("getResourceUrl", () => {
  it("should return URL with just ID when no slug provided", () => {
    expect(getResourceUrl("abc123")).toBe("/registry/abc123");
  });

  it("should return URL with ID and slug when slug provided", () => {
    expect(getResourceUrl("abc123", "my-resource")).toBe("/registry/abc123_my-resource");
  });

  it("should return URL with just ID when slug is null", () => {
    expect(getResourceUrl("abc123", null)).toBe("/registry/abc123");
  });

  it("should return URL with just ID when slug is undefined", () => {
    expect(getResourceUrl("abc123", undefined)).toBe("/registry/abc123");
  });

  it("should return URL with just ID when slug is empty string", () => {
    expect(getResourceUrl("abc123", "")).toBe("/registry/abc123");
  });

  it("should handle slug with special characters", () => {
    expect(getResourceUrl("abc123", "my-cool-resource")).toBe("/registry/abc123_my-cool-resource");
  });

  it("should handle numeric ID", () => {
    expect(getResourceUrl("12345", "test")).toBe("/registry/12345_test");
  });

  it("should handle UUID-style ID", () => {
    const uuid = "550e8400-e29b-41d4-a716-446655440000";
    expect(getResourceUrl(uuid, "slug")).toBe(`/registry/${uuid}_slug`);
  });

  it("should handle slug with numbers", () => {
    expect(getResourceUrl("id1", "resource-2024")).toBe("/registry/id1_resource-2024");
  });
});

describe("getResourceEditUrl", () => {
  it("should return edit URL with just ID when no slug", () => {
    expect(getResourceEditUrl("abc123")).toBe("/registry/abc123/edit");
  });

  it("should return edit URL with ID and slug", () => {
    expect(getResourceEditUrl("abc123", "my-resource")).toBe("/registry/abc123_my-resource/edit");
  });

  it("should return edit URL with just ID when slug is null", () => {
    expect(getResourceEditUrl("abc123", null)).toBe("/registry/abc123/edit");
  });

  it("should return edit URL with just ID when slug is undefined", () => {
    expect(getResourceEditUrl("abc123", undefined)).toBe("/registry/abc123/edit");
  });

  it("should append /edit to the base resource URL", () => {
    const baseUrl = getResourceUrl("test", "slug");
    const editUrl = getResourceEditUrl("test", "slug");
    expect(editUrl).toBe(`${baseUrl}/edit`);
  });
});

describe("getResourceChangesUrl", () => {
  it("should return changes URL with just ID when no slug", () => {
    expect(getResourceChangesUrl("abc123")).toBe("/registry/abc123/changes/new");
  });

  it("should return changes URL with ID and slug", () => {
    expect(getResourceChangesUrl("abc123", "my-resource")).toBe("/registry/abc123_my-resource/changes/new");
  });

  it("should return changes URL with just ID when slug is null", () => {
    expect(getResourceChangesUrl("abc123", null)).toBe("/registry/abc123/changes/new");
  });

  it("should return changes URL with just ID when slug is undefined", () => {
    expect(getResourceChangesUrl("abc123", undefined)).toBe("/registry/abc123/changes/new");
  });

  it("should append /changes/new to the base resource URL", () => {
    const baseUrl = getResourceUrl("test", "slug");
    const changesUrl = getResourceChangesUrl("test", "slug");
    expect(changesUrl).toBe(`${baseUrl}/changes/new`);
  });
});

describe("URL generation consistency", () => {
  it("should maintain consistent format across all URL functions", () => {
    const id = "test-id";
    const slug = "test-slug";

    const baseUrl = getResourceUrl(id, slug);
    const editUrl = getResourceEditUrl(id, slug);
    const changesUrl = getResourceChangesUrl(id, slug);

    expect(editUrl.startsWith(baseUrl)).toBe(true);
    expect(changesUrl.startsWith(baseUrl)).toBe(true);
  });

  it("should handle same ID with different slugs", () => {
    const id = "same-id";

    const url1 = getResourceUrl(id, "slug-one");
    const url2 = getResourceUrl(id, "slug-two");
    const url3 = getResourceUrl(id, null);

    expect(url1).not.toBe(url2);
    expect(url1).not.toBe(url3);
    expect(url2).not.toBe(url3);
  });
});
