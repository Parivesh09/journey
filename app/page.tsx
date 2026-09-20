import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Flame,
  ListTodo,
  Rocket,
  Target,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import DashboardTaskList from "@/app/dashboard-task-list";
import OnboardingBanner from "@/app/onboarding-banner";
import { getCurrentUser } from "@/lib/auth";
import { ensureDailyTasks } from "@/lib/business/daily-plan";
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
  await ensureDailyTasks(user.id, today);

  const [todayTasks, allTasks, studySessions] = await Promise.all([
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
  const metrics = [
    [
      "Today",
      `${completedToday}/${todayTasks.length}`,
      "tasks complete",
      CheckCircle2,
      "text-emerald-300",
    ],
    [
      "Focus time",
      formatMinutes(studyMinutes),
      `of ${formatMinutes(user.dailyStudyTargetMinutes)} target`,
      Clock3,
      "text-cyan-300",
    ],
    [
      "Urgent",
      String(openHighPriority),
      "high-priority tasks open",
      CircleAlert,
      "text-amber-300",
    ],
    [
      "Revision",
      String(revisionCount),
      "topics ready to revisit",
      Target,
      "text-violet-300",
    ],
  ] as const;

  return (
    <main className="min-h-screen bg-[#0b1020] text-slate-100">
      <OnboardingBanner show={!user.onboardingDismissedAt} />
      <div className="mx-auto flex max-w-[1440px] gap-8 px-5 py-6 lg:px-8">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-6 rounded-2xl border border-slate-800 bg-slate-950/60 p-5 shadow-[0_24px_80px_rgba(2,6,23,0.32)]">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-200">
                <Rocket className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
                  SDE
                </p>
                <h1 className="text-lg font-semibold tracking-tight">
                  Command Center
                </h1>
              </div>
            </div>
            <nav className="space-y-1 text-sm">
              {[
                { label: "Dashboard", href: "/", isDisabled: false },
                { label: "All tasks", href: "/tasks", isDisabled: false },
                { label: "DSA", href: "/dsa", isDisabled: true },
                { label: "Study", href: "/study", isDisabled: true },
                { label: "Revision", href: "/revision", isDisabled: true },
                { label: "Settings", href: "/settings", isDisabled: false },
              ].map(({ label, href, isDisabled }) => (
                <Link
                  key={label}
                  href={isDisabled ? "#" : href}
                  className={`flex items-center justify-between rounded-lg px-3 py-2.5 transition  ${
                    isDisabled
                      ? "cursor-not-allowed text-slate-600"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {label}
                  <ArrowRight className="h-4 w-4 opacity-60" />
                </Link>
              ))}
            </nav>
            <div className="mt-8 rounded-xl bg-cyan-400/10 p-4">
              <p className="text-xs text-cyan-200">Current target</p>
              <p className="mt-1 font-medium">{defaultStudyPlan.goal}</p>
              <p className="mt-2 text-xs text-slate-400">
                {defaultStudyPlan.durationDays} days ·{" "}
                {formatMinutes(defaultStudyPlan.dailyStudyMinutes)} daily
              </p>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1 space-y-7">
          <header className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.25)] md:p-8">
            <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm text-slate-400">{todayLabel}</p>
                <h2 className="mt-1 text-3xl font-semibold tracking-tight text-balance md:text-4xl">
                  Your learning day, clearly mapped.
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
                  Start with the next scheduled task, keep an eye on your study
                  time, and leave the dashboard knowing what moved forward.
                </p>
              </div>
              <Link
                href="/tasks"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 active:scale-[0.98]"
              >
                Manage tasks <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </header>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map(([label, value, detail, Icon, color]) => (
              <article
                key={label}
                className="rounded-xl border border-slate-800 bg-slate-950/55 p-5 transition hover:-translate-y-0.5 hover:border-slate-700"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-400">{label}</p>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <p className="mt-5 text-3xl font-semibold tracking-tight tabular-nums">
                  {value}
                </p>
                <p className="mt-1 text-xs text-slate-500">{detail}</p>
              </article>
            ))}
          </section>

          <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <article className="rounded-2xl border border-slate-800 bg-slate-950/55 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium">Today&apos;s completion</p>
                  <p className="mt-1 text-sm text-slate-400">
                    A single glance at what&apos;s left.
                  </p>
                </div>
                <span className="text-3xl font-semibold tabular-nums text-cyan-200">
                  {progress}%
                </span>
              </div>
              <div className="mt-7 h-3 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-cyan-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-5 flex items-center justify-between text-sm">
                <span className="text-slate-400">
                  {completedToday} finished
                </span>
                <span className="font-medium text-slate-200">
                  {Math.max(todayTasks.length - completedToday, 0)} remaining
                </span>
              </div>
              <div className="mt-6 border-t border-slate-800 pt-5 text-sm text-slate-400">
                <Flame className="mr-2 inline h-4 w-4 text-amber-300" />
                Consistency is built one finished task at a time.
              </div>
            </article>
            <article className="rounded-2xl border border-slate-800 bg-slate-950/55 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Completion cadence</p>
                  <p className="mt-1 text-sm text-slate-400">Last seven days</p>
                </div>
                <BarChart3 className="h-5 w-5 text-cyan-300" />
              </div>
              <div className="mt-7 flex h-28 items-end gap-2">
                {weeklyCompletion.map((day) => (
                  <div
                    key={day.label}
                    className="flex min-w-0 flex-1 flex-col items-center gap-2"
                  >
                    <span className="text-xs tabular-nums text-slate-400">
                      {day.count || ""}
                    </span>
                    <div
                      className="w-full rounded-t-sm bg-cyan-300/80"
                      style={{
                        height: `${Math.max((day.count / weeklyMax) * 76, day.count ? 8 : 3)}px`,
                      }}
                    />
                    <span className="text-[10px] text-slate-500">
                      {day.label}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="grid gap-5 md:grid-cols-2">
            <article className="rounded-2xl border border-slate-800 bg-slate-950/55 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Overall progress</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {totalCompleted} of {allTasks.length} roadmap tasks
                    completed
                  </p>
                </div>
                <CalendarDays className="h-5 w-5 text-cyan-300" />
              </div>
              <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-cyan-300"
                  style={{
                    width: `${toPercent(totalCompleted, allTasks.length || 1)}%`,
                  }}
                />
              </div>
            </article>
            <article className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] p-6">
              <p className="text-sm font-medium text-amber-100">
                Next best move
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {todayTasks.length - completedToday > 0
                  ? "Complete one scheduled task before adding anything new."
                  : "Today is clear. Use the time to review a topic or plan tomorrow."}
              </p>
              <Link
                href="/tasks"
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-amber-200 hover:text-amber-100"
              >
                Open task plan <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-950/55 p-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
                  Task list
                </p>
                <h3 className="mt-1 text-xl font-semibold">
                  Today&apos;s scheduled work
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  Mark tasks complete here without leaving the dashboard.
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <ListTodo className="h-4 w-4" />
                {todayTasks.length} scheduled
              </div>
            </div>
            <DashboardTaskList initialTasks={todayTasks} />
          </section>
        </div>
      </div>
    </main>
  );
}
