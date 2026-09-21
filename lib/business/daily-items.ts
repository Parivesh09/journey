import { prisma } from "@/lib/prisma";

/**
 * The user's "today" feed: personal routines plus roadmap tasks explicitly
 * connected via DailyTaskPin. Routines are judged by a per-day TaskCompletion,
 * connected tasks by their own completion (consuming the pin).
 */
export async function getDailyItems(userId: string, at = new Date()) {
  const start = new Date(at);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start.getTime() + 86_400_000);

  const [routines, completions, pins] = await Promise.all([
    prisma.task.findMany({
      where: { userId, isPersonalDaily: true },
      include: { category: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.taskCompletion.findMany({
      where: { userId, completedAt: { gte: start, lt: end } },
      select: { taskId: true },
    }),
    prisma.dailyTaskPin.findMany({
      where: { userId, task: { status: { not: "COMPLETED" } } },
      include: { task: { include: { category: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const doneToday = new Set(completions.map((completion) => completion.taskId));
  return {
    routines: routines.map((task) => ({
      ...task,
      doneToday: doneToday.has(task.id),
    })),
    connected: pins.map((pin) => ({ pinId: pin.id, task: pin.task })),
  };
}