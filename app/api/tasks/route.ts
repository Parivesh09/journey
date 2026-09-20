import { NextResponse } from "next/server";

import { Prisma, TaskPriority, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const pageSizeLimit = 50;

function parseDate(value: unknown) {
  if (typeof value !== "string" || !value) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(request: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();
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
      orderBy: [{ dueDate: "asc" }, { sequenceOrder: "asc" }],
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

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();

  const body = (await request.json()) as Record<string, unknown>;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title || title.length > 160) {
    return NextResponse.json(
      { error: "A title between 1 and 160 characters is required" },
      { status: 400 },
    );
  }

  const dueDate = parseDate(body.dueDate) ?? new Date();
  const task = await prisma.task.create({
    data: {
      userId: user.id,
      title,
      description:
        typeof body.description === "string" ? body.description : undefined,
      categoryId:
        typeof body.categoryId === "string" ? body.categoryId : undefined,
      priority: Object.values(TaskPriority).includes(
        body.priority as TaskPriority,
      )
        ? (body.priority as TaskPriority)
        : "MEDIUM",
      status: Object.values(TaskStatus).includes(body.status as TaskStatus)
        ? (body.status as TaskStatus)
        : "TODO",
      estimatedMinutes:
        typeof body.estimatedMinutes === "number"
          ? Math.max(1, Math.round(body.estimatedMinutes))
          : 60,
      plannedMinutes:
        typeof body.plannedMinutes === "number"
          ? Math.max(1, Math.round(body.plannedMinutes))
          : 60,
      dueDate,
      taskType: typeof body.taskType === "string" ? body.taskType : "custom",
      dailySlot:
        typeof body.dailySlot === "string" ? body.dailySlot : undefined,
      isDailyTask: body.isDailyTask === true,
      // Int column max minus margin so the row always sorts last.
      sequenceOrder: 2147483646,
    },
    include: { category: true },
  });

  return NextResponse.json({ task }, { status: 201 });
}
