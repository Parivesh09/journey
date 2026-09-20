import { prisma } from "@/lib/prisma";
import { dailyBlocks, dateKey } from "@/lib/business/roadmap-provision";

export async function ensureDailyTasks(userId: string, date = new Date()) {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  const nextDay = new Date(day);
  nextDay.setDate(nextDay.getDate() + 1);
  const key = dateKey(day);

  const existingCount = await prisma.task.count({
    where: { userId, isDailyTask: true, dueDate: { gte: day, lt: nextDay } },
  });
  if (existingCount >= dailyBlocks.length) return;

  const categories = await prisma.taskCategory.findMany({
    where: { userId, name: { in: ["DSA", "System Design", "DEVELOPMENT"] } },
  });
  const categoryMap = new Map(
    categories.map((category) => [category.name, category.id]),
  );

  for (const block of dailyBlocks) {
    const sourceId = `daily-${key}-${block.slot}`;
    const exists = await prisma.task.findFirst({
      where: { userId, sourceId },
      select: { id: true },
    });
    if (exists) continue;

    // Create-only: once a user owns a daily task they may edit or delete it;
    // regeneration must never resurrect or overwrite their changes.
    await prisma.task.create({
      data: {
        userId,
        title: block.title,
        description: block.description,
        categoryId: categoryMap.get(block.category),
        priority: "HIGH",
        estimatedMinutes: block.minutes,
        plannedMinutes: block.minutes,
        dueDate: day,
        taskType: block.taskType,
        sourceId,
        sequenceOrder: block.order,
        dailySlot: block.slot,
        isDailyTask: true,
      },
    });
  }
}