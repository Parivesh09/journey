/**
 * Remove orphaned roadmap tasks (tasks cloned from a roadmap template that
 * have no corresponding UserRoadmap enrollment). This happens when
 * provisionRoadmapForUser was called directly (e.g. the old signup route)
 * without going through the public POST /api/roadmaps endpoint, which is the
 * only path that also creates a UserRoadmap row.
 *
 * Safe to run: it only deletes tasks whose sourceId is set AND whose user has
 * no UserRoadmap row. Personal routines (isPersonalDaily) are never touched.
 */
import { prisma } from "@/lib/prisma";

const users = await prisma.user.findMany({
  where: { email: { not: { endsWith: "@example.com" } } },
  select: { id: true, email: true },
});

let totalDeleted = 0;
for (const user of users) {
  const enrolled = await prisma.userRoadmap.findUnique({
    where: { userId_roadmapId: { userId: user.id, roadmapId: "fullstack-v1" } },
  });
  if (enrolled) continue; // keep enrolled users' tasks

  const result = await prisma.task.deleteMany({
    where: {
      userId: user.id,
      sourceId: { not: null },
      isPersonalDaily: false,
    },
  });
  totalDeleted += result.count;
  if (result.count > 0) {
    console.log(`Cleared ${result.count} orphaned roadmap tasks for ${user.email}`);
  }
}

console.log(`Total orphaned tasks removed: ${totalDeleted}`);
await prisma.$disconnect();