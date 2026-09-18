import { prisma } from "@/lib/prisma";

const dailyBlocks = [
  {
    slot: "DSA_PRACTICE",
    title: "DSA practice: solve 3 questions",
    description:
      "Solve three DSA questions and record the pattern, complexity, and mistakes.",
    category: "DSA",
    taskType: "practice",
    minutes: 60,
    order: -4,
  },
  {
    slot: "SYSTEM_DESIGN",
    title: "System design study",
    description: "Spend one focused hour on the next system design topic.",
    category: "System Design",
    taskType: "concept",
    minutes: 60,
    order: -3,
  },
  {
    slot: "NEW_DSA_LEARNING",
    title: "New DSA learning",
    description: "Learn and explain one new DSA concept without notes.",
    category: "DSA",
    taskType: "concept",
    minutes: 60,
    order: -2,
  },
  {
    slot: "DEVELOPMENT",
    title: "Development study",
    description:
      "Spend one focused hour on the next development topic or implementation task.",
    category: "DEVELOPMENT",
    taskType: "implementation",
    minutes: 60,
    order: -1,
  },
] as const;

export async function ensureDailyTasks(userId: string, date = new Date()) {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  const nextDay = new Date(day);
  nextDay.setDate(nextDay.getDate() + 1);
  const dateKey = day.toISOString().slice(0, 10);

  const existing = await prisma.task.count({
    where: { userId, isDailyTask: true, dueDate: { gte: day, lt: nextDay } },
  });
  if (existing >= dailyBlocks.length) return;

  const categories = await prisma.taskCategory.findMany({
    where: { userId, name: { in: ["DSA", "System Design", "DEVELOPMENT"] } },
  });
  const categoryMap = new Map(
    categories.map((category) => [category.name, category.id]),
  );

  for (const block of dailyBlocks) {
    const sourceId = `daily-${dateKey}-${block.slot}`;
    const data = {
      userId,
      title: block.title,
      description: block.description,
      categoryId: categoryMap.get(block.category),
      priority: "HIGH" as const,
      estimatedMinutes: block.minutes,
      plannedMinutes: block.minutes,
      dueDate: day,
      taskType: block.taskType,
      sourceId,
      sequenceOrder: block.order,
      dailySlot: block.slot,
      isDailyTask: true,
    };
    await prisma.task.upsert({
      where: { userId_sourceId: { userId, sourceId } },
      update: data,
      create: data,
    });
  }
}
