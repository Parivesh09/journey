"use client";

import { useState } from "react";
import { Bubble, Stamp, EmptyState } from "@/app/components/ui";
import {
  useToggleTaskCompleteTodayMutation,
  useUpdateTaskMutation,
} from "@/lib/api";

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
  const [toggleTaskCompleteToday] = useToggleTaskCompleteTodayMutation();
  const [updateTask] = useUpdateTaskMutation();

  async function toggleTask(row: DashboardTaskRow) {
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
                <p className="mt-0.5 truncate font-mono text-[0.7rem] text-graphite-faint">
                  {row.dailySlot?.replaceAll("_", " ") ??
                    row.category?.name ??
                    "Scheduled"}{" "}
                  · {row.plannedMinutes ?? row.estimatedMinutes ?? 60}m
                </p>
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
