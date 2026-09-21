"use client";

import { useState } from "react";
import { CheckCircle2, Circle, LoaderCircle } from "lucide-react";

export type DashboardTaskRow = {
  id: string;
  title: string;
  priority: string;
  plannedMinutes: number | null;
  estimatedMinutes: number | null;
  dailySlot: string | null;
  category: { name: string } | null;
  kind: "task" | "routine" | "connected";
  done: boolean;
};

export default function DashboardTaskList({
  initialItems,
}: {
  initialItems: DashboardTaskRow[];
}) {
  const [items, setItems] = useState(initialItems);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function toggleTask(row: DashboardTaskRow) {
    setUpdatingId(row.id);
    setError("");
    try {
      if (row.kind === "routine") {
        const response = await fetch(`/api/tasks/${row.id}/complete-today`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) throw new Error("Unable to update routine");
        const data = (await response.json()) as { doneToday: boolean };
        setItems((current) =>
          current.map((item) =>
            item.id === row.id ? { ...item, done: data.doneToday } : item,
          ),
        );
      } else {
        const response = await fetch(`/api/tasks/${row.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed: !row.done }),
        });
        if (!response.ok) throw new Error("Unable to update task");
        await response.json();
        setItems((current) =>
          current.map((item) =>
            item.id === row.id && item.kind !== "routine"
              ? { ...item, done: !row.done }
              : item,
          ),
        );
      }
    } catch {
      setError("We couldn't update this item. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  }

  if (items.length === 0) {
    return (
      <p className="mt-5 rounded-xl bg-slate-900/70 p-4 text-sm text-slate-400">
        Nothing on today&apos;s list. Add a routine or connect a roadmap task.
      </p>
    );
  }

  return (
    <div className="mt-5">
      {error ? <p className="mb-3 text-sm text-rose-300">{error}</p> : null}
      <div className="divide-y divide-slate-800 overflow-hidden rounded-xl border border-slate-800 bg-slate-950/40">
        {items.map((row) => (
          <div
            key={`${row.kind}-${row.id}`}
            className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-900/70"
          >
            <button
              type="button"
              aria-label={row.done ? "Mark incomplete" : "Mark complete"}
              disabled={updatingId === row.id}
              onClick={() => toggleTask(row)}
              className="shrink-0 text-cyan-300 disabled:opacity-50"
            >
              {updatingId === row.id ? (
                <LoaderCircle className="h-5 w-5 animate-spin" />
              ) : row.done ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              ) : (
                <Circle className="h-5 w-5 text-slate-500" />
              )}
            </button>
            <div className="min-w-0 flex-1">
              <p
                className={
                  row.done
                    ? "truncate text-slate-500 line-through"
                    : "truncate font-medium text-slate-100"
                }
              >
                {row.title}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {row.dailySlot?.replaceAll("_", " ") ??
                  row.category?.name ??
                  "Scheduled"}{" "}
                · {row.plannedMinutes ?? row.estimatedMinutes ?? 60}m
                {row.kind === "connected" ? " · connected to roadmap" : ""}
              </p>
            </div>
            <span className="rounded-md bg-slate-800 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-300">
              {row.priority}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}