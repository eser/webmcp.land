import { randomBytes, timingSafeEqual } from "node:crypto";

const ITERATIONS = 100_000;
const KEY_LENGTH = 64;
const DIGEST = "SHA-512";
const SALT_LENGTH = 16;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: DIGEST },
    key,
    KEY_LENGTH * 8,
  );
  return `${Buffer.from(salt).toString("hex")}:${Buffer.from(derived).toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;

  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: DIGEST },
    key,
    KEY_LENGTH * 8,
  );

  return timingSafeEqual(expected, Buffer.from(derived));
}
