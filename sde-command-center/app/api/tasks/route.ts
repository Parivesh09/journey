import { NextResponse } from "next/server";

import { Prisma, TaskPriority, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const demoUserEmail = "user@sdecommand.center";

const pageSizeLimit = 50;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);
  const pageSize = Math.min(
    pageSizeLimit,
    Math.max(1, Number(url.searchParams.get("pageSize") ?? "20") || 20),
  );
  const search = url.searchParams.get("q")?.trim();
  const category = url.searchParams.get("category");
  const phaseId = url.searchParams.get("phaseId");
  const topicId = url.searchParams.get("topicId");
  const taskType = url.searchParams.get("taskType");
  const difficulty = url.searchParams.get("difficulty");
  const status = url.searchParams.get("status");
  const priority = url.searchParams.get("priority");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const user = await prisma.user.findUnique({
    where: { email: demoUserEmail },
  });

  if (!user) {
    return NextResponse.json({ tasks: [] });
  }

  const where: Prisma.TaskWhereInput = {
    userId: user.id,
    ...(category ? { category: { name: category } } : {}),
    ...(phaseId ? { phaseId } : {}),
    ...(topicId ? { topicId } : {}),
    ...(taskType ? { taskType } : {}),
    ...(difficulty ? { difficulty } : {}),
    ...(status && Object.values(TaskStatus).includes(status as TaskStatus)
      ? { status: status as TaskStatus }
      : {}),
    ...(priority &&
    Object.values(TaskPriority).includes(priority as TaskPriority)
      ? { priority: priority as TaskPriority }
      : {}),
    ...(from || to
      ? {
          dueDate: {
            ...(from ? { gte: new Date(`${from}T00:00:00.000Z`) } : {}),
            ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {}),
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { topicTitle: { contains: search, mode: "insensitive" } },
            { phaseTitle: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [tasks, total, categories, phases, topics] = await Promise.all([
    prisma.task.findMany({
      where,
      include: { category: true },
      orderBy: { sequenceOrder: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.task.count({ where }),
    prisma.taskCategory.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
      select: { name: true },
    }),
    prisma.task.findMany({
      where: { userId: user.id },
      distinct: ["phaseId"],
      orderBy: { sequenceOrder: "asc" },
      select: { phaseId: true, phaseTitle: true },
    }),
    prisma.task.findMany({
      where: { userId: user.id },
      distinct: ["topicId"],
      orderBy: { sequenceOrder: "asc" },
      select: { topicId: true, topicTitle: true, phaseId: true },
    }),
  ]);

  return NextResponse.json({
    tasks,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    facets: {
      categories: categories.map((item) => item.name),
      phases,
      topics,
    },
  });
}
