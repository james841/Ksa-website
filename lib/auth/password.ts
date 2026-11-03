import "server-only";
import { scrypt, randomBytes, timingSafeEqual, createHash } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (pw: string, salt: Buffer, len: number, opts: object) => Promise<Buffer>;
const PARAMS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await scryptAsync(password.normalize("NFKC"), salt, 64, PARAMS);
  return `scrypt$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [algo, saltB64, keyB64] = stored.split("$");
  if (algo !== "scrypt" || !saltB64 || !keyB64) return false;
  const expected = Buffer.from(keyB64, "base64");
  const actual = await scryptAsync(password.normalize("NFKC"), Buffer.from(saltB64, "base64"), expected.length, PARAMS);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
