"use client";

import { useState } from "react";
import { Bubble, Stamp, EmptyState, CountdownTimer, TaskTimer } from "@/app/components/ui";
import {
  useToggleTaskCompleteTodayMutation,
  useUpdateTaskMutation,
} from "@/lib/api";

export type DashboardTaskRow = {
  id: string;
  title: string;
  description?: string;
  priority: string;
  plannedMinutes: number | null;
  estimatedMinutes: number | null;
  dailySlot: string | null;
  startTime?: Date | string | null;
  endTime?: Date | string | null;
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
  const [runningTimers, setRunningTimers] = useState<Set<string>>(new Set());
  const [completedTimers, setCompletedTimers] = useState<Set<string>>(new Set());
  const [toggleTaskCompleteToday] = useToggleTaskCompleteTodayMutation();
  const [updateTask] = useUpdateTaskMutation();

  async function toggleTask(row: DashboardTaskRow) {
    // For routines, allow toggle anytime
    // For other tasks, require timer to be completed first
    if (row.kind !== "routine" && row.plannedMinutes && !completedTimers.has(row.id)) {
      setError("Start the task timer first, then mark as complete.");
      return;
    }
    setUpdatingId(row.id);
    setError("");
    try {
      if (row.kind === "routine") {
        const data = await toggleTaskCompleteToday(row.id).unwrap();
        setItems((current) =>
          current.map((item) =>
            item.id === row.id ? { ...item, done: data.doneToday } : item,
          ),
        );
      } else {
        await updateTask({ id: row.id, completed: !row.done }).unwrap();
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

  function handleTimerStart(id: string) {
    setRunningTimers((prev) => new Set(prev).add(id));
  }

  function handleTimerComplete(id: string) {
    setRunningTimers((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setCompletedTimers((prev) => new Set(prev).add(id));
  }

  function handleTimerCancel(id: string) {
    setRunningTimers((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setCompletedTimers((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="No tasks today"
        description="Add a routine or connect a roadmap task to get started"
      />
    );
  }

  return (
    <div className="mt-6">
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <div className="border-t border-border">
        {items.map((row, index) => {
          const busy = updatingId === row.id;
          const urgent = ["HIGH", "CRITICAL"].includes(row.priority);
          const isTimerRunning = runningTimers.has(row.id);
          const isTimerCompleted = completedTimers.has(row.id);
          const showTimer = row.plannedMinutes && row.plannedMinutes > 0;

          return (
            <div
              key={`${row.kind}-${row.id}`}
              className="task-row py-3"
            >
              <div className="ml-1 font-mono text-xs text-graphite-faint w-6 tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </div>
              <Bubble
                filled={row.done}
                busy={busy}
                label={row.done ? "Mark incomplete" : "Mark complete"}
                onClick={() => toggleTask(row)}
                disabled={row.kind !== "routine" && !!row.plannedMinutes && !isTimerCompleted}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`truncate text-sm ${row.done ? "text-graphite-faint line-through" : "text-foreground font-medium"}`}>
                    {row.title}
                  </p>
                  {row.kind === "routine" && (
                    <Stamp tone="valid">Routine</Stamp>
                  )}
                  {row.kind === "connected" && (
                    <Stamp tone="amber">Roadmap</Stamp>
                  )}
                  {row.kind === "task" && (
                    <Stamp tone="neutral">Personal</Stamp>
                  )}
                </div>
                {row.description && (
                  <p className="mt-1 truncate text-sm text-graphite-muted line-clamp-2">
                    {row.description}
                  </p>
                )}
                <div className="mt-0.5 flex items-center gap-3 flex-wrap">
                  <p className="truncate font-mono text-[0.7rem] text-graphite-faint">
                    {row.dailySlot?.replaceAll("_", " ") ??
                      row.category?.name ??
                      "Scheduled"}{" "}
                    · {row.plannedMinutes ?? row.estimatedMinutes ?? 60}m
                  </p>
                  {(row.startTime || row.endTime) && (
                    <CountdownTimer targetTime={row.startTime || row.endTime} />
                  )}
                  {showTimer && (
                    <TaskTimer
                      durationMinutes={row.plannedMinutes!}
                      isRunning={isTimerRunning}
                      onStart={() => handleTimerStart(row.id)}
                      onComplete={() => handleTimerComplete(row.id)}
                      onCancel={() => handleTimerCancel(row.id)}
                    />
                  )}
                </div>
              </div>
              <Stamp tone={urgent ? "stamp" : "neutral"} className="text-[0.7rem]">
                {row.priority}
              </Stamp>
            </div>
          );
        })}
      </div>
    </div>
  );
}
