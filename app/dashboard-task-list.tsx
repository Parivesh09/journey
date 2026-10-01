"use client";

import { useState, type ReactNode } from "react";
import { Bubble, Stamp, EmptyState, CountdownTimer } from "@/app/components/ui";
import { Play, Pause, RotateCcw } from "lucide-react";
import { useTaskTimer } from "@/lib/store/timer-hooks";
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

const KIND_STAMP = {
  routine: { tone: "valid", label: "Routine" },
  connected: { tone: "amber", label: "Roadmap" },
  task: { tone: "neutral", label: "Personal" },
} as const;

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function TaskRow({
  title,
  description,
  category,
  kind,
  priority,
  dailySlot,
  done,
  updating,
  showTimer,
  isActive,
  isRunning,
  isPaused,
  isCompleted,
  remainingMs,
  targetTime,
  onToggle,
  onStart,
  onPause,
  onResume,
  onRestart,
  slotIcon,
}: {
  title: string;
  description?: string;
  category?: string;
  kind: DashboardTaskRow["kind"];
  priority: string;
  dailySlot: string | null;
  done: boolean;
  updating: boolean;
  showTimer: boolean;
  isActive: boolean;
  isRunning: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  remainingMs: number;
  targetTime?: Date | string | null;
  onToggle: () => void;
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onRestart?: () => void;
  slotIcon: ReactNode;
}) {
  const urgent = ["HIGH", "CRITICAL"].includes(priority);
  const stamp = KIND_STAMP[kind];

  return (
    <div className="task-row py-3" data-completed={done || undefined}>
      <Bubble
        filled={done}
        busy={updating}
        label={done ? "Mark incomplete" : "Mark complete"}
        onClick={onToggle}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p
            className={`task-title truncate text-sm ${
              done ? "text-graphite-faint line-through" : "text-foreground font-medium"
            }`}
          >
            {title}
          </p>
          <Stamp tone={stamp.tone}>{stamp.label}</Stamp>
        </div>
        {description && (
          <p className="mt-1 truncate text-sm text-graphite-muted line-clamp-2">{description}</p>
        )}
        <div className="mt-0.5 flex items-center gap-3 flex-wrap">
          <p className="truncate font-mono text-[0.7rem] text-graphite-faint">
            {slotIcon} {dailySlot?.replaceAll("_", " ") ?? category ?? "Scheduled"}
          </p>
          {targetTime && <CountdownTimer targetTime={targetTime} />}
          {showTimer && isActive && (
            <span className="font-mono text-xs px-2 py-1 rounded bg-destructive/10 text-destructive">
              {formatTime(remainingMs / 1000)}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <Stamp tone={urgent ? "stamp" : "neutral"} className="text-[0.7rem] shrink-0">
          {priority}
        </Stamp>
        {showTimer && isActive && (
          <div className="flex items-center gap-1">
            {isRunning && (
              <button
                onClick={onPause}
                className="p-1.5 rounded hover:bg-muted transition-colors"
                aria-label="Pause timer"
                title="Pause timer"
              >
                <Pause className="h-3.5 w-3.5" />
              </button>
            )}
            {isPaused && (
              <button
                onClick={onResume}
                className="p-1.5 rounded hover:bg-muted transition-colors"
                aria-label="Resume timer"
                title="Resume timer"
              >
                <Play className="h-3.5 w-3.5" />
              </button>
            )}
            {isCompleted && (
              <button
                onClick={onRestart}
                className="p-1.5 rounded hover:bg-muted transition-colors"
                aria-label="Restart timer"
                title="Restart timer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
        {showTimer && onStart && (
          <button
            onClick={onStart}
            className="p-1.5 rounded hover:bg-primary/10 hover:text-primary transition-colors"
            aria-label="Start Task"
            title="Start Task"
          >
            <Play className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

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
      await toggleTaskCompleteToday(row.id).unwrap();
      setItems((prev) =>
        prev.map((item) =>
          item.id === row.id ? { ...item, done: !item.done } : item
        )
      );
    } catch {
      setError("Unable to update task. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleStart(row: DashboardTaskRow) {
    if (!canStartTask(row.id)) return;
    const totalSeconds = (row.plannedHours ?? 0) * 3600 + (row.plannedMinutes ?? 0) * 60 + (row.plannedSeconds ?? 0);
    startTask({
      id: row.id,
      title: row.title,
      description: row.description,
      plannedSeconds: totalSeconds,
      kind: row.kind,
      isDailyTask: row.kind === "routine",
    });
  }

  const handlePause = () => pauseTask();
  const handleResume = () => resumeTask();
  const handleRestart = () => restartTask();

  function getSlotIcon(slot: string | null) {
    if (!slot) return <span className="text-graphite-faint">•</span>;
    const s = slot.toLowerCase();
    if (s.includes("morning")) return <span className="text-amber">☀</span>;
    if (s.includes("afternoon")) return <span className="text-sky">☀</span>;
    if (s.includes("evening")) return <span className="text-purple">🌙</span>;
    return <span className="text-graphite-faint">•</span>;
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {items.length === 0 ? (
        <EmptyState
          title="No tasks for today"
          description="Add a routine or pull a roadmap task to get started"
          action={
            <a href="/tasks" className="btn btn-primary">
              Manage Tasks
            </a>
          }
        />
      ) : (
        <>
          {items.map((row) => {
            const totalSeconds = (row.plannedHours ?? 0) * 3600 + (row.plannedMinutes ?? 0) * 60 + (row.plannedSeconds ?? 0);
            const showTimer = totalSeconds > 0;
            const isActive = isTaskActive(row.id);
            const isRunning = isActive && state.status === "running";
            const isPaused = isActive && state.status === "paused";
            const isCompleted = isActive && state.status === "completed_pending";

            return (
              <TaskRow
                key={row.id}
                title={row.title}
                description={row.description}
                category={row.category?.name}
                kind={row.kind}
                priority={row.priority}
                dailySlot={row.dailySlot}
                done={row.done}
                updating={updatingId === row.id}
                showTimer={showTimer}
                isActive={isActive}
                isRunning={isRunning}
                isPaused={isPaused}
                isCompleted={isCompleted}
                remainingMs={state.remainingMs}
                targetTime={row.startTime ?? row.endTime}
                onToggle={() => toggleTask(row)}
                onStart={showTimer && !isActive && canStartTask(row.id) ? () => handleStart(row) : undefined}
                onPause={isRunning ? handlePause : undefined}
                onResume={isPaused ? handleResume : undefined}
                onRestart={isCompleted ? handleRestart : undefined}
                slotIcon={getSlotIcon(row.dailySlot)}
              />
            );
          })}
        </>
      )}
    </div>
  );
}