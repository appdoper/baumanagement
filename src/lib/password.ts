import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

/** Hash a password with scrypt and a random salt. Format: `salt:derivedKey` (hex). */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${derived}`;
}

/** Constant-time verification against a `salt:derivedKey` hash. */
export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = scryptSync(password, salt, KEY_LENGTH);
  const expected = Buffer.from(hash, "hex");
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

/**
 * Generate a random, readable password. Uses an unambiguous alphabet (no
 * 0/O/1/l/I) and groups characters with dashes for easier manual entry.
 */
export function generatePassword(groups = 3, groupSize = 4): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const length = groups * groupSize;
  const bytes = randomBytes(length);
  const chars = Array.from(bytes, (b) => alphabet[b % alphabet.length]);
  const parts: string[] = [];
  for (let i = 0; i < length; i += groupSize) {
    parts.push(chars.slice(i, i + groupSize).join(""));
  }
  return parts.join("-");
}
