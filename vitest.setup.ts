import "@testing-library/jest-dom";
import { vi, beforeAll, afterAll } from "vitest";

// Suppress console.error and console.log during tests to reduce noise
// These are expected outputs from error handling tests
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

beforeAll(() => {
  console.error = vi.fn();
  console.log = vi.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
});

// Mock environment variables
process.env.BETTER_AUTH_SECRET = "test-secret";
process.env.BETTER_AUTH_URL = "http://localhost:3000";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";

// Mock next/server
vi.mock("next/server", () => {
  class MockNextRequest extends Request {
    nextUrl: URL;
    constructor(input: string | URL | Request, init?: RequestInit) {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      super(url, init);
      this.nextUrl = new URL(url);
    }
    get cookies() {
      return { get: () => undefined, getAll: () => [], has: () => false };
    }
  }

  class MockNextResponse extends Response {
    static json(body: unknown, init?: ResponseInit) {
      return new Response(JSON.stringify(body), {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(init?.headers || {}),
        },
      });
    }
    static redirect(url: string | URL, init?: number | ResponseInit) {
      const status = typeof init === "number" ? init : (init as ResponseInit)?.status ?? 307;
      return new Response(null, {
        status,
        headers: { Location: url.toString() },
      });
    }
    static next() {
      return new Response(null);
    }
  }

  return { NextRequest: MockNextRequest, NextResponse: MockNextResponse };
});

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  unstable_cache: vi.fn((fn: unknown) => fn),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => {
    return new URLSearchParams();
  },
  usePathname: () => "/",
  useParams: () => ({}),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

// Mock next/headers
vi.mock("next/headers", () => {
  const getCookieMock = vi.fn().mockReturnValue(null);
  const setCookieMock = vi.fn();
  const deleteCookieMock = vi.fn();

  return {
    cookies: () => ({
      get: getCookieMock,
      set: setCookieMock,
      delete: deleteCookieMock,
    }),
    headers: () => new Headers(),
  };
});

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
  getTranslations: () => Promise.resolve((key: string) => key),
}));

// Mock database client
vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    prompt: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    category: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $queryRaw: vi.fn(),
    $executeRaw: vi.fn(),
    $transaction: vi.fn(),
  },
}));

// Mock config
vi.mock("@/lib/config", () => ({
  getConfig: vi.fn(() =>
    Promise.resolve({
      auth: {
        allowRegistration: true,
        providers: [],
      },
      features: {},
    })
  ),
}));
