import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const localSecret = randomBytes(32).toString("base64url");
const secret =
  process.env.QR_TOKEN_SECRET?.trim() ||
  process.env.BETTER_AUTH_SECRET?.trim() ||
  (process.env.NODE_ENV === "production" ? "" : localSecret);

function requireSecret() {
  if (
    !secret ||
    (process.env.NODE_ENV === "production" && secret.length < 32)
  ) {
    throw new Error("Set QR_TOKEN_SECRET or BETTER_AUTH_SECRET to at least 32 characters.");
  }
  return secret;
}

function signature(memberId: string, issuedAt: number) {
  return createHmac("sha256", requireSecret())
    .update(`${memberId}.${issuedAt}`)
    .digest("base64url");
}

export function createAttendanceQrToken(memberId: string, issuedAt: number) {
  return `restex:v1:${memberId}:${issuedAt}:${signature(memberId, issuedAt)}`;
}

export function hashAttendanceQrToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function verifyAttendanceQrToken(token: string) {
  const match = /^restex:v1:([0-9a-f-]{36}):(\d{13}):([A-Za-z0-9_-]{43})$/.exec(token);
  if (!match) return null;
  const [, memberId, issuedAtValue, suppliedSignature] = match;
  const issuedAt = Number(issuedAtValue);
  if (!Number.isSafeInteger(issuedAt)) return null;
  const expected = Buffer.from(signature(memberId, issuedAt));
  const actual = Buffer.from(suppliedSignature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  return { memberId, issuedAt };
}
