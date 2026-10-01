"use client";

import { Dialog } from "./ui-overlays";
import { EmptyState, Stamp } from "./ui-layout";
import { PrimaryButton } from "./ui-forms";

// Types for daily tasks modal
export interface DailyTaskForDate {
  routines: Array<{
    id: string;
    title: string;
    description?: string | null;
    priority: string;
    plannedHours: number | null;
    plannedMinutes: number | null;
    plannedSeconds: number | null;
    dailySlot: string | null;
    startTime?: Date | string | null;
    endTime?: Date | string | null;
    doneToday: boolean;
  }>;
  connected: Array<{
    pinId: string;
    task: {
      id: string;
      title: string;
      description?: string | null;
      status: string;
      priority: string;
      phaseTitle: string | null;
      topicTitle: string | null;
      milestoneTitle: string | null;
      startTime?: Date | string | null;
      endTime?: Date | string | null;
      plannedHours: number | null;
      plannedMinutes: number | null;
      plannedSeconds: number | null;
    };
  }>;
}

interface DailyTasksModalProps {
  open: boolean;
  onClose: () => void;
  date: Date;
  tasks: DailyTaskForDate;
  onStartTask: (task: { id: string; title: string; description?: string | null; plannedSeconds: number; kind: "routine" | "task"; isDailyTask: boolean }) => void;
}

export function DailyTasksModal({ open, onClose, date, tasks, onStartTask }: DailyTasksModalProps) {
  if (!open) return null;

  const formatDate = (d: Date) => {
    return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  };

  const getTotalSeconds = (hours: number | null, minutes: number | null, seconds: number | null) => {
    return (hours ?? 0) * 3600 + (minutes ?? 0) * 60 + (seconds ?? 0);
  };

  const allTasks = [
    ...tasks.routines.map((r) => ({ ...r, kind: "routine" as const, plannedSeconds: getTotalSeconds(r.plannedHours, r.plannedMinutes, r.plannedSeconds) })),
    ...tasks.connected.map((c) => ({ ...c.task, kind: "connected" as const, plannedSeconds: getTotalSeconds(c.task.plannedHours, c.task.plannedMinutes, c.task.plannedSeconds) })),
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Tasks for ${formatDate(date)}`}
      description={`${tasks.routines.length} routines and ${tasks.connected.length} connected tasks`}
    >
      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        {allTasks.length === 0 ? (
          <EmptyState
            title="No tasks scheduled"
            description="No routines or connected tasks for this date"
          />
        ) : (
          <div className="space-y-3">
            {allTasks.map((task, idx) => (
              <div
                key={`${task.kind}-${task.id}-${idx}`}
                className="flex items-center justify-between p-4 border border-border rounded-xl bg-surface transition-all duration-fast hover:bg-muted/30"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-semibold text-sm">{idx + 1}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                    {task.description && (
                      <p className="mt-0.5 truncate text-xs text-graphite-muted line-clamp-1">{task.description}</p>
                    )}
                    <div className="mt-1 flex items-center gap-2 text-xs text-graphite-faint">
                      <Stamp tone={task.kind === "routine" ? "valid" : "amber"} className="text-[0.65rem]">
                        {task.kind === "routine" ? "Routine" : "Roadmap"}
                      </Stamp>
                      {task.kind === "connected" && task.phaseTitle && (
                        <span className="font-mono">{task.phaseTitle}</span>
                      )}
                      {task.plannedSeconds && task.plannedSeconds > 0 && (
                        <span className="font-mono">
                          {Math.floor(task.plannedSeconds / 60)}m {task.plannedSeconds % 60}s
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <PrimaryButton
                  onClick={() => onStartTask({
                    id: task.id,
                    title: task.title,
                    description: task.description,
                    plannedSeconds: task.plannedSeconds || 60 * 60,
                    kind: task.kind === "routine" ? "routine" : "task",
                    isDailyTask: task.kind === "routine",
                  })}
                  className="shrink-0"
                  size="sm"
                >
                  Start
                </PrimaryButton>
              </div>
            ))}
          </div>
        )}
      </div>
    </Dialog>
  );
}
