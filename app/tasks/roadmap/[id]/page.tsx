import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readRoadmap } from "@/lib/business/roadmap-templates";
import RoadmapDetailClient from "./roadmap-detail-client";

export const metadata: Metadata = {
  title: "Roadmap Details",
  description: "Explore roadmap structure, phases, topics, and tasks",
};

export default async function RoadmapDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const paramsValue = await params;
  const rawId = paramsValue.id;

  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-graphite-muted">Please sign in to view roadmap details.</p>
      </div>
    );
  }

  const userActivated = await prisma.userRoadmap.findUnique({
    where: { userId_roadmapId: { userId: user.id, roadmapId: rawId } },
    select: { id: true },
  });

  const template = readRoadmap(rawId);
  const activated = !!userActivated;

  const totalPhases = template.phases.length;
  const totalTopics = template.phases.reduce(
    (sum, p) => sum + (p.topics ?? []).length,
    0,
  );
  const totalTasks = template.phases.reduce(
    (sum, p) =>
      sum +
      (p.topics ?? []).reduce((tSum, t) => tSum + (t.tasks ?? []).length, 0),
    0,
  );
  const totalMilestones = template.milestones.length;

  // Calculate overall progress if activated
  let overallProgress = 0;
  let completedMilestones = 0;
  if (activated) {
    const userMilestones = await prisma.userMilestone.findMany({
      where: { userId: user.id, roadmapId: rawId },
      select: { milestoneId: true },
    });
    completedMilestones = userMilestones.filter((m) => m.milestoneId).length;
    overallProgress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
  }

  return (
    <RoadmapDetailClient
      user={{ name: user.name, email: user.email }}
      template={template}
      activated={activated}
      overallProgress={overallProgress}
      completedMilestones={completedMilestones}
      totalMilestones={totalMilestones}
      totalPhases={totalPhases}
      totalTopics={totalTopics}
      totalTasks={totalTasks}
    />
  );
}