import { NextResponse } from "next/server";

import { TaskPriority, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { isMilestoneLocked } from "@/lib/business/milestones";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const { id } = await context.params;
  const body = (await request.json()) as Record<string, unknown>;

  const task = await prisma.task.findFirst({
    where: { id, userId: user.id },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  if (task.roadmapId && task.milestoneId) {
    const hasMutation = Object.keys(body).some((key) =>
      ["title", "description", "completed", "status", "categoryId", "dueDate", "priority", "estimatedMinutes", "plannedMinutes", "dailySlot"].includes(key),
    );
    if (hasMutation && (await isMilestoneLocked(user.id, task.roadmapId, task.milestoneId))) {
      return NextResponse.json(
        { error: "Locked milestone: complete its prerequisites before editing these tasks" },
        { status: 403 },
      );
    }
  }

  const hasCompleted = typeof body.completed === "boolean";
  const status = hasCompleted
    ? body.completed
      ? "COMPLETED"
      : "TODO"
    : Object.values(TaskStatus).includes(body.status as TaskStatus)
      ? (body.status as TaskStatus)
      : task.status;
  const updatedTask = await prisma.task.update({
    where: { id: task.id },
    data: {
      ...(hasCompleted || body.status ? { status } : {}),
      ...(hasCompleted
        ? { completedAt: body.completed ? new Date() : null }
        : {}),
      ...(typeof body.title === "string" && body.title.trim()
        ? { title: body.title.trim() }
        : {}),
      ...(typeof body.description === "string"
        ? { description: body.description }
        : {}),
      ...(typeof body.categoryId === "string"
        ? { categoryId: body.categoryId || null }
        : {}),
      ...(Object.values(TaskPriority).includes(body.priority as TaskPriority)
        ? { priority: body.priority as TaskPriority }
        : {}),
      ...(typeof body.estimatedMinutes === "number"
        ? { estimatedMinutes: Math.max(1, Math.round(body.estimatedMinutes)) }
        : {}),
      ...(typeof body.plannedMinutes === "number"
        ? { plannedMinutes: Math.max(1, Math.round(body.plannedMinutes)) }
        : {}),
      ...(typeof body.dueDate === "string" && body.dueDate
        ? { dueDate: new Date(`${body.dueDate}T00:00:00.000Z`) }
        : {}),
      ...(typeof body.dailySlot === "string"
        ? { dailySlot: body.dailySlot }
        : {}),
    },
    include: { category: true },
  });

  if (updatedTask.status === "COMPLETED") {
    await prisma.dailyTaskPin.deleteMany({
      where: { userId: user.id, taskId: updatedTask.id },
    });
  }

  return NextResponse.json({ task: updatedTask });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const { id } = await context.params;

  const task = await prisma.task.findFirst({ where: { id, userId: user.id } });
  if (!task)
    return NextResponse.json({ error: "Task not found" }, { status: 404 });

  await prisma.task.delete({ where: { id: task.id } });
  return NextResponse.json({ deleted: true, id: task.id });
}
