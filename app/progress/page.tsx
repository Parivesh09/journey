import type { Metadata } from "next";
import AppShell from "@/app/components/shell";
import { PageHeader, Sheet, SectionHead, ProgressBar, Card, CardContent, Num, Stamp } from "@/app/components/ui";
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
    return (
      <AppShell active="progress" user={null}>
        <main className="px-6 py-8 sm:px-8 lg:px-12">
          <Sheet>
            <div className="text-center py-12">
              <p className="text-graphite-muted">Please sign in to view progress.</p>
            </div>
          </Sheet>
        </main>
      </AppShell>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 86_400_000);

const weekAgo = new Date(Date.now() - 7 * 86_400_000);
  const [todayTasks, allTasks, studySessions, roadmapCount, sessionsThisWeek, allTimeMinutes] = await Promise.all([
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
      select: { durationMinutes: true, startedAt: true },
    }),
    prisma.userRoadmap.count({
      where: { userId: user.id },
    }),
    prisma.studySession.findMany({
      where: { userId: user.id, startedAt: { gte: weekAgo } },
      select: { durationMinutes: true, startedAt: true },
    }),
    prisma.studySession.aggregate({
      where: { userId: user.id },
      _sum: { durationMinutes: true },
    }),
  ]);

  const completedToday = todayTasks.filter((t) => t.status === "COMPLETED").length;
  const progressPercent = toPercent(completedToday, todayTasks.length || 1);
  const totalCompleted = allTasks.filter((t) => t.status === "COMPLETED").length;
  const overallPercent = toPercent(totalCompleted, allTasks.length || 1);
  const studyMinutes = studySessions.reduce((s, t) => s + t.durationMinutes, 0);

  // Weekly activity data
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date.getTime() + 86_400_000);
    const minutes = studySessions.filter(s => s.startedAt >= date && s.startedAt < nextDay)
      .reduce((sum, s) => sum + s.durationMinutes, 0);
    return { day: date.toLocaleDateString("en-US", { weekday: "short" }), minutes };
  });

  // Roadmap progress
  const userRoadmaps = await prisma.userRoadmap.findMany({
    where: { userId: user.id },
    select: { roadmapId: true, activatedAt: true },
  });

  const { readRoadmap } = await import("@/lib/business/roadmap-templates");
  const roadmapProgress = await Promise.all(
    userRoadmaps.map(async ({ roadmapId }) => {
      try {
        const template = readRoadmap(roadmapId);
        const totalTasks = template.phases.reduce(
          (sum, p) => sum + (p.topics ?? []).reduce((tSum, t) => tSum + (t.tasks ?? []).length, 0),
          0,
        );
        const completedTasks = await prisma.task.count({
          where: { userId: user.id, roadmapId, status: "COMPLETED" },
        });
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        return { title: template.title, progress, completed: completedTasks, total: totalTasks };
      } catch {
        return null;
      }
    })
  ).then(results => results.filter((r): r is NonNullable<typeof r> => r !== null));

  return (
    <AppShell active="progress" user={{ name: user.name, email: user.email }}>
      <main className="px-6 py-8 sm:px-8 lg:px-12">
        <Sheet>
          <PageHeader
            title="Progress"
            subtitle="Your study journey — track growth, consistency, and mastery"
          />

          {/* Hero Stats */}
          <div className="grid grid-cols-1 gap-4 mb-10 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <p className="label relative z-10">Today's Progress</p>
              <p className="mt-1 text-3xl font-bold text-foreground font-display relative z-10">
                <Num>{completedToday}</Num>
                <span className="text-foreground/50 ml-1">/</span>
                <Num className="text-foreground/50">{todayTasks.length || 0}</Num>
              </p>
              <div className="mt-3 relative z-10">
                <ProgressBar value={progressPercent} />
                <p className="mt-1 caption">{progressPercent}% complete</p>
              </div>
            </Card>

            <Card className="p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <p className="label relative z-10">Overall Progress</p>
              <p className="mt-1 text-3xl font-bold text-foreground font-display relative z-10">
                <Num>{totalCompleted}</Num>
                <span className="text-foreground/50 ml-1">/</span>
                <Num className="text-foreground/50">{allTasks.length || 0}</Num>
              </p>
              <div className="mt-3 relative z-10">
                <ProgressBar value={overallPercent} />
                <p className="mt-1 caption">{overallPercent}% complete</p>
              </div>
            </Card>

            <Card className="p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <p className="label relative z-10">Study Time Today</p>
              <p className="mt-1 text-3xl font-bold text-foreground font-display relative z-10">
                <Num>{formatMinutes(studyMinutes)}</Num>
              </p>
              <p className="mt-1 caption relative z-10">of {formatMinutes(user.dailyStudyTargetMinutes)} target</p>
              <ProgressBar value={Math.min(100, Math.round((studyMinutes / user.dailyStudyTargetMinutes) * 100))} variant="accent" />
            </Card>

            <Card className="p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <p className="label relative z-10">Current Streak</p>
              <div className="flex items-center gap-3 mt-2 relative z-10">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <span className="text-primary font-semibold">🔥</span>
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground font-display">12</p>
                  <p className="caption">days</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Weekly Activity Chart */}
          <div className="mb-10">
            <SectionHead
              index="01"
              title="Weekly Activity"
              instruction="Your focus time across the last 7 days"
            />
            <Card>
              <CardContent className="p-6">
                <div className="flex items-end justify-between gap-2 h-32">
                  {weeklyData.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div
                        className="w-full bg-primary rounded-t transition-all hover:bg-primary/80"
                        style={{ height: `${Math.max(4, (d.minutes / 180) * 100)}%`, minHeight: "4px" }}
                      />
                      <span className="label">{d.day}</span>
                      <span className="caption text-graphite-muted">{d.minutes > 0 ? formatMinutes(d.minutes) : "—"}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Roadmap Progress */}
          {roadmapProgress.length > 0 && (
            <>
              <SectionHead
                index="02"
                title="Roadmap Progress"
                instruction="Your progress across enrolled curriculums"
              />
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-10">
                {roadmapProgress.map((rp) => (
                  <Card key={rp.title} className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-foreground font-display">{rp.title}</h3>
                      <Stamp tone={rp.progress === 100 ? "valid" : "amber"}>{rp.progress}%</Stamp>
                    </div>
                    <ProgressBar value={rp.progress} />
                    <p className="mt-2 caption text-graphite-muted">
                      <Num>{rp.completed}</Num> of <Num>{rp.total}</Num> tasks
                    </p>
                  </Card>
                ))}
              </div>
            </>
          )}

          {/* All-Time Stats */}
          <SectionHead
            index="03"
            title="All-Time Stats"
            instruction="Your cumulative learning journey"
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card className="p-5 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mx-auto mb-3">
                <span className="text-primary text-2xl">⏱</span>
              </div>
              <p className="text-3xl font-bold text-foreground font-display">
                <Num>{formatMinutes(allTimeMinutes._sum.durationMinutes ?? 0)}</Num>
              </p>
              <p className="caption mt-1">Total Focus Time</p>
            </Card>
            <Card className="p-5 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 mx-auto mb-3">
                <span className="text-accent text-2xl">✓</span>
              </div>
              <p className="text-3xl font-bold text-foreground font-display">
                <Num>{totalCompleted}</Num>
              </p>
              <p className="caption mt-1">Tasks Completed</p>
            </Card>
            <Card className="p-5 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mx-auto mb-3">
                <span className="text-primary text-2xl">📚</span>
              </div>
              <p className="text-3xl font-bold text-foreground font-display">
                <Num>{roadmapCount}</Num>
              </p>
              <p className="caption mt-1">Roadmaps Enrolled</p>
            </Card>
          </div>
        </Sheet>
      </main>
    </AppShell>
  );
}