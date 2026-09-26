import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Target, Flag, BookOpen, Clock } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readRoadmap } from "@/lib/business/roadmap-templates";
import AppShell from "@/app/components/shell";
import { PageHeader, Sheet, SectionHead, Stamp, Card, CardContent, Num, ProgressBar } from "@/app/components/ui";
import TemplateAccordion from "../template-accordion";

export const metadata: Metadata = {
  title: "Roadmap Details",
  description: "Explore roadmap structure, phases, topics, and tasks",
};

export default async function RoadmapDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const paramsValue = await params;
  const rawId = paramsValue.id;

  const user = await getCurrentUser();
  if (!user) {
    return (
      <AppShell active="roadmap" user={null}>
        <main className="px-6 py-8 sm:px-8 lg:px-12">
          <Sheet>
            <div className="text-center py-12">
              <p className="text-graphite-muted">Please sign in to view roadmap details.</p>
            </div>
          </Sheet>
        </main>
      </AppShell>
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
    completedMilestones = userMilestones.filter(m => m.milestoneId).length;
    overallProgress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
  }

  return (
    <AppShell active="roadmap" user={{ name: user.name, email: user.email }}>
      <main className="px-6 py-8 sm:px-8 lg:px-12">
        <Sheet>
          <Link
            href="/roadmaps"
            className="inline-flex items-center gap-1.5 font-mono text-sm text-graphite-muted hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to roadmaps
          </Link>

          {/* Hero Section */}
          <div className="mb-10">
            <div className="flex items-start justify-between gap-6 mb-6">
              <div className="max-w-3xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="label text-primary">Roadmap</p>
                    <h1 className="text-3xl font-bold text-foreground font-display tracking-tight">
                      {template.title}
                    </h1>
                  </div>
                </div>
                {template.description && (
                  <p className="text-base text-graphite-muted max-w-2xl leading-relaxed">
                    {template.description}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0">
                {activated ? (
                  <Stamp tone="valid" className="text-sm">Enrolled · Active</Stamp>
                ) : (
                  <button type="button" className="btn btn-primary px-6 py-3 text-sm font-medium">
                    Activate Roadmap
                  </button>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            {activated && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="label">Overall Progress</span>
                  <span className="font-mono text-lg font-semibold text-primary">{overallProgress}%</span>
                </div>
                <ProgressBar value={overallProgress} />
                <p className="mt-2 caption">
                  {completedMilestones} of {totalMilestones} milestones complete
                </p>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Flag className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="label">Milestones</p>
                    <p className="text-2xl font-bold text-foreground font-display">
                      <Num>{totalMilestones}</Num>
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Flag className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="label">Phases</p>
                    <p className="text-2xl font-bold text-foreground font-display">
                      <Num>{totalPhases}</Num>
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="label">Topics</p>
                    <p className="text-2xl font-bold text-foreground font-display">
                      <Num>{totalTopics}</Num>
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="label">Tasks</p>
                    <p className="text-2xl font-bold text-foreground font-display">
                      <Num>{totalTasks}</Num>
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {template.milestones.length > 0 && (
            <SectionHead
              index="01"
              title="Milestones"
              instruction="High-level target checkpoints in this roadmap"
            />
          )}

          <TemplateAccordion
            milestones={template.milestones}
            phases={template.phases}
          />
        </Sheet>
      </main>
    </AppShell>
  );
}