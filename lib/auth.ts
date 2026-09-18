import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const sessionCookie = "sde_session";
export const allowedEmail = "rimjha.parivesh2002@gmail.com";

function secret() {
  return process.env.AUTH_SECRET ?? "development-only-secret";
}

export function createSessionValue(email: string) {
  const signature = createHmac("sha256", secret()).update(email).digest("hex");
  return `${email}.${signature}`;
}

export function isValidSession(value?: string) {
  if (!value) return false;
  const separator = value.lastIndexOf(".");
  if (separator < 1) return false;
  const email = value.slice(0, separator);
  const signature = value.slice(separator + 1);
  const expected = createSessionValue(email).slice(separator + 1);
  return (
    email === allowedEmail &&
    signature.length === expected.length &&
    timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  );
}

export async function isAuthenticated() {
  const cookieStore = await cookies();
  return isValidSession(cookieStore.get(sessionCookie)?.value);
}
