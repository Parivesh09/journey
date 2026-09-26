import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import AppShell from "@/app/components/shell";
import { PageHeader, Sheet, SectionHead, ProgressBar, Num, Card, CardContent, Stamp } from "@/app/components/ui";
import DashboardTaskList from "@/app/dashboard-task-list";
import OnboardingBanner from "@/app/onboarding-banner";
import FocusLog from "@/app/focus-log";
import { getCurrentUser } from "@/lib/auth";
import { getDailyItems } from "@/lib/business/daily-items";
import { defaultStudyPlan } from "@/lib/data/mock-data";
import { prisma } from "@/lib/prisma";
import { formatMinutes, toPercent } from "@/lib/utils";

export const dynamic = "force-dynamic";

function dayStart(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const today = dayStart(new Date());
  const tomorrow = new Date(today.getTime() + 86_400_000);

  const [todayTasks, allTasks, studySessions, dailyItems] = await Promise.all([
    prisma.task.findMany({
      where: {
        userId: user.id,
        dueDate: { gte: today, lt: tomorrow },
        OR: [
          { isPersonalDaily: true },
          { roadmapId: null },
        ],
      },
      include: { category: true },
      orderBy: [
        { status: "asc" },
        { dueDate: "asc" },
        { sequenceOrder: "asc" },
      ],
    }),
    prisma.task.findMany({
      where: { userId: user.id },
      select: {
        status: true,
        priority: true,
        taskType: true,
        completedAt: true,
      },
    }),
    prisma.studySession.findMany({
      where: { userId: user.id, startedAt: { gte: today } },
      select: { durationMinutes: true },
    }),
    getDailyItems(user.id, today),
  ]);

  const completedToday = todayTasks.filter(
    (task) => task.status === "COMPLETED",
  ).length;
  const progress = toPercent(completedToday, todayTasks.length || 1);
  
  const studyMinutes = studySessions.reduce(
    (total, session) => total + session.durationMinutes,
    0,
  );
  const totalCompleted = allTasks.filter(
    (task) => task.status === "COMPLETED",
  ).length;
  const openHighPriority = allTasks.filter(
    (task) =>
      task.status !== "COMPLETED" &&
      ["HIGH", "CRITICAL"].includes(task.priority),
  ).length;
  const revisionCount = allTasks.filter(
    (task) =>
      task.status !== "COMPLETED" &&
      task.taskType?.toLowerCase() === "revision",
  ).length;

  const todayLabel = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const pinnedTaskIds = new Set(dailyItems.connected.map((pin) => pin.task.id));
  const routineTaskIds = new Set(
    dailyItems.routines.map((routine) => routine.id),
  );
  
  const toRow = (
    task: {
      id: string;
      title: string;
      status: string;
      priority: string;
      plannedMinutes: number | null;
      estimatedMinutes: number | null;
      dailySlot: string | null;
      category: { name: string } | null;
    },
    kind: "task" | "routine" | "connected",
    extra: { done?: boolean } = {},
  ) => ({
    id: task.id,
    title: task.title,
    priority: task.priority,
    plannedMinutes: task.plannedMinutes,
    estimatedMinutes: task.estimatedMinutes,
    dailySlot: task.dailySlot,
    category: task.category,
    kind,
    done: extra.done ?? task.status === "COMPLETED",
  });

  const todayList = [
    ...dailyItems.routines.map((routine) =>
      toRow(routine, "routine", { done: routine.doneToday }),
    ),
    ...dailyItems.connected.map(({ task }) => toRow(task, "connected")),
    ...todayTasks
      .filter(
        (task) => !pinnedTaskIds.has(task.id) && !routineTaskIds.has(task.id),
      )
      .map((task) => toRow(task, "task")),
  ];

  const remainingToday = Math.max(todayTasks.length - completedToday, 0);
  const overallPercent = toPercent(totalCompleted, allTasks.length || 1);

  // Get user's active roadmaps for "Continue Roadmap" section
  const userRoadmaps = await prisma.userRoadmap.findMany({
    where: { userId: user.id },
    select: { roadmapId: true },
  });

  // Load roadmap data from templates
  const { readRoadmap, ROADMAP_IDS } = await import("@/lib/business/roadmap-templates");
  const activeRoadmaps = await Promise.all(
    userRoadmaps.map(async ({ roadmapId }) => {
      try {
        const roadmap = readRoadmap(roadmapId);
        return { roadmap };
      } catch {
        return null;
      }
    })
  ).then(results => results.filter((r): r is { roadmap: any } => r !== null));

  return (
    <AppShell active="overview" user={{ name: user.name, email: user.email }}>
      <OnboardingBanner show={!user.onboardingDismissedAt} />
      <main className="px-6 py-8 sm:px-8 lg:px-12">
        <Sheet>
          {/* Greeting Header */}
          <div className="mb-10">
            <p className="text-lg text-graphite-muted mb-1">{getGreeting()}, {user.name ?? "there"}.</p>
            <p className="text-sm text-graphite-faint">Here&apos;s where you stand today.</p>
            <p className="text-sm text-graphite-faint mt-1">{todayLabel}</p>
          </div>

          {/* Today's Summary - 3 Cards */}
          <div className="grid grid-cols-1 gap-4 mb-10 sm:grid-cols-3">
            <Card className="p-5">
              <p className="label">Today's Progress</p>
              <p className="mt-1 text-3xl font-bold text-foreground font-display">
                <Num>{completedToday}</Num>
                <span className="text-foreground/50 ml-1">/</span>
                <Num className="text-foreground/50">{todayTasks.length}</Num>
              </p>
              <div className="mt-3">
                <ProgressBar value={progress} />
                <p className="mt-1 caption">{progress}% complete</p>
              </div>
            </Card>

            <Card className="p-5">
              <p className="label">Study Time</p>
              <p className="mt-1 text-3xl font-bold text-foreground font-display">
                <Num>{formatMinutes(studyMinutes)}</Num>
              </p>
              <p className="mt-1 caption">
                of {formatMinutes(user.dailyStudyTargetMinutes)} daily target
              </p>
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

          {/* Today's Tasks */}
          <SectionHead
            index="01"
            title="Today's Tasks"
            instruction="Your scheduled routines and roadmap tasks"
            aside={`${todayList.length} items`}
          />
          <DashboardTaskList initialItems={todayList} />

          {/* Continue Roadmap */}
          {activeRoadmaps.length > 0 && (
            <>
              <SectionHead
                index="02"
                title="Continue Roadmap"
                instruction="Pick up where you left off"
              />
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeRoadmaps.map(({ roadmap }) => (
                  <Link key={roadmap.id} href={`/roadmaps/${roadmap.id}`}>
                    <Card className="h-full">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-lg font-semibold text-foreground font-display">
                              {roadmap.title}
                            </h3>
                            {roadmap.description && (
                              <p className="mt-1 text-sm leading-relaxed text-graphite-muted line-clamp-2">
                                {roadmap.description}
                              </p>
                            )}
                          </div>
                          <Stamp tone="valid">Active</Stamp>
                        </div>
                        <div className="mt-4">
                          <p className="text-sm text-graphite-muted">
                            Next: {roadmap.milestones[0]?.title ?? "No upcoming milestones"}
                          </p>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-sm font-medium text-primary">Continue →</span>
                          <ArrowRight className="h-4 w-4 text-primary" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* Next Action */}
          <div className="mt-10 pt-6 border-t border-border">
            <SectionHead
              index="03"
              title="Next Action"
              instruction={remainingToday > 0 ? "Complete one scheduled task before adding anything new." : "Today is clear. Review topics or plan tomorrow."}
            />
            <div className="mt-4 flex flex-wrap gap-3">
              {remainingToday > 0 ? (
                <Link href="/tasks" className="btn btn-primary">
                  Open Task Plan
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link href="/roadmaps" className="btn btn-secondary">
                  Browse Roadmaps
                </Link>
              )}
            </div>
          </div>

          {/* Focus Time */}
          <div className="mt-10 pt-6 border-t border-border">
            <SectionHead
              index="04"
              title="Focus Time"
              instruction="Log your study sessions"
            />
            <FocusLog />
          </div>
        </Sheet>
      </main>
    </AppShell>
  );
}