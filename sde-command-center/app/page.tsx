import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Flame,
  ListTodo,
  Rocket,
  Sparkles,
  Target,
} from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { defaultStudyPlan } from "@/lib/data/mock-data";
import { formatMinutes, toPercent } from "@/lib/utils";

export default async function HomePage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const user = await prisma.user.findFirst({
    where: { email: "user@sdecommand.center" },
    include: {
      tasks: {
        include: { category: true },
        orderBy: [
          { status: "asc" },
          { priority: "desc" },
          { createdAt: "asc" },
        ],
      },
      studySessions: { where: { startedAt: { gte: today } } },
    },
  });

  const tasks = user?.tasks ?? [];
  const studyMinutes = (user?.studySessions ?? []).reduce(
    (total, session) => total + session.durationMinutes,
    0,
  );
  const completedCount = tasks.filter(
    (task) => task.status === "COMPLETED",
  ).length;
  const progress = toPercent(completedCount, tasks.length || 1);
  const revisionTasks = tasks
    .filter(
      (task) =>
        task.taskType?.toLowerCase() === "revision" &&
        task.status !== "COMPLETED",
    )
    .slice(0, 3);
  const importantTasks = tasks
    .filter(
      (task) =>
        task.status !== "COMPLETED" &&
        (task.priority === "CRITICAL" || task.priority === "HIGH"),
    )
    .slice(0, 3);
  const visibleTasks = tasks.slice(0, 5);

  return (
    <main className="min-h-screen bg-[#0b1020] text-slate-100">
      <div className="mx-auto flex max-w-7xl gap-8 px-6 py-8">
        <aside className="hidden w-72 shrink-0 rounded-2xl border border-slate-800 bg-slate-950/60 p-5 lg:block">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300">
              <Rocket className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                SDE
              </p>
              <h1 className="text-xl font-semibold">Command Center</h1>
            </div>
          </div>

          <nav className="space-y-2 text-sm text-slate-300">
            {["Dashboard", "Tasks", "DSA", "Study", "Revision", "Settings"].map(
              (item, index) => (
                <Link
                  key={item}
                  href={
                    {
                      Dashboard: "/",
                      Tasks: "/tasks",
                      DSA: "/dsa",
                      Study: "/study",
                      Revision: "/revision",
                      Settings: "/settings",
                    }[item] ?? "/"
                  }
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 transition ${
                    index === 0
                      ? "bg-slate-800 text-white"
                      : "hover:bg-slate-900"
                  }`}
                >
                  <span>{item}</span>
                  <ArrowRight className="h-4 w-4 opacity-60" />
                </Link>
              ),
            )}
          </nav>

          <div className="mt-10 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4">
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-cyan-300">
              Goal
            </p>
            <p className="text-lg font-medium">{defaultStudyPlan.goal}</p>
            <p className="mt-2 text-sm text-slate-300">
              {defaultStudyPlan.durationDays} days •{" "}
              {formatMinutes(defaultStudyPlan.dailyStudyMinutes)} daily
            </p>
          </div>
        </aside>

        <div className="flex-1 space-y-8">
          <header className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-slate-400">Good Morning 👋</p>
                <h2 className="mt-1 text-3xl font-semibold">
                  Today&apos;s Progress
                </h2>
              </div>
              <div className="flex items-center gap-3 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                <Flame className="h-4 w-4" />
                <span>12 day streak</span>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-[1.25fr_0.75fr]">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>Daily completion</span>
                  <span>{progress}%</span>
                </div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-4 text-sm text-slate-300">
                  {completedCount} / {tasks.length || 1} tasks completed
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <p className="text-sm text-slate-400">
                  Today&apos;s Study Time
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <Clock3 className="h-5 w-5 text-cyan-300" />
                  <span className="text-2xl font-semibold">
                    {formatMinutes(studyMinutes)} /{" "}
                    {formatMinutes(defaultStudyPlan.dailyStudyMinutes)}
                  </span>
                </div>
              </div>
            </div>
          </header>

          <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-xl font-semibold">Today&apos;s Tasks</h3>
                <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
                  {visibleTasks.length} items
                </span>
              </div>

              <div className="space-y-3">
                {visibleTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      {task.status === "COMPLETED" ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-slate-500" />
                      )}
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-xs text-slate-400">
                          {task.category?.name ?? "Uncategorized"}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-slate-800 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-300">
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Revision</h3>
                  <Target className="h-5 w-5 text-amber-300" />
                </div>
                <ul className="mt-4 space-y-3 text-sm text-slate-300">
                  {revisionTasks.length ? (
                    revisionTasks.map((task) => (
                      <li key={task.id}>• {task.title}</li>
                    ))
                  ) : (
                    <li>No revision tasks queued.</li>
                  )}
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Accountability</h3>
                  <Sparkles className="h-5 w-5 text-cyan-300" />
                </div>
                <p className="mt-4 text-sm text-slate-300">
                  {importantTasks.length} important SDE preparation task
                  {importantTasks.length === 1 ? "" : "s"} remaining.
                </p>
                <div className="mt-4 rounded-xl bg-amber-500/10 p-3 text-sm text-amber-200">
                  {importantTasks.length
                    ? importantTasks.map((task) => (
                        <span key={task.id} className="mr-3">
                          • {task.title}
                        </span>
                      ))
                    : "Nothing urgent today."}
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 md:grid-cols-3">
            {[
              { label: "Total Tasks", value: tasks.length, icon: ListTodo },
              { label: "Completed", value: completedCount, icon: CheckCircle2 },
              {
                label: "Needs Revision",
                value: revisionTasks.length,
                icon: Target,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-400">{stat.label}</p>
                  <stat.icon className="h-5 w-5 text-cyan-300" />
                </div>
                <p className="mt-4 text-3xl font-semibold">{stat.value}</p>
              </div>
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}
