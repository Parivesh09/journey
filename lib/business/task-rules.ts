export type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type TaskRecord = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  completedAt?: Date | null;
};

export function completeTask(task: TaskRecord): TaskRecord {
  return {
    ...task,
    status: "COMPLETED",
    completedAt: new Date(),
  };
}

export function skipTask(task: TaskRecord): TaskRecord {
  return {
    ...task,
    status: "SKIPPED",
    completedAt: task.completedAt ?? null,
  };
}

export function getRevisionWindow(daysSinceLastReview: number): number[] {
  return [1, 3, 7, 14, 30].map((step) =>
    Math.max(1, daysSinceLastReview + step),
  );
}
