import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * The useIsMobile hook uses window.matchMedia with "(max-width: 767px)".
 * In jsdom, matchMedia returns a stub that always reports matches: false,
 * so we mock it to control the return value per test.
 */
describe("useIsMobile", () => {
  const originalMatchMedia = window.matchMedia;
  let changeListeners: Array<(e: { matches: boolean }) => void>;

  function mockMatchMedia(matches: boolean) {
    changeListeners = [];
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn((event: string, cb: (e: { matches: boolean }) => void) => {
        if (event === "change") changeListeners.push(cb);
      }),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  }

  beforeEach(() => {
    // Default: desktop (not mobile)
    mockMatchMedia(false);
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    vi.restoreAllMocks();
  });

  it("should return false for desktop width (>= 768)", () => {
    mockMatchMedia(false);
    Object.defineProperty(window, "innerWidth", { value: 1024, configurable: true });
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("should return true for mobile width (< 768)", () => {
    mockMatchMedia(true);
    Object.defineProperty(window, "innerWidth", { value: 375, configurable: true });
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("should return false at exactly 768px", () => {
    mockMatchMedia(false);
    Object.defineProperty(window, "innerWidth", { value: 768, configurable: true });
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("should return true at 767px (just below breakpoint)", () => {
    mockMatchMedia(true);
    Object.defineProperty(window, "innerWidth", { value: 767, configurable: true });
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("should call matchMedia with correct query", () => {
    mockMatchMedia(false);
    Object.defineProperty(window, "innerWidth", { value: 1024, configurable: true });
    renderHook(() => useIsMobile());
    expect(window.matchMedia).toHaveBeenCalledWith("(max-width: 767px)");
  });

  it("should register a change listener on mount", () => {
    mockMatchMedia(false);
    Object.defineProperty(window, "innerWidth", { value: 1024, configurable: true });
    renderHook(() => useIsMobile());
    expect(changeListeners.length).toBe(1);
  });

  it("should handle edge case of 0 width", () => {
    mockMatchMedia(true);
    Object.defineProperty(window, "innerWidth", { value: 0, configurable: true });
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("should handle very large width", () => {
    mockMatchMedia(false);
    Object.defineProperty(window, "innerWidth", { value: 10000, configurable: true });
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });
});
