import fs from "node:fs";
import path from "node:path";

import { prisma } from "@/lib/prisma";

export const ROADMAP_PATH = path.resolve(
  process.cwd(),
  "sde-master-roadmap.json",
);

export type RoadmapTask = {
  id: string;
  title: string;
  type?: string;
  difficulty?: string;
  status?: string;
};

export type RoadmapTopic = {
  id: string;
  title: string;
  category?: string;
  estimated_days?: number;
  tasks?: RoadmapTask[];
};

export type RoadmapPhase = {
  id: string;
  title: string;
  category?: string;
  topics?: RoadmapTopic[];
};

export type Roadmap = { phases?: RoadmapPhase[] };

export function readRoadmap(): Roadmap {
  return JSON.parse(fs.readFileSync(ROADMAP_PATH, "utf-8")) as Roadmap;
}

export const dailyBlocks = [
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

const defaultCategories = [
  "DSA",
  "CS FUNDAMENTALS",
  "DEVELOPMENT",
  "SYSTEM DESIGN",
  "PROJECT",
  "REVISION",
  "MOCK INTERVIEW",
  "OTHER",
];

function categoryNamesFor(roadmap: Roadmap) {
  const names = new Set(defaultCategories);
  for (const phase of roadmap.phases ?? []) {
    if (phase.category) names.add(phase.category);
    for (const topic of phase.topics ?? []) {
      if (topic.category) names.add(topic.category);
    }
  }
  return names;
}

/**
 * Copies the default SDE roadmap from the master JSON into a user's own task
 * instances. Idempotent and create-only: existing user tasks (recognized by
 * `sourceId`) are never overwritten, so user customization is preserved.
 * Returns counts of created rows.
 */
export async function provisionRoadmapForUser(
  userId: string,
  startDate = new Date(),
) {
  const roadmap = readRoadmap();
  const existingCategories = await prisma.taskCategory.findMany({
    where: { userId },
  });
  const categoryMap = new Map(
    existingCategories.map((category) => [category.name, category.id]),
  );

  for (const categoryName of [...categoryNamesFor(roadmap)].sort()) {
    if (categoryMap.has(categoryName)) continue;
    const created = await prisma.taskCategory.create({
      data: { name: categoryName, userId },
    });
    categoryMap.set(categoryName, created.id);
  }

  const scheduleStart = new Date(startDate);
  scheduleStart.setHours(0, 0, 0, 0);
  let sequenceOrder = 0;
  let scheduleOffset = 0;
  let tasksCreated = 0;
  let tasksSkipped = 0;

  for (const phase of roadmap.phases ?? []) {
    const phaseStartOffset = scheduleOffset;
    for (const topic of phase.topics ?? []) {
      const topicDate = new Date(scheduleStart);
      topicDate.setDate(topicDate.getDate() + scheduleOffset);
      for (const task of topic.tasks ?? []) {
        const existing = await prisma.task.findFirst({
          where: { userId, sourceId: task.id },
          select: { id: true },
        });

        if (!existing) {
          await prisma.task.create({
            data: {
              userId,
              title: task.title,
              priority: "MEDIUM",
              status: "TODO",
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
            },
          });
          tasksCreated += 1;
        } else {
          tasksSkipped += 1;
        }
        sequenceOrder += 1;
      }
      scheduleOffset += Math.max(1, topic.estimated_days ?? 1);
    }
    if (scheduleOffset === phaseStartOffset) scheduleOffset += 1;
  }

  return { categories: categoryMap.size, tasksCreated, tasksSkipped };
}

export function dailyBlockSourceId(dateKey: string, slot: string) {
  return `daily-${dateKey}-${slot}`;
}

export function dateKey(date: Date) {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day.toISOString().slice(0, 10);
}