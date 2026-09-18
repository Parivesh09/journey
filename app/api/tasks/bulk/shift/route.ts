import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";

export async function POST(request: Request) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as { days?: number; from?: string };
  const days = Number(body.days);
  if (!Number.isInteger(days) || days < 1 || days > 30) {
    return NextResponse.json({ error: "days must be an integer from 1 to 30" }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { email: "user@sdecommand.center" } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const from = body.from ? new Date(`${body.from}T00:00:00.000Z`) : new Date();
  if (Number.isNaN(from.getTime())) return NextResponse.json({ error: "Invalid from date" }, { status: 400 });
  const result = await prisma.$executeRaw`
    UPDATE "Task"
    SET "dueDate" = "dueDate" + (${days} * INTERVAL '1 day'), "updatedAt" = NOW()
    WHERE "userId" = ${user.id} AND "dueDate" >= ${from}
  `;
  return NextResponse.json({ shifted: Number(result), days });
}