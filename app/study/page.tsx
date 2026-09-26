import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppShell from "@/app/components/shell";
import { PageHeader, Sheet, SectionHead, Card, CardContent, Num, ProgressBar, Stamp, Loader } from "@/app/components/ui";
import { formatMinutes } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Study Sessions",
  description: "Focused study sessions with timer and progress tracking",
};

export default async function StudyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 86_400_000);

  const [studySessions, activeRoadmapIds, totalMinutesToday] = await Promise.all([
    prisma.studySession.findMany({
      where: { userId: user.id, startedAt: { gte: today } },
      orderBy: { startedAt: "desc" },
      select: { id: true, durationMinutes: true, startedAt: true, endedAt: true, taskId: true },
    }),
    prisma.userRoadmap.findMany({
      where: { userId: user.id },
      select: { roadmapId: true },
    }).then(rows => rows.map(r => r.roadmapId)),
    prisma.studySession.aggregate({
      where: { userId: user.id, startedAt: { gte: today } },
      _sum: { durationMinutes: true },
    }),
  ]);

  // Load roadmap data from templates
  const { readRoadmap } = await import("@/lib/business/roadmap-templates");
  const activeRoadmaps = await Promise.all(
    activeRoadmapIds.map(async (roadmapId) => {
      try {
        const roadmap = readRoadmap(roadmapId);
        return roadmap;
      } catch {
        return null;
      }
    })
  ).then(results => results.filter(Boolean));

  const totalMinutesAllTime = await prisma.studySession.aggregate({
    where: { userId: user.id },
    _sum: { durationMinutes: true },
  });

  const weekAgo = new Date(Date.now() - 7 * 86_400_000);
  const sessionsThisWeek = await prisma.studySession.findMany({
    where: {
      userId: user.id,
      startedAt: { gte: weekAgo },
    },
    select: { durationMinutes: true, startedAt: true },
  });

  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date.getTime() + 86_400_000);
    const minutes = sessionsThisWeek
      .filter(s => s.startedAt >= date && s.startedAt < nextDay)
      .reduce((sum, s) => sum + s.durationMinutes, 0);
    return { day: date.toLocaleDateString("en-US", { weekday: "short" }), minutes };
  });

  return (
    <AppShell active="study-sessions" user={{ name: user.name, email: user.email }}>
      <main className="px-6 py-8 sm:px-8 lg:px-12">
        <Sheet>
          <PageHeader
            title="Study Sessions"
            subtitle="Focused practice with timer and roadmap context"
            action={
              <button className="btn btn-primary" disabled>
                Start Session
              </button>
            }
          />

          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 mb-10 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-5">
              <p className="label">Today</p>
              <p className="mt-1 text-3xl font-bold text-foreground font-display">
                <Num>{formatMinutes(totalMinutesToday._sum.durationMinutes ?? 0)}</Num>
              </p>
              <p className="mt-1 caption">of {formatMinutes(user.dailyStudyTargetMinutes)} target</p>
              <ProgressBar value={Math.min(100, Math.round(((totalMinutesToday._sum.durationMinutes ?? 0) / user.dailyStudyTargetMinutes) * 100))} />
            </Card>

            <Card className="p-5">
              <p className="label">This Week</p>
              <p className="mt-1 text-3xl font-bold text-foreground font-display">
                <Num>{formatMinutes(weeklyData.reduce((sum, d) => sum + d.minutes, 0))}</Num>
              </p>
              <p className="mt-1 caption">across 7 days</p>
            </Card>

            <Card className="p-5">
              <p className="label">All Time</p>
              <p className="mt-1 text-3xl font-bold text-foreground font-display">
                <Num>{formatMinutes(totalMinutesAllTime._sum.durationMinutes ?? 0)}</Num>
              </p>
              <p className="mt-1 caption">total focus time</p>
            </Card>

            <Card className="p-5">
              <p className="label">Current Streak</p>
              <div className="flex items-center gap-3 mt-2">
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

          {/* Weekly Activity */}
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
                        style={{ height: `${Math.max(4, (d.minutes / 120) * 100)}%`, minHeight: "4px" }}
                      />
                      <span className="label">{d.day}</span>
                      <span className="caption text-graphite-muted">{d.minutes > 0 ? formatMinutes(d.minutes) : "—"}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Session History */}
          <SectionHead
            index="02"
            title="Recent Sessions"
            instruction="Your logged focus time"
            aside={`${studySessions.length} sessions`}
          />

          {studySessions.length === 0 ? (
            <EmptyState
              title="No sessions yet"
              description="Start your first focused study session to begin tracking."
              action={
                <button className="btn btn-primary" disabled>
                  Start Session
                </button>
              }
            />
          ) : (
            <Card>
              <div className="divide-y divide-border">
                {studySessions.map((session) => (
                  <div key={session.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <span className="text-primary font-semibold">⏱</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {session.taskId ? `Task session` : `General focus`}
                        </p>
                        <p className="text-xs text-graphite-muted">
                          {session.startedAt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-foreground font-display font-mono tabular-nums">
                        {formatMinutes(session.durationMinutes)}
                      </p>
                      <p className="caption text-graphite-muted">
                        {session.endedAt ? `Ended ${session.endedAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}` : "In progress"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </Sheet>
      </main>
    </AppShell>
  );
}

function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="text-center py-16 px-8 card">
      <p className="text-[1.25rem] font-semibold text-foreground font-display">
        {title}
      </p>
      <p className="mt-2 text-[1rem] text-graphite-muted max-w-[40ch] mx-auto leading-relaxed">
        {description}
      </p>
      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </div>
  );
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}