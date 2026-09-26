import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import AppShell from "@/app/components/shell";
import { PageHeader, Sheet, SectionHead, ProgressBar, Num, Card, CardContent } from "@/app/components/ui";
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

  return (
    <AppShell active="overview" user={{ name: user.name, email: user.email }}>
      <OnboardingBanner show={!user.onboardingDismissedAt} />
      <main className="px-6 py-8 sm:px-8 lg:px-12">
        <Sheet>
          <PageHeader
            title="Today"
            subtitle={`${todayLabel} · ${completedToday} of ${todayTasks.length} tasks completed`}
            action={
              <Link href="/tasks" className="btn btn-primary">
                Manage Tasks
                <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />

          <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-4">
            {[
              { label: "Completed", value: `${completedToday}/${todayTasks.length}`, detail: `${remainingToday} open` },
              { label: "Focus", value: formatMinutes(studyMinutes), detail: `of ${formatMinutes(user.dailyStudyTargetMinutes)}` },
              { label: "High Priority", value: String(openHighPriority), detail: "urgent" },
              { label: "To Revise", value: String(revisionCount), detail: "topics" },
            ].map((metric) => (
              <Card key={metric.label} className="p-5">
                <p className="label">{metric.label}</p>
                <p className="mt-1 text-2xl font-semibold text-foreground font-display">
                  <Num>{metric.value}</Num>
                </p>
                <p className="mt-1 caption">{metric.detail}</p>
              </Card>
            ))}
          </div>

          <SectionHead
            index="01"
            title="Today's List"
            instruction="Routines, connected tasks, and today's schedule"
            aside={`${todayList.length} items`}
          />
          <DashboardTaskList initialItems={todayList} />

          <div className="grid gap-6 mt-10 md:grid-cols-2">
            <Card>
              <CardContent className="pt-0">
                <SectionHead
                  index="02"
                  title="Completion"
                  instruction="Progress today"
                  aside={`${progress}%`}
                />
                <div className="mt-4">
                  <ProgressBar value={progress} />
                  <div className="mt-2 font-mono text-sm text-graphite-faint flex justify-between">
                    <span>{completedToday} finished</span>
                    <span>{remainingToday} remaining</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-0">
                <SectionHead
                  index="03"
                  title="Overall Progress"
                  instruction={`${totalCompleted} of ${allTasks.length} tasks completed`}
                  aside={`${overallPercent}%`}
                />
                <div className="mt-4">
                  <ProgressBar value={overallPercent} />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-10 pt-6 border-t border-border">
            <SectionHead
              index="04"
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

          <div className="mt-10 pt-6 border-t border-border">
            <SectionHead
              index="05"
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
