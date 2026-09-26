import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isBeforeDay, isSameDay } from "@/lib/utils";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function parseDateParam(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET(request: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();

  const url = new URL(request.url);
  const view = url.searchParams.get("view") ?? "month";
  const dateParam = url.searchParams.get("date");
  const referenceDate = dateParam ? parseDateParam(dateParam) ?? new Date() : new Date();

  const userTimezone = user.timezone ?? "UTC";

  let rangeStart: Date;
  let rangeEnd: Date;

  switch (view) {
    case "day": {
      rangeStart = startOfDay(referenceDate);
      rangeEnd = endOfDay(referenceDate);
      break;
    }
    case "week": {
      rangeStart = startOfWeek(referenceDate);
      rangeEnd = endOfWeek(referenceDate);
      break;
    }
    case "month":
    default: {
      rangeStart = startOfMonth(referenceDate);
      rangeEnd = endOfMonth(referenceDate);
      break;
    }
  }

  const [tasks, studySessions, dailyPlans, completions] = await Promise.all([
    prisma.task.findMany({
      where: {
        userId: user.id,
        dueDate: {
          gte: rangeStart,
          lte: rangeEnd,
        },
      },
      include: { category: true },
      orderBy: [{ dueDate: "asc" }, { sequenceOrder: "asc" }],
    }),
    prisma.studySession.findMany({
      where: {
        userId: user.id,
        startedAt: {
          gte: rangeStart,
          lte: rangeEnd,
        },
      },
      orderBy: { startedAt: "asc" },
    }),
    prisma.task.findMany({
      where: {
        userId: user.id,
        isPersonalDaily: true,
      },
      include: { category: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.taskCompletion.findMany({
      where: {
        userId: user.id,
        completedAt: {
          gte: rangeStart,
          lte: rangeEnd,
        },
      },
      select: { taskId: true, completedAt: true },
    }),
  ]);

  const completedTaskIds = new Set(completions.map((c) => c.taskId));
  const completionTimes = new Map(completions.map((c) => [c.taskId, c.completedAt]));

  const tasksWithMeta = tasks.map((task) => ({
    ...task,
    isCompleted: task.status === "COMPLETED" || completedTaskIds.has(task.id),
    completedAt: completionTimes.get(task.id) ?? task.completedAt,
    isOverdue: task.dueDate && isBeforeDay(task.dueDate, new Date()) && task.status !== "COMPLETED" && !completedTaskIds.has(task.id),
    isToday: task.dueDate && isSameDay(task.dueDate, new Date()),
  }));

  const studySessionsWithMeta = studySessions.map((session) => ({
    ...session,
    date: session.startedAt,
    isToday: isSameDay(session.startedAt, new Date()),
  }));

  const dailyPlansWithMeta = dailyPlans.map((task) => ({
    ...task,
    isCompleted: completedTaskIds.has(task.id),
    completedAt: completionTimes.get(task.id),
    isToday: true,
  }));

  return NextResponse.json({
    view,
    date: referenceDate.toISOString(),
    timezone: userTimezone,
    range: { start: rangeStart.toISOString(), end: rangeEnd.toISOString() },
    tasks: tasksWithMeta,
    studySessions: studySessionsWithMeta,
    dailyPlans: dailyPlansWithMeta,
    stats: {
      totalTasks: tasks.length,
      completedTasks: tasksWithMeta.filter((t) => t.isCompleted).length,
      overdueTasks: tasksWithMeta.filter((t) => t.isOverdue).length,
      totalStudyMinutes: studySessions.reduce((sum, s) => sum + s.durationMinutes, 0),
      dailyPlanCount: dailyPlans.length,
    },
  });
}