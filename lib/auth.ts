import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const sessionCookie = "sde_session";
const sessionMaxAgeSeconds = 60 * 60 * 24 * 7;

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value && process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET must be configured in production");
  return value ?? "development-only-secret";
}

function sign(payload: string) { return createHmac("sha256", secret()).update(payload).digest("hex"); }

export function createSessionValue(userId: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + sessionMaxAgeSeconds;
  const payload = `${userId}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

function sessionUserId(value?: string) {
  const userId = decodeSessionValue(value);
  if (!userId) return null;
  return userId;
}

export function decodeSessionValue(value?: string) {
  if (!value) return null;
  const [userId, expiresAtText, signature, ...extra] = value.split(".");
  if (!userId || !expiresAtText || !signature || extra.length) return null;
  const expiresAt = Number(expiresAtText);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Date.now() / 1000) return null;
  const expected = sign(`${userId}.${expiresAtText}`);
  return signature.length === expected.length && timingSafeEqual(Buffer.from(signature), Buffer.from(expected)) ? userId : null;
}

export function signSessionPayload(payload: string) { return sign(payload); }

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  timezone: true,
  dailyStudyTargetMinutes: true,
  theme: true,
  onboardingDismissedAt: true,
} as const;

export async function getCurrentUser() {
  const userId = sessionUserId((await cookies()).get(sessionCookie)?.value);
  if (!userId) return null;
  return prisma.user.findFirst({
    where: { id: userId, isActive: true },
    select: safeUserSelect,
  });
}

/**
 * Resolves the authenticated user from the session cookie, or null when there
 * is no valid session. Ownership in every user-owned handler must come from
 * this value, never from client-provided identifiers.
 */
export async function requireUser() {
  return getCurrentUser();
}

export async function isAuthenticated() { return Boolean(await getCurrentUser()); }

export const sessionCookieOptions = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: sessionMaxAgeSeconds };
