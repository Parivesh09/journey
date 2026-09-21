import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { isMilestoneLocked } from "@/lib/business/milestones";

export async function GET() {
  const user = await requireUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pins = await prisma.dailyTaskPin.findMany({
    where: { userId: user.id },
    select: { id: true, taskId: true },
  });
  return NextResponse.json({ pins });
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as { taskId?: string };
  if (typeof body.taskId !== "string" || !body.taskId) {
    return NextResponse.json({ error: "taskId is required" }, { status: 400 });
  }

  const task = await prisma.task.findFirst({
    where: { id: body.taskId, userId: user.id },
    select: { id: true, roadmapId: true, milestoneId: true, status: true },
  });
  if (!task)
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  if (task.status === "COMPLETED")
    return NextResponse.json(
      { error: "Completed tasks can't be pinned" },
      { status: 409 },
    );
  if (!task.roadmapId || !task.milestoneId) {
    return NextResponse.json(
      { error: "Only roadmap tasks can be connected to daily" },
      { status: 400 },
    );
  }
  if (await isMilestoneLocked(user.id, task.roadmapId, task.milestoneId)) {
    return NextResponse.json(
      { error: "Unlock this milestone by completing its prerequisites first" },
      { status: 403 },
    );
  }

  const existing = await prisma.dailyTaskPin.findUnique({
    where: { userId_taskId: { userId: user.id, taskId: task.id } },
  });
  if (existing) return NextResponse.json({ pin: existing });

  const pin = await prisma.dailyTaskPin.create({
    data: { userId: user.id, taskId: task.id },
  });
  return NextResponse.json({ pin }, { status: 201 });
}