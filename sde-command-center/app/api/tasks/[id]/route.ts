import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const demoUserEmail = "user@sdecommand.center";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = (await request.json()) as { completed?: boolean };
  const user = await prisma.user.findUnique({
    where: { email: demoUserEmail },
  });

  if (!user || typeof body.completed !== "boolean") {
    return NextResponse.json({ error: "Invalid task update" }, { status: 400 });
  }

  const task = await prisma.task.findFirst({
    where: { id, userId: user.id },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const status = body.completed ? "COMPLETED" : "TODO";
  const updatedTask = await prisma.task.update({
    where: { id: task.id },
    data: {
      status,
      completedAt: body.completed ? new Date() : null,
    },
    include: { category: true },
  });

  return NextResponse.json({ task: updatedTask });
}
