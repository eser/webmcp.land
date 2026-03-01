/// <reference types="vitest/globals" />
/**
 * Shared test helpers for mocking the database layer.
 *
 * NOTE: This module relies on vitest globals (`vi`) being enabled
 * (`globals: true` in vitest.config.ts).  It intentionally avoids
 * `import { vi } from "vitest"` so that it can be loaded inside
 * async `vi.mock` factory functions without triggering hoisting errors.
 */

const CHAIN_METHODS = [
  "select",
  "from",
  "where",
  "orderBy",
  "limit",
  "offset",
  "leftJoin",
  "innerJoin",
  "groupBy",
  "having",
  "returning",
  "set",
  "values",
  "onConflictDoUpdate",
  "onConflictDoNothing",
  "as",
] as const;

/**
 * Creates a chainable mock object that resolves to the given value when awaited.
 * Supports all Drizzle ORM query builder methods including "as".
 */
export function createChainMock(resolvedValue: unknown = []) {
  const chain: Record<string, any> = {};
  for (const method of CHAIN_METHODS) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }
  chain.then = (resolve: Function) => resolve(resolvedValue);
  return chain;
}

/**
 * Factory that returns a basic mock db object for use in vi.mock("@/lib/db").
 * For test files that need a more complex mock (e.g., with transaction or query tables),
 * use createChainMock directly inside the vi.mock factory.
 */
export function createMockDb() {
  return {
    db: {
      select: vi.fn().mockReturnValue(createChainMock([])),
      insert: vi.fn().mockReturnValue(createChainMock([])),
      update: vi.fn().mockReturnValue(createChainMock([])),
      delete: vi.fn().mockReturnValue(createChainMock([])),
      execute: vi.fn().mockResolvedValue({ rows: [] }),
      query: {},
    },
  };
}

/**
 * Sets up db.select to return different results on sequential calls.
 * Each call to db.select() will return the next result from the provided list.
 */
export function mockSelectSequence(
  db: { select: any },
  ...results: unknown[]
) {
  let callIndex = 0;
  vi.mocked(db.select).mockImplementation((() => {
    const data = results[callIndex] ?? [];
    callIndex++;
    return createChainMock(data);
  }) as any);
}
