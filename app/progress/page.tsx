import type { Metadata } from "next";
import AppShell from "@/app/components/shell";
import { PageHeader, Sheet, SectionHead, ProgressBar, Stamp } from "@/app/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toPercent, formatMinutes } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Progress",
  description: "Your study progress and analytics",
};

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const user = await getCurrentUser();
  if (!user) {
    return <div>Please sign in to view progress.</div>;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 86_400_000);

  const [todayTasks, allTasks, studySessions, roadmapCount] = await Promise.all([
    prisma.task.findMany({
      where: {
        userId: user.id,
        dueDate: { gte: today, lt: tomorrow },
        OR: [
          { isPersonalDaily: true },
          { roadmapId: null },
        ],
      },
      select: { status: true },
    }),
    prisma.task.findMany({
      where: { userId: user.id },
      select: { status: true },
    }),
    prisma.studySession.findMany({
      where: { userId: user.id, startedAt: { gte: today } },
      select: { durationMinutes: true },
    }),
    prisma.userRoadmap.count({
      where: { userId: user.id },
    }),
  ]);

  const completedToday = todayTasks.filter((t) => t.status === "COMPLETED").length;
  const progressPercent = toPercent(completedToday, todayTasks.length || 1);
  const totalCompleted = allTasks.filter((t) => t.status === "COMPLETED").length;
  const overallPercent = toPercent(totalCompleted, allTasks.length || 1);
  const studyMinutes = studySessions.reduce((s, t) => s + t.durationMinutes, 0);

  return (
    <AppShell active="progress">
      <main className="px-6 py-8 sm:px-8 lg:px-12">
        <Sheet>
          <PageHeader
            title="Progress"
            subtitle="Your study progress and performance analytics"
          />

          <div className="grid gap-8 mt-8 md:grid-cols-2">
            <div>
              <SectionHead
                index="01"
                title="Daily Completion"
                instruction="Tasks completed today"
                aside={`${progressPercent}%`}
              />
              <div className="mt-4">
                <ProgressBar value={progressPercent} />
                <div className="mt-2 font-mono text-[0.7rem] text-graphite-faint">
                  <span>{completedToday} of {todayTasks.length} tasks finished</span>
                </div>
              </div>
            </div>

            <div>
              <SectionHead
                index="02"
                title="Overall Progress"
                instruction="All roadmap tasks completed"
                aside={`${overallPercent}%`}
              />
              <div className="mt-4">
                <ProgressBar value={overallPercent} />
                <div className="mt-2 font-mono text-[0.7rem] text-graphite-faint">
                  <span>{totalCompleted} of {allTasks.length} tasks finished</span>
                </div>
              </div>
            </div>

            <div>
              <SectionHead
                index="03"
                title="Study Time"
                instruction="Focus time logged today"
              />
              <div className="mt-4">
                <div className="font-mono text-[1.5rem] font-semibold text-graphite">
                  {formatMinutes(studyMinutes)}
                </div>
                <p className="mt-1 text-[0.85rem] text-graphite-muted">
                  of {formatMinutes(user.dailyStudyTargetMinutes)} daily target
                </p>
              </div>
            </div>

            <div>
              <SectionHead
                index="04"
                title="Roadmaps"
                instruction="Active roadmaps in your workspace"
              />
              <div className="mt-4">
                <div className="font-mono text-[1.5rem] font-semibold text-graphite">
                  {roadmapCount}
                </div>
                <p className="mt-1 text-[0.85rem] text-graphite-muted">
                  roadmaps enrolled
                </p>
              </div>
            </div>
          </div>
        </Sheet>
      </main>
    </AppShell>
  );
}
