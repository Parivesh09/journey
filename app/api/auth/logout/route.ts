import { NextResponse } from "next/server";

import { sessionCookie, sessionCookieOptions } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(sessionCookie, "", {
    ...sessionCookieOptions,
    maxAge: 0,
  });
  return response;
}
