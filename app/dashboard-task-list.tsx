"use client";

import { useState } from "react";
import { CheckCircle2, Circle, LoaderCircle } from "lucide-react";

export type DashboardTask = {
  id: string;
  title: string;
  status: string;
  priority: string;
  plannedMinutes: number | null;
  estimatedMinutes: number | null;
  dailySlot: string | null;
  category: { name: string } | null;
};

export default function DashboardTaskList({ initialTasks }: { initialTasks: DashboardTask[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function toggleTask(task: DashboardTask) {
    setUpdatingId(task.id);
    setError("");
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: task.status !== "COMPLETED" }),
      });
      if (!response.ok) throw new Error("Unable to update task");
      const data = (await response.json()) as { task: DashboardTask };
      setTasks((current) =>
        current.map((item) => (item.id === task.id ? data.task : item)),
      );
    } catch {
      setError("We couldn't update this task. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  }

  if (tasks.length === 0) {
    return <p className="mt-5 rounded-xl bg-slate-900/70 p-4 text-sm text-slate-400">No tasks are scheduled for today.</p>;
  }

  return (
    <div className="mt-5">
      {error ? <p className="mb-3 text-sm text-rose-300">{error}</p> : null}
      <div className="divide-y divide-slate-800 overflow-hidden rounded-xl border border-slate-800 bg-slate-950/40">
        {tasks.map((task) => (
          <div key={task.id} className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-900/70">
            <button
              type="button"
              aria-label={task.status === "COMPLETED" ? "Mark task incomplete" : "Mark task complete"}
              disabled={updatingId === task.id}
              onClick={() => toggleTask(task)}
              className="shrink-0 text-cyan-300 disabled:opacity-50"
            >
              {updatingId === task.id ? <LoaderCircle className="h-5 w-5 animate-spin" /> : task.status === "COMPLETED" ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <Circle className="h-5 w-5 text-slate-500" />}
            </button>
            <div className="min-w-0 flex-1">
              <p className={task.status === "COMPLETED" ? "truncate text-slate-500 line-through" : "truncate font-medium text-slate-100"}>{task.title}</p>
              <p className="mt-1 text-xs text-slate-400">
                {task.dailySlot?.replaceAll("_", " ") ?? task.category?.name ?? "Scheduled task"} · {task.plannedMinutes ?? task.estimatedMinutes ?? 60}m
              </p>
            </div>
            <span className="rounded-md bg-slate-800 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-300">{task.priority}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
