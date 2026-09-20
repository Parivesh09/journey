import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createSessionValue, sessionCookie, sessionCookieOptions } from "@/lib/auth";
import { ensureDailyTasks } from "@/lib/business/daily-plan";
import { provisionRoadmapForUser } from "@/lib/business/roadmap-provision";
import { prisma } from "@/lib/prisma";

function validTimezone(value: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name?: string;
    email?: string;
    password?: string;
    timezone?: string;
  };
  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const timezone = body.timezone && validTimezone(body.timezone) ? body.timezone : "UTC";
  if (!name || !email || !/^\S+@\S+\.\S+$/.test(email) || !body.password || body.password.length < 8)
    return NextResponse.json({ error: "Provide a name, valid email, and password of at least 8 characters." }, { status: 400 });
  if (await prisma.user.findUnique({ where: { email } }))
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });

  const user = await prisma.user.create({
    data: { name, email, passwordHash: await bcrypt.hash(body.password, 12), timezone },
  });

  await prisma.notificationPreference.create({ data: { userId: user.id } });
  await provisionRoadmapForUser(user.id);
  await ensureDailyTasks(user.id, new Date());

  const response = NextResponse.json(
    { user: { id: user.id, name: user.name, email: user.email } },
    { status: 201 },
  );
  response.cookies.set(sessionCookie, createSessionValue(user.id), sessionCookieOptions);
  return response;
}