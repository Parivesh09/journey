"use client";

import { useState, useEffect } from "react";
import { useTaskTimer } from "@/app/components/task-timer-context";
import { cn } from "@/lib/utils";
import {
  Play,
  Pause,
  RotateCcw,
  X,
  AlertCircle,
  Minimize2,
  Maximize2,
} from "lucide-react";

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getStatusIcon(status: string) {
  switch (status) {
    case "running":
      return (
        <span
          className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"
          aria-hidden="true"
        />
      );
    case "paused":
      return (
        <span
          className="w-1.5 h-1.5 rounded-full bg-amber"
          aria-hidden="true"
        />
      );
    case "completed_pending":
      return (
        <AlertCircle
          className="w-3.5 h-3.5 text-destructive"
          aria-hidden="true"
        />
      );
    default:
      return null;
  }
}

export function GlobalTaskTimer() {
  const { state, pauseTask, resumeTask, restartTask, completeTask, clearTask } =
    useTaskTimer();
  const [minimized, setMinimized] = useState(false);

  // Load minimized state from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("globalTimerMinimized");
      if (saved !== null) {
        setMinimized(JSON.parse(saved));
      }
    }
  }, []);

  // Save minimized state to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("globalTimerMinimized", JSON.stringify(minimized));
    }
  }, [minimized]);

  if (state.status === "idle" || !state.activeTask) return null;

  const isRunning = state.status === "running";
  const isPaused = state.status === "paused";
  const isCompleted = state.status === "completed_pending";

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      if (isCompleted) {
        clearTask();
      }
    }
  };

  if (minimized) {
    return (
      <div
        className={cn(
          "fixed bottom-4 right-4 z-50 card transition-all duration-300",
          "md:bottom-6 md:right-6",
          "animate-slide-in-up",
        )}
        role="status"
        aria-live="polite"
        aria-label="Active task timer (minimized)"
      >
        <div className="p-3 flex items-center gap-3 w-[220px]">
          <button
            onClick={() => setMinimized(false)}
            className="p-1 hover:bg-muted rounded-lg text-graphite-faint transition-colors"
            aria-label="Expand timer"
            title="Expand timer"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          {getStatusIcon(state.status)}
          <span className="font-mono text-sm font-bold text-foreground tabular-nums flex-1 text-center">
            {formatTime(state.remainingMs)}
          </span>
          {isRunning && (
            <button
              onClick={pauseTask}
              className="btn btn-secondary px-2 py-1 text-xs"
              aria-label="Pause timer"
            >
              <Pause className="w-3.5 h-3.5" />
            </button>
          )}
          {isPaused && (
            <button
              onClick={resumeTask}
              className="btn btn-primary px-2 py-1 text-xs"
              aria-label="Resume timer"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 w-[320px] card transition-all duration-300",
        "md:right-6 md:bottom-5",
        "animate-slide-in-right",
      )}
      role="status"
      aria-live="polite"
      aria-label="Active task timer"
      onKeyDown={handleKeyDown}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="badge badge-primary text-xs font-medium">
                {state.status === "running"
                  ? "● ACTIVE"
                  : state.status === "paused"
                    ? "Ⅱ PAUSED"
                    : "✓ COMPLETE"}
              </span>
              <span className="font-mono text-xs text-graphite-faint">
                CURRENT TASK
              </span>
            </div>
            <h3 className="text-sm font-medium text-foreground truncate pr-2">
              {state.activeTask.title}
            </h3>
            {(state.activeTask.phaseTitle ||
              state.activeTask.topicTitle ||
              state.activeTask.milestoneTitle) && (
              <p className="mt-1 text-xs text-graphite-faint flex flex-wrap gap-1">
                {state.activeTask.kind === "roadmap" && <span>Roadmap</span>}
                {state.activeTask.phaseTitle && (
                  <span>· {state.activeTask.phaseTitle}</span>
                )}
                {state.activeTask.topicTitle && (
                  <span>· {state.activeTask.topicTitle}</span>
                )}
                {state.activeTask.milestoneTitle && (
                  <span>· {state.activeTask.milestoneTitle}</span>
                )}
                {state.activeTask.isDailyTask && <span>· Daily</span>}
              </p>
            )}
            {state.activeTask.description && (
              <p className="mt-2 text-xs text-graphite-muted line-clamp-2">
                {state.activeTask.description}
              </p>
            )}
          </div>
          {/* <button
            onClick={clearTask}
            className="p-1 hover:bg-muted rounded-lg text-graphite-faint transition-colors flex-shrink-0"
            aria-label="Dismiss timer"
            title="Dismiss timer"
          >
            <X className="w-4 h-4" />
          </button> */}
          <button
            onClick={() => setMinimized(true)}
            className="p-1 hover:bg-muted rounded-lg text-graphite-faint transition-colors shrink-0 cursor-pointer"
            aria-label="Minimize timer"
            title="Minimize"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-baseline justify-between gap-4 mb-3">
            <span className="font-mono text-[2.5rem] font-bold text-foreground tabular-nums">
              {formatTime(state.remainingMs)}
            </span>
            <span className="text-xs font-medium text-graphite-muted">
              of {formatTime(state.originalDurationMs)}
            </span>
          </div>

          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-1000 ease-out",
                isRunning && "bg-primary",
                isPaused && "bg-amber",
                isCompleted && "bg-destructive",
              )}
              style={{
                width: `${Math.max(0, Math.min(100, ((state.originalDurationMs - state.remainingMs) / state.originalDurationMs) * 100))}%`,
              }}
            />
          </div>

          <div className="mt-4 flex items-center gap-2">
            {isRunning && (
              <>
                <button
                  onClick={pauseTask}
                  className="btn btn-secondary flex-1 justify-center gap-1.5"
                  aria-label="Pause timer"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </button>
                <button
                  onClick={restartTask}
                  className="btn btn-tertiary flex-1 justify-center gap-1.5"
                  aria-label="Restart timer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restart</span>
                </button>
              </>
            )}
            {isPaused && (
              <>
                <button
                  onClick={resumeTask}
                  className="btn btn-primary flex-1 justify-center gap-1.5"
                  aria-label="Resume timer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Resume</span>
                </button>
                <button
                  onClick={restartTask}
                  className="btn btn-tertiary flex-1 justify-center gap-1.5"
                  aria-label="Restart timer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restart</span>
                </button>
              </>
            )}
            {isCompleted && (
              <div className="flex items-center gap-2 w-full">
                <button
                  onClick={completeTask}
                  className="btn btn-primary flex-1 justify-center"
                  aria-label="Mark task as done"
                >
                  Mark as Done
                </button>
                <button
                  onClick={() => {
                    // Will show keep task dialog
                  }}
                  className="btn btn-secondary flex-1 justify-center"
                  aria-label="Keep task incomplete"
                >
                  Keep Task
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
