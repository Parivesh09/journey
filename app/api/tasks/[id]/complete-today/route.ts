import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

function todayRange(now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start.getTime() + 86_400_000);
  return { start, end };
}

/** Mark (or unmark) a personal daily routine as done for today. */
export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;

  const task = await prisma.task.findFirst({
    where: { id, userId: user.id },
    include: { category: true },
  });
  if (!task)
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  if (!task.isPersonalDaily) {
    return NextResponse.json(
      { error: "Only personal daily routines can be checked off per day" },
      { status: 400 },
    );
  }

  const { start, end } = todayRange();
  const existing = await prisma.taskCompletion.findFirst({
    where: {
      userId: user.id,
      taskId: task.id,
      completedAt: { gte: start, lt: end },
    },
  });

  if (existing) {
    await prisma.taskCompletion.delete({ where: { id: existing.id } });
    return NextResponse.json({ task, doneToday: false });
  }

  await prisma.taskCompletion.create({
    data: { userId: user.id, taskId: task.id, completedAt: new Date() },
  });
  return NextResponse.json({ task, doneToday: true });
}