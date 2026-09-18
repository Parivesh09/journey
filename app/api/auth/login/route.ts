import { NextResponse } from "next/server";
import { createSessionValue, allowedEmail, sessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };
  const expectedPassword = process.env.APP_PASSWORD ?? "Parivesh@09";
  if (body.email !== allowedEmail || body.password !== expectedPassword) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const response = NextResponse.json({ authenticated: true });
  response.cookies.set(sessionCookie, createSessionValue(allowedEmail), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
