import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { studySessionSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = studySessionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid session" },
      { status: 400 },
    );
  }

  if (parsed.data.taskId) {
    const task = await prisma.task.findFirst({
      where: { id: parsed.data.taskId, userId: user.id },
      select: { id: true },
    });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
  }

  const now = new Date();
  const session = await prisma.studySession.create({
    data: {
      userId: user.id,
      taskId: parsed.data.taskId,
      durationMinutes: parsed.data.minutes,
      startedAt: now,
      endedAt: now,
    },
  });

  return NextResponse.json({ session }, { status: 201 });
}