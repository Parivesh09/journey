import { prisma } from "@/lib/prisma";
import {
  DEFAULT_ROADMAP_ID,
  milestoneForPhase,
  readRoadmap,
  type RoadmapTemplate,
} from "@/lib/business/roadmap-templates";

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

function categoryNamesFor(roadmap: RoadmapTemplate) {
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
 * Activates a roadmap template for the user (create-only, idempotent) and
 * clones its tasks into per-user Task rows. Existing user tasks recognized by
 * `sourceId` are never overwritten, so user customization is preserved. Each
 * task carries its roadmap + milestone identity for progress tracking.
 */
export async function provisionRoadmapForUser(
  userId: string,
  roadmapId: string = DEFAULT_ROADMAP_ID,
  startDate = new Date(),
) {
  const roadmap = readRoadmap(roadmapId);

  await prisma.userRoadmap.upsert({
    where: { userId_roadmapId: { userId, roadmapId: roadmap.id } },
    create: { userId, roadmapId: roadmap.id },
    update: {},
  });

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
    const milestone = milestoneForPhase(roadmap, phase.id);
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
              roadmapId: roadmap.id,
              milestoneId: milestone?.id,
              milestoneTitle: milestone?.title,
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

  return {
    roadmapId: roadmap.id,
    categories: categoryMap.size,
    tasksCreated,
    tasksSkipped,
  };
}