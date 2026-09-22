import { prisma } from "@/lib/prisma";

/**
 * The user's "today" feed: personal routines plus roadmap tasks from linked roadmaps.
 * Routines are judged by a per-day TaskCompletion, roadmap tasks by their own completion.
 */
export async function getDailyItems(userId: string, at = new Date()) {
  const start = new Date(at);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start.getTime() + 86_400_000);

  const [routines, completions, linkedRoadmaps, pins] = await Promise.all([
    prisma.task.findMany({
      where: { userId, isPersonalDaily: true },
      include: { category: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.taskCompletion.findMany({
      where: { userId, completedAt: { gte: start, lt: end } },
      select: { taskId: true },
    }),
    (prisma as any).userDailyRoadmap.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    }),
    prisma.dailyTaskPin.findMany({
      where: { userId, task: { status: { not: "COMPLETED" } } },
      include: { task: { include: { category: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const doneToday = new Set(completions.map((completion: any) => completion.taskId));
  
  // Get tasks from linked roadmaps
  const roadmapTasks = linkedRoadmaps.flatMap((linked: any) => 
    linked.roadmap?.tasks?.map((task: any) => ({
      pinId: `roadmap-${linked.roadmapId}-${task.id}`,
      task: {
        ...task,
        title: `${linked.roadmap?.title || 'Roadmap'}: ${task.title}`,
        milestoneTitle: linked.roadmap?.title
      }
    })) || []
  );

  return {
    routines: routines.map((task: any) => ({
      ...task,
      doneToday: doneToday.has(task.id),
    })),
    connected: [...pins, ...roadmapTasks].map(item => ({
      pinId: item.pinId,
      task: item.task
    })),
  };
}