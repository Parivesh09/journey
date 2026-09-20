import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createSessionValue, sessionCookie, sessionCookieOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase();
  if (!email || !body.password) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash || !user.isActive || !(await bcrypt.compare(body.password, user.passwordHash)))
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const response = NextResponse.json({ authenticated: true });
  response.cookies.set(sessionCookie, createSessionValue(user.id), sessionCookieOptions);
  return response;
}
