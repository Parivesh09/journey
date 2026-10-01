"use client";

import { Stamp, Bubble, CountdownTimer } from "@/app/components/ui";
import { Play, Pause, RotateCcw, Edit, Trash2 } from "lucide-react";
import { useTaskTimer } from "@/lib/store/timer-hooks";
import type { Routine } from "./daily-types";

export function RoutineRow({
  routine,
  updating,
  onToggle,
  onEdit,
  onDelete,
}: {
  routine: Routine;
  updating: boolean;
  onToggle: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const totalSeconds =
    (routine.plannedHours ?? 0) * 3600 +
    (routine.plannedMinutes ?? 0) * 60 +
    (routine.plannedSeconds ?? 0);
  const showTimer = totalSeconds > 0;
  const {
    state,
    startTask,
    pauseTask,
    resumeTask,
    restartTask,
    isTaskActive,
    canStartTask,
  } = useTaskTimer();

  const isActive = isTaskActive(routine.id);
  const isRunning = isActive && state.status === "running";
  const isPaused = isActive && state.status === "paused";
  const isCompleted = isActive && state.status === "completed_pending";

  const handleStart = () => {
    if (!canStartTask(routine.id)) return;
    startTask({
      id: routine.id,
      title: routine.title,
      description: routine.description,
      plannedSeconds: totalSeconds,
      kind: "routine",
      isDailyTask: true,
    });
  };

  const handlePause = () => pauseTask();
  const handleResume = () => resumeTask();
  const handleRestart = () => restartTask();

  return (
    <div className="task-row py-3 group transition-colors duration-fast hover:bg-muted/30">
      <Bubble
        filled={routine.doneToday}
        busy={updating}
        label={routine.doneToday ? "Mark not done" : "Mark done"}
        onClick={onToggle}
        disabled={showTimer && !isCompleted}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p
            className={`truncate text-sm transition-all duration-fast ${
              routine.doneToday
                ? "text-graphite-faint line-through opacity-60"
                : "text-foreground font-medium"
            }`}
          >
            {routine.title}
          </p>
          <Stamp tone="valid">Routine</Stamp>
        </div>
        {routine.description && (
          <p className="mt-1 truncate text-sm text-graphite-muted line-clamp-2">
            {routine.description}
          </p>
        )}
        <div className="mt-0.5 flex items-center gap-3 flex-wrap">
          <p className="font-mono text-xs text-graphite-faint">
            Every day · {Math.floor(totalSeconds / 60)}m {totalSeconds % 60}s{" "}
            {routine.doneToday && "· done today"}
          </p>
          {(routine.startTime ?? routine.endTime) && (
            <CountdownTimer targetTime={routine.startTime ?? routine.endTime} />
          )}
          {showTimer && isActive && (
            <span className="font-mono text-xs px-2 py-1 rounded bg-destructive/10 text-destructive">
              {String(Math.floor(state.remainingMs / 60000)).padStart(2, "0")}:
              {String(Math.floor((state.remainingMs % 60000) / 1000)).padStart(
                2,
                "0",
              )}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <Stamp tone="neutral" className="text-xs shrink-0">
          {routine.priority}
        </Stamp>
        {showTimer && isActive && (
          <div className="flex items-center gap-1">
            {isRunning && (
              <button
                onClick={handlePause}
                className="p-1.5 rounded hover:bg-muted transition-colors"
                aria-label="Pause timer"
                title="Pause timer"
              >
                <Pause className="h-3.5 w-3.5" />
              </button>
            )}
            {isPaused && (
              <button
                onClick={handleResume}
                className="p-1.5 rounded hover:bg-muted transition-colors"
                aria-label="Resume timer"
                title="Resume timer"
              >
                <Play className="h-3.5 w-3.5" />
              </button>
            )}
            {!isRunning && !isPaused && (
              <button
                onClick={handleRestart}
                className="p-1.5 rounded hover:bg-muted transition-colors opacity-50 cursor-not-allowed"
                aria-label="Restart timer"
                title="Restart timer"
                disabled
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
        {showTimer && !isActive && canStartTask(routine.id) && (
          <button
            onClick={handleStart}
            className="p-1.5 rounded hover:bg-primary/10 hover:text-primary transition-colors"
            aria-label="Start Task"
            title="Start Task"
          >
            <Play className="h-3.5 w-3.5" />
          </button>
        )}
        {onEdit && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onEdit();
            }}
            className="p-1.5 rounded hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            style={{ pointerEvents: "auto", zIndex: 10 }}
            aria-label="Edit routine"
            title="Edit routine"
          >
            <Edit className="h-3.5 w-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onDelete();
            }}
            className="p-1.5 rounded hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
            style={{ pointerEvents: "auto", zIndex: 10 }}
            aria-label="Delete routine"
            title="Delete routine"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
