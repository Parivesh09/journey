import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as { days?: number };
  const days = Number(body.days);
  if (!Number.isInteger(days) || days < 1 || days > 30) {
    return NextResponse.json(
      { error: "days must be an integer from 1 to 30" },
      { status: 400 },
    );
  }
  const result = await prisma.$executeRaw`
    UPDATE "Task"
    SET "dueDate" = "dueDate" + (${days} * INTERVAL '1 day'), "updatedAt" = NOW()
    WHERE "userId" = ${user.id} AND "dueDate" IS NOT NULL
  `;
  return NextResponse.json({ shifted: Number(result), days });
}
