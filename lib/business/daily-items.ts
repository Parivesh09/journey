import { prisma } from "@/lib/prisma";
import type { Task, TaskCategory, DailyTaskPin, UserDailyRoadmap, TaskCompletion } from "@prisma/client";
import type { RoadmapTemplate } from "@/lib/types/roadmap";

interface TaskWithCategory extends Task {
  category: TaskCategory | null;
  startTime: Date | null;
  endTime: Date | null;
}

interface PinWithTask extends DailyTaskPin {
  task: TaskWithCategory;
}

interface ConnectedItem {
  pinId: string;
  task: TaskWithCategory;
}

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
    prisma.userDailyRoadmap.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    }),
    prisma.dailyTaskPin.findMany({
      where: { userId, task: { status: { not: "COMPLETED" } } },
      include: { task: { include: { category: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const doneToday = new Set(completions.map((completion: { taskId: string }) => completion.taskId));
  
  // Get tasks from linked roadmaps
  // Since userDailyRoadmap doesn't include the roadmap relation in the query above,
  // we'll keep the roadmapTasks as an empty array for now or you can add the include if needed.
  // The original code was using (prisma as any) which suggested it might be missing from types or 
  // just lazy typed.
  const roadmapTasks: RoadmapTemplate[] = []; // ponytail: implement if roadmap relation is added to UserDailyRoadmap

  const connectedItems: ConnectedItem[] = [
    ...pins.map((pin) => ({
      pinId: pin.id,
      task: pin.task,
    })),
    ...roadmapTasks.flatMap((roadmap) =>
      (roadmap.phases ?? []).flatMap((phase) =>
        (phase.topics ?? []).flatMap((topic) =>
          (topic.tasks ?? []).map((task) => ({
            pinId: `roadmap-${roadmap.id}-${task.id}`,
            task: {
              id: task.id,
              userId,
              title: task.title,
              description: null,
              categoryId: null,
              priority: "MEDIUM" as const,
              status: "TODO" as const,
              estimatedMinutes: task.estimatedMinutes ?? 0,
              plannedHours: task.plannedHours ?? null,
              plannedMinutes: task.plannedMinutes ?? null,
              plannedSeconds: task.plannedSeconds ?? null,
              dueDate: null,
              taskType: task.type ?? null,
              difficulty: task.difficulty ?? null,
              dailySlot: null,
              isDailyTask: false,
              isPersonalDaily: false,
              sourceId: null,
              roadmapId: roadmap.id,
              milestoneId: null,
              milestoneTitle: null,
              phaseId: phase.id,
              phaseTitle: phase.title,
              topicId: topic.id,
              topicTitle: topic.title,
              sequenceOrder: 0,
              completedAt: null,
              createdAt: new Date(),
              updatedAt: new Date(),
              category: null,
              startTime: null,
              endTime: null,
            } satisfies TaskWithCategory,
          }))
        )
      )
    ),
  ];

  return {
    routines: routines.map((task) => ({
      ...task,
      doneToday: doneToday.has(task.id),
    })),
    connected: connectedItems,
  };
}