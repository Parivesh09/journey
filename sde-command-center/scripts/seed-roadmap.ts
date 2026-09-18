import fs from "node:fs";
import path from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const roadmapPath = path.resolve(__dirname, "../../sde-master-roadmap.json");
const roadmapData = JSON.parse(fs.readFileSync(roadmapPath, "utf-8"));

async function main() {
  if (!roadmapData || !roadmapData.phases) {
    throw new Error("Roadmap JSON is missing phases");
  }

  const existingUser = await prisma.user.findFirst({
    where: { email: "user@sdecommand.center" },
  });

  const user =
    existingUser ??
    (await prisma.user.create({
      data: {
        email: "user@sdecommand.center",
        name: "SDE User",
      },
    }));

  await prisma.notificationPreference.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      browserEnabled: true,
      emailEnabled: true,
      linqEnabled: true,
      dailyReminderEnabled: true,
      missedTaskReminderEnabled: true,
      minNotificationInterval: 180,
      maxDailyNotifications: 8,
    },
  });

  const categoryNames = new Set<string>([
    "DSA",
    "CS FUNDAMENTALS",
    "DEVELOPMENT",
    "SYSTEM DESIGN",
    "PROJECT",
    "REVISION",
    "MOCK INTERVIEW",
    "OTHER",
  ]);

  for (const phase of roadmapData.phases ?? []) {
    if (phase.category) {
      categoryNames.add(phase.category);
    }

    for (const topic of phase.topics ?? []) {
      if (topic.category) {
        categoryNames.add(topic.category);
      }
    }
  }

  const categories = await prisma.taskCategory.findMany({
    where: { userId: user.id },
  });
  const categoryMap = new Map(
    categories.map((category) => [category.name, category.id]),
  );

  for (const categoryName of [...categoryNames].sort()) {
    if (!categoryMap.has(categoryName)) {
      const createdCategory = await prisma.taskCategory.create({
        data: {
          name: categoryName,
          userId: user.id,
        },
      });

      categoryMap.set(categoryName, createdCategory.id);
    }
  }

  const tasksToSeed: Array<{
    title: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    status: "TODO" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED";
    categoryId?: string;
    taskType?: string;
    difficulty?: string;
    sourceId?: string;
    phaseId?: string;
    phaseTitle?: string;
    topicId?: string;
    topicTitle?: string;
    sequenceOrder: number;
    dueDate: Date;
    estimatedMinutes?: number;
  }> = [];

  const scheduleStart = new Date();
  scheduleStart.setHours(0, 0, 0, 0);
  let sequenceOrder = 0;
  let scheduleOffset = 0;

  for (const phase of roadmapData.phases ?? []) {
    const phaseStartOffset = scheduleOffset;
    for (const topic of phase.topics ?? []) {
      const topicDate = new Date(scheduleStart);
      topicDate.setDate(topicDate.getDate() + scheduleOffset);
      for (const task of topic.tasks ?? []) {
        const priority = (task.priority ?? "medium").toUpperCase();
        const status = (task.status ?? "todo").toUpperCase();

        tasksToSeed.push({
          title: task.title,
          priority:
            priority === "CRITICAL" ||
            priority === "HIGH" ||
            priority === "MEDIUM" ||
            priority === "LOW"
              ? priority
              : "MEDIUM",
          status:
            status === "TODO" ||
            status === "IN_PROGRESS" ||
            status === "COMPLETED" ||
            status === "SKIPPED"
              ? status
              : "TODO",
          categoryId: categoryMap.get(
            topic.category ?? phase.category ?? "OTHER",
          ),
          taskType: task.type,
          difficulty: task.difficulty,
          sourceId: task.id,
          phaseId: phase.id,
          phaseTitle: phase.title,
          topicId: topic.id,
          topicTitle: topic.title,
          sequenceOrder,
          dueDate: topicDate,
          estimatedMinutes: Math.max(
            30,
            Math.round(
              ((topic.estimated_days ?? 1) * 45) /
                Math.max(1, topic.tasks?.length ?? 1),
            ),
          ),
        });
        sequenceOrder += 1;
      }

      scheduleOffset += Math.max(1, topic.estimated_days ?? 1);
    }

    if (scheduleOffset === phaseStartOffset) {
      scheduleOffset += 1;
    }
  }

  for (const task of tasksToSeed) {
    const existingTask = task.sourceId
      ? await prisma.task.findFirst({
          where: { userId: user.id, sourceId: task.sourceId },
        })
      : null;

    const data = {
      userId: user.id,
      title: task.title,
      priority: task.priority,
      categoryId: task.categoryId,
      taskType: task.taskType,
      difficulty: task.difficulty,
      sourceId: task.sourceId,
      phaseId: task.phaseId,
      phaseTitle: task.phaseTitle,
      topicId: task.topicId,
      topicTitle: task.topicTitle,
      sequenceOrder: task.sequenceOrder,
      dueDate: task.dueDate,
      estimatedMinutes: task.estimatedMinutes,
    };

    if (existingTask) {
      await prisma.task.update({ where: { id: existingTask.id }, data });
    } else {
      await prisma.task.create({ data: { ...data, status: task.status } });
    }
  }

  const dailyDate = new Date();
  dailyDate.setHours(0, 0, 0, 0);
  const dailyDateKey = dailyDate.toISOString().slice(0, 10);
  const dailyTasks = [
    {
      slot: "DSA_PRACTICE",
      title: "DSA practice: solve 3 questions",
      description:
        "Solve three DSA questions and record the pattern, complexity, and mistakes.",
      category: "DSA",
      type: "practice",
      minutes: 60,
      order: -4,
    },
    {
      slot: "SYSTEM_DESIGN",
      title: "System design study",
      description: "Spend one focused hour on the next system design topic.",
      category: "System Design",
      type: "concept",
      minutes: 60,
      order: -3,
    },
    {
      slot: "NEW_DSA_LEARNING",
      title: "New DSA learning",
      description: "Learn and explain one new DSA concept without notes.",
      category: "DSA",
      type: "concept",
      minutes: 60,
      order: -2,
    },
    {
      slot: "DEVELOPMENT",
      title: "Development study",
      description:
        "Spend one focused hour on the next development topic or implementation task.",
      category: "DEVELOPMENT",
      type: "implementation",
      minutes: 60,
      order: -1,
    },
  ] as const;

  for (const dailyTask of dailyTasks) {
    const sourceId = `daily-${dailyDateKey}-${dailyTask.slot}`;
    const existingDailyTask = await prisma.task.findFirst({
      where: { userId: user.id, sourceId },
    });
    const categoryId = categoryMap.get(dailyTask.category);
    const data = {
      userId: user.id,
      title: dailyTask.title,
      description: dailyTask.description,
      categoryId,
      priority: "HIGH" as const,
      estimatedMinutes: dailyTask.minutes,
      dueDate: dailyDate,
      taskType: dailyTask.type,
      sourceId,
      sequenceOrder: dailyTask.order,
      dailySlot: dailyTask.slot,
      plannedMinutes: dailyTask.minutes,
      isDailyTask: true,
    };

    if (existingDailyTask) {
      await prisma.task.update({ where: { id: existingDailyTask.id }, data });
    } else {
      await prisma.task.create({ data });
    }
  }

  console.log("Roadmap seed complete");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
