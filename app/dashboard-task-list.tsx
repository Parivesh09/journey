"use client";

import { useState } from "react";
import { Bubble, EmptyNote, Stamp } from "@/app/components/ui";

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
      <EmptyNote>
        Nothing on today&rsquo;s list. Add a routine or connect a roadmap task.
      </EmptyNote>
    );
  }

  return (
    <div className="mt-4">
      {error ? (
        <p className="mb-3 text-[0.75rem] font-medium text-stamp" role="alert">
          {error}
        </p>
      ) : null}
      <div className="border-t border-graphite/25">
        {items.map((row, index) => {
          const busy = updatingId === row.id;
          const urgent = ["HIGH", "CRITICAL"].includes(row.priority);
          return (
            <div
              key={`${row.kind}-${row.id}`}
              className="relative border-b border-graphite/15"
            >
              <span className="hl" data-on={row.done} aria-hidden />
              <div className="relative z-10 flex items-center gap-3 px-1 py-3">
                <span className="w-6 shrink-0 font-mono text-[0.68rem] tabular-nums text-graphite-3">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <Bubble
                  filled={row.done}
                  busy={busy}
                  label={row.done ? "Mark incomplete" : "Mark complete"}
                  onClick={() => toggleTask(row)}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={
                      row.done
                        ? "truncate text-[0.9rem] leading-6 text-graphite-2 line-through decoration-graphite/50"
                        : "truncate text-[0.9rem] font-medium leading-6 text-graphite"
                    }
                  >
                    {row.title}
                  </p>
                  <p className="mt-0.5 truncate text-[0.7rem] text-graphite-2">
                    {row.dailySlot?.replaceAll("_", " ") ??
                      row.category?.name ??
                      "Scheduled"}{" "}
                    · {row.plannedMinutes ?? row.estimatedMinutes ?? 60}m
                    {row.kind === "connected" ? " · connected" : ""}
                  </p>
                </div>
                <Stamp tone={urgent ? "stamp" : "neutral"}>
                  {row.priority}
                </Stamp>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
