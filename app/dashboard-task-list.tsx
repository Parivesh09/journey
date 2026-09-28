"use client";

import { useState } from "react";
import { Bubble, Stamp, EmptyState, CountdownTimer } from "@/app/components/ui";
import { useTaskTimer } from "@/app/components/task-timer-context";
import {
  useToggleTaskCompleteTodayMutation,
  useUpdateTaskMutation,
} from "@/lib/api";

export type DashboardTaskRow = {
  id: string;
  title: string;
  description?: string;
  priority: string;
  plannedHours: number | null;
  plannedMinutes: number | null;
  plannedSeconds: number | null;
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
  const { state, startTask, pauseTask, resumeTask, restartTask, isTaskActive, canStartTask } = useTaskTimer();
  const [toggleTaskCompleteToday] = useToggleTaskCompleteTodayMutation();
  const [updateTask] = useUpdateTaskMutation();

  async function toggleTask(row: DashboardTaskRow) {
    if (row.kind !== "routine" && row.plannedMinutes && !isTaskActive(row.id) && state.activeTask?.id !== row.id) {
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
          const isActive = isTaskActive(row.id);
          const isRunning = isActive && state.status === "running";
          const isPaused = isActive && state.status === "paused";
          const isCompleted = isActive && state.status === "completed_pending";
          const totalSeconds = (row.plannedHours ?? 0) * 3600 + (row.plannedMinutes ?? 0) * 60 + (row.plannedSeconds ?? 0);
          const showTimer = totalSeconds > 0;

          const handleStart = () => {
            if (!canStartTask(row.id)) return;
            startTask({
              id: row.id,
              title: row.title,
              description: row.description,
              plannedSeconds: totalSeconds,
              kind: row.kind,
              isDailyTask: row.kind === "routine",
            });
          };

          const handlePause = () => pauseTask();
          const handleResume = () => resumeTask();
          const handleRestart = () => restartTask();

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
                disabled={row.kind !== "routine" && !!row.plannedMinutes && !isCompleted}
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
                    · {Math.floor(totalSeconds / 60)}m {totalSeconds % 60}s
                  </p>
                  {(row.startTime || row.endTime) && (
                    <CountdownTimer targetTime={row.startTime || row.endTime} />
                  )}
                  {showTimer && isActive && (
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs px-2 py-1 rounded bg-destructive/10 text-destructive">
                        {String(Math.floor(state.remainingMs / 60000)).padStart(2, "0")}:{String(Math.floor((state.remainingMs % 60000) / 1000)).padStart(2, "0")}
                      </span>
                      {isRunning && (
                        <button
                          onClick={handlePause}
                          className="btn btn-tertiary text-xs px-2 py-1"
                          aria-label="Pause timer"
                        >
                          ❚❚
                        </button>
                      )}
                      {isPaused && (
                        <button
                          onClick={handleResume}
                          className="btn btn-primary text-xs px-2 py-1"
                          aria-label="Resume timer"
                        >
                          ▶
                        </button>
                      )}
                      <button
                        onClick={handleRestart}
                        className="btn btn-tertiary text-xs px-2 py-1"
                        aria-label="Restart timer"
                        disabled={!isRunning && !isPaused}
                      >
                        ↻
                      </button>
                    </div>
                  )}
                  {showTimer && !isActive && canStartTask(row.id) && (
                    <button
                      onClick={handleStart}
                      className="btn btn-primary text-xs px-3 py-1.5"
                    >
                      Start Task
                    </button>
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