import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Minimal signed-session helpers for the admin gate.
 *
 * Pure Node crypto, no framework imports — safe to use from `proxy.ts`
 * (which runs on the Node.js runtime in Next 16) and from Route Handlers.
 * The token is `<expiryMs>.<hmac>` where the HMAC covers `admin.<expiryMs>`,
 * so it can't be forged without the secret and can't be replayed past expiry.
 */

export const COOKIE_NAME = "admin_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

function sessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET ?? process.env.ADMIN_PASSWORD;
  if (!secret) {
    throw new Error(
      "ADMIN_SESSION_SECRET (or ADMIN_PASSWORD) must be set to sign admin sessions",
    );
  }
  return secret;
}

function sign(data: string): string {
  return createHmac("sha256", sessionSecret()).update(data).digest("hex");
}

/** Constant-time equality for two hex strings of the same length. */
function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length || a.length === 0) return false;
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length !== bufB.length || bufA.length === 0) return false;
  return timingSafeEqual(bufA, bufB);
}

export function createSessionToken(ttlSeconds = SESSION_TTL_SECONDS): string {
  const exp = Date.now() + ttlSeconds * 1000;
  return `${exp}.${sign(`admin.${exp}`)}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const sep = token.indexOf(".");
  if (sep <= 0) return false;

  const expStr = token.slice(0, sep);
  const sig = token.slice(sep + 1);
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp <= Date.now()) return false;

  return safeEqualHex(sig, sign(`admin.${exp}`));
}

/** Constant-time password check against ADMIN_PASSWORD. */
export function verifyPassword(input: string | undefined | null): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || typeof input !== "string") return false;
  const bufA = Buffer.from(input);
  const bufB = Buffer.from(expected);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
