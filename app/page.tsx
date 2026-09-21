import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import AppShell from "@/app/components/shell";
import { Num, SectionHead, Sheet, Stamp } from "@/app/components/ui";
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
  const weekStart = new Date(today.getTime() - 6 * 86_400_000);

  const [todayTasks, allTasks, studySessions, dailyItems] = await Promise.all([
    prisma.task.findMany({
      where: { userId: user.id, dueDate: { gte: today, lt: tomorrow } },
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
  const weeklyCompletion = Array.from({ length: 7 }, (_, index) => {
    const day = dayStart(new Date(weekStart.getTime() + index * 86_400_000));
    const nextDay = new Date(day.getTime() + 86_400_000);
    const count = allTasks.filter(
      (task) =>
        task.completedAt &&
        task.completedAt >= day &&
        task.completedAt < nextDay,
    ).length;
    return {
      label: day.toLocaleDateString("en-US", { weekday: "short" }),
      count,
    };
  });
  const weeklyMax = Math.max(...weeklyCompletion.map((day) => day.count), 1);
  const todayLabel = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const pinnedTaskIds = new Set(dailyItems.connected.map((pin) => pin.task.id));
  const routineTaskIds = new Set(dailyItems.routines.map((routine) => routine.id));
  const toRow = (
    task: { id: string; title: string; status: string; priority: string; plannedMinutes: number | null; estimatedMinutes: number | null; dailySlot: string | null; category: { name: string } | null },
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
  const metrics = [
    {
      label: "Completed today",
      value: `${completedToday}/${todayTasks.length}`,
      detail: `${remainingToday} still open`,
    },
    {
      label: "Focus logged",
      value: formatMinutes(studyMinutes),
      detail: `of ${formatMinutes(user.dailyStudyTargetMinutes)} target`,
    },
    {
      label: "High priority",
      value: String(openHighPriority),
      detail: "open and urgent",
    },
    {
      label: "To revise",
      value: String(revisionCount),
      detail: "topics waiting",
    },
  ];
  const overallPercent = toPercent(totalCompleted, allTasks.length || 1);

  return (
    <AppShell active="dashboard">
      <OnboardingBanner show={!user.onboardingDismissedAt} />
      <main className="container mx-auto max-w-[1120px] px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <Sheet className="overflow-hidden px-5 py-7 sm:px-8 sm:py-9">
          {/* masthead */}
          <header className="flex flex-col gap-5 border-b border-rule pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-[1.6rem] font-bold leading-none tracking-tight text-graphite sm:text-[1.9rem]">
                Today&apos;s plan
              </h1>
              <p className="mt-2.5 text-[0.8125rem] font-medium text-graphite-2">
                {todayLabel}
              </p>
              <p className="mt-3 max-w-[62ch] text-[0.8125rem] leading-5 text-graphite-2">
                {defaultStudyPlan.goal} · {defaultStudyPlan.durationDays} days · {" "}
                {formatMinutes(defaultStudyPlan.dailyStudyMinutes)} daily target.
                Keep it simple — finish a line at a time.
              </p>
            </div>
            <Link href="/tasks" className="btn btn-primary shrink-0 self-start">
              Manage tasks
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </header>

          {/* summary strip */}
          <section
            aria-label="Today at a glance"
            className="grid grid-cols-2 border-b border-rule md:grid-cols-4"
          >
            {metrics.map((metric, index) => (
              <div
                key={metric.label}
                className={`px-1 py-4 sm:px-4 ${
                  index > 0 ? "md:border-l md:border-rule" : ""
                } ${index % 2 === 1 ? "border-l border-rule" : ""}`}
              >
                <p className="text-[0.72rem] font-medium text-graphite-2">
                  {metric.label}
                </p>
                <p className="mt-2 text-[1.45rem] font-semibold leading-none text-graphite">
                  <Num>{metric.value}</Num>
                </p>
                <p className="mt-1.5 text-[0.72rem] text-graphite-2">
                  {metric.detail}
                </p>
              </div>
            ))}
          </section>

          {/* today's list */}
          <section className="mt-8">
            <SectionHead
              index="01"
              title="Today's list"
              instruction="Routines, connected roadmap tasks, and anything scheduled for today. Fill the bubble to mark a line done."
              aside={`${todayList.length} rows`}
            />
            <DashboardTaskList initialItems={todayList} />
          </section>

          {/* completion and cadence */}
          <section className="mt-10 grid gap-10 border-t border-rule pt-8 md:grid-cols-[1.15fr_0.85fr] md:gap-12">
            <div className="space-y-9">
              <div>
                <SectionHead
                  index="02"
                  title="Completion"
                  instruction="A single glance at what moved forward today."
                  aside={`${progress}%`}
                />
                <div className="mt-5">
                  <div
                    className="relative h-2.5 w-full overflow-hidden rounded-full bg-rule"
                    role="progressbar"
                    aria-valuenow={progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Today's completion"
                  >
                    <div
                      className="h-full rounded-full transition-[width] duration-500 ease-out"
                      style={{
                        width: `${progress}%`,
                        backgroundImage: "linear-gradient(90deg, var(--color-amber-ink), var(--color-amber))",
                      }}
                    />
                  </div>
                  <div className="mt-3 flex items-baseline justify-between font-mono text-[0.72rem] tabular-nums text-graphite-2">
                    <span>{completedToday} finished</span>
                    <span className="text-graphite">{remainingToday} remaining</span>
                  </div>
                </div>
              </div>

              <div>
                <SectionHead
                  index="03"
                  title="Cadence"
                  instruction="Completions recorded across the last seven days."
                />
                <div className="mt-5 flex h-28 items-end gap-2 rounded-xl border-b border-rule bg-paper/40 px-2 pb-px">
                  {weeklyCompletion.map((day, index) => (
                    <div
                      key={day.label}
                      className="flex min-w-0 flex-1 flex-col items-center gap-2"
                    >
                      <span className="font-mono text-[0.68rem] tabular-nums text-graphite-2">
                        {day.count || ""}
                      </span>
                      <div
                        className={`w-full rounded-t-md ${
                          index === weeklyCompletion.length - 1
                            ? "bg-amber"
                            : "bg-graphite/25"
                        }`}
                        style={{
                          height: `${Math.max((day.count / weeklyMax) * 76, day.count ? 8 : 3)}px`,
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex gap-2">
                  {weeklyCompletion.map((day) => (
                    <span
                      key={day.label}
                      className="min-w-0 flex-1 text-center text-[0.68rem] font-medium text-graphite-3"
                    >
                      {day.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* margin notes */}
            <div className="space-y-7 md:border-l md:border-rule md:pl-10">
              <div>
                <SectionHead
                  index="04"
                  title="Overall progress"
                  instruction={`${totalCompleted} of ${allTasks.length} roadmap tasks completed.`}
                  aside={`${overallPercent}%`}
                />
                <div
                  className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-rule"
                  role="progressbar"
                  aria-valuenow={overallPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Overall roadmap progress"
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${overallPercent}%`,
                      backgroundImage: "linear-gradient(90deg, var(--color-amber-ink), var(--color-amber))",
                    }}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-rule bg-paper/50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-[0.95rem] font-semibold text-graphite">
                    Next best move
                  </h3>
                  <Stamp tone="stamp">Note</Stamp>
                </div>
                <p className="mt-2 text-[0.8125rem] leading-5 text-graphite-2">
                  {remainingToday > 0
                    ? "Complete one scheduled task before adding anything new."
                    : "Today is clear. Use the time to review a topic or plan tomorrow."}
                </p>
                <Link
                  href="/tasks"
                  className="mt-3 inline-flex items-center gap-1 text-[0.8125rem] font-semibold text-amber-ink hover:underline hover:underline-offset-4"
                >
                  Open task plan
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </div>

              <div>
                <SectionHead index="05" title="Log focus time" />
                <FocusLog />
              </div>
            </div>
          </section>
        </Sheet>
      </main>
    </AppShell>
  );
}