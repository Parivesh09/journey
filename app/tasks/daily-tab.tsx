"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Plus, Search, Link2 } from "lucide-react";
import {
  SectionHead,
  Stamp,
  Bubble,
  PrimaryButton,
  SecondaryButton,
  EmptyState,
  Loader,
} from "@/app/components/ui";

type Routine = {
  id: string;
  title: string;
  priority: string;
  plannedMinutes: number | null;
  estimatedMinutes: number | null;
  dailySlot: string | null;
  doneToday: boolean;
};

type Connected = {
  pinId: string;
  task: {
    id: string;
    title: string;
    status: string;
    priority: string;
    phaseTitle: string | null;
    topicTitle: string | null;
    milestoneTitle: string | null;
  };
};

type PickerTask = {
  id: string;
  title: string;
  status: string;
  priority: string;
  phaseTitle: string | null;
  topicTitle: string | null;
  milestoneTitle: string | null;
};

type DailyFeed = {
  routines: Routine[];
  connected: Connected[];
};

function RoutineRow({
  routine,
  updating,
  onToggle,
}: {
  routine: Routine;
  updating: boolean;
  onToggle: () => void;
}) {
  const minutes = routine.plannedMinutes ?? routine.estimatedMinutes ?? 60;
  
  return (
    <div className="task-row py-3">
      <Bubble
        filled={routine.doneToday}
        busy={updating}
        label={routine.doneToday ? "Mark not done" : "Mark done"}
        onClick={onToggle}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={`truncate text-[0.9rem] ${routine.doneToday ? "text-graphite-faint line-through" : "text-graphite font-medium"}`}>
            {routine.title}
          </p>
          <Stamp tone="valid">Routine</Stamp>
        </div>
        <p className="mt-0.5 font-mono text-[0.7rem] text-graphite-faint">
          Every day · {minutes}m {routine.doneToday && "· done today"}
        </p>
      </div>
      <Stamp tone="neutral" className="text-[0.7rem]">
        {routine.priority}
      </Stamp>
    </div>
  );
}

export default function DailyTab() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [connected, setConnected] = useState<Connected[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [pickerResults, setPickerResults] = useState<PickerTask[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);

  const pinnedTaskIds = useMemo(
    () => new Set(connected.map((item) => item.task.id)),
    [connected],
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/api/tasks?tab=daily")
      .then((response) => {
        if (!response.ok) throw new Error("load");
        return response.json() as Promise<DailyFeed>;
      })
      .then((daily) => {
        if (cancelled) return;
        setRoutines(daily.routines);
        setConnected(daily.connected);
        setError("");
      })
      .catch(() => {
        if (!cancelled)
          setError("Unable to load your daily feed. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function addRoutine(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    setAdding(true);
    setError("");
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          priority: "MEDIUM",
          isPersonalDaily: true,
        }),
      });
      if (!response.ok) throw new Error("create");
      const data = (await response.json()) as { task: Routine };
      setRoutines((current) => [
        { ...data.task, doneToday: false },
        ...current,
      ]);
      setNewTitle("");
    } catch {
      setError("Unable to add that routine. Please try again.");
    } finally {
      setAdding(false);
    }
  }

  async function toggleRoutine(routine: Routine) {
    setUpdating(routine.id);
    setError("");
    try {
      const response = await fetch(`/api/tasks/${routine.id}/complete-today`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("toggle");
      const data = (await response.json()) as { doneToday: boolean };
      setRoutines((current) =>
        current.map((item) =>
          item.id === routine.id
            ? { ...item, doneToday: data.doneToday }
            : item,
        ),
      );
    } catch {
      setError("Unable to update that routine. Please try again.");
    } finally {
      setUpdating(null);
    }
  }

  async function searchPicker(query: string) {
    setPickerQuery(query);
    if (!query.trim()) {
      setPickerResults([]);
      return;
    }
    setPickerLoading(true);
    try {
      const params = new URLSearchParams({
        page: "1",
        pageSize: "50",
        status: "TODO",
        q: query,
      });
      const response = await fetch(`/api/tasks?${params}`);
      if (!response.ok) throw new Error("search");
      const data = (await response.json()) as { tasks: PickerTask[] };
      setPickerResults(data.tasks);
    } catch {
      setPickerResults([]);
    } finally {
      setPickerLoading(false);
    }
  }

  async function connectTask(task: PickerTask) {
    if (pinnedTaskIds.has(task.id)) return;
    setError("");
    try {
      const response = await fetch("/api/daily-pins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.id }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "pin");
      }
      const data = (await response.json()) as { pin: { id: string } };
      setConnected((current) => [...current, { pinId: data.pin.id, task }]);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to connect that task.",
      );
    }
  }

  async function completeConnected(item: Connected) {
    setUpdating(item.task.id);
    setError("");
    try {
      const response = await fetch(`/api/tasks/${item.task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: true }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "complete");
      }
      setConnected((current) =>
        current.filter((row) => row.pinId !== item.pinId),
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to complete that task.",
      );
    } finally {
      setUpdating(null);
    }
  }

  const remaining = routines.filter((routine) => !routine.doneToday).length;

  return (
    <div className="space-y-10">
      {error && (
        <div className="rounded bg-stamp-red/10 border border-stamp-red/20 p-3 text-[0.85rem] text-stamp-red">
          {error}
        </div>
      )}

      <section>
        <SectionHead
          index="01"
          title="Every-day Habits"
          instruction={
            routines.length === 0
              ? "Small, repeatable habits you keep regardless of roadmap"
              : `${remaining} of ${routines.length} left today. Routines reset each day.`
          }
        />
        
        <form onSubmit={addRoutine} className="mt-4 flex gap-3">
          <div className="flex-1">
            <input
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              placeholder="Add a routine, e.g. 30 min DSA"
              className="field border-b-2"
            />
          </div>
          <PrimaryButton type="submit" disabled={adding || !newTitle.trim()}>
            <Plus className="h-4 w-4" />
            {adding ? "Adding" : "Add"}
          </PrimaryButton>
        </form>

        {loading ? (
          <div className="mt-6 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-paper-shade animate-pulse rounded" />
            ))}
          </div>
        ) : routines.length === 0 ? (
          <EmptyState
            title="No routines yet"
            description="Start with one habit you can keep every day"
          />
        ) : (
          <div className="mt-6 border-t border-hairline">
            {routines.map((routine) => (
              <RoutineRow
                key={routine.id}
                routine={routine}
                updating={updating === routine.id}
                onToggle={() => toggleRoutine(routine)}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHead
          index="02"
          title="Focus Tasks"
          instruction="Roadmap tasks you've pulled into your day"
          aside={`${connected.length} connected`}
        />
        
        <div className="mt-4">
          <SecondaryButton onClick={() => setPickerOpen(true)}>
            <Link2 className="h-4 w-4" />
            From Roadmap
          </SecondaryButton>
        </div>

        {loading ? (
          <div className="mt-6 space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-16 bg-paper-shade animate-pulse rounded" />
            ))}
          </div>
        ) : connected.length === 0 ? (
          <EmptyState
            title="Nothing connected"
            description="Pick unfinished roadmap tasks to work on here"
          />
        ) : (
          <div className="mt-6 border-t border-hairline">
            {connected.map((item) => (
              <div key={item.pinId} className="task-row py-3">
                <Bubble
                  filled={false}
                  busy={updating === item.task.id}
                  label={`Complete ${item.task.title}`}
                  onClick={() => completeConnected(item)}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[0.9rem] font-medium text-graphite">
                      {item.task.title}
                    </p>
                    <Stamp tone="amber">Roadmap</Stamp>
                  </div>
                  <p className="mt-0.5 truncate font-mono text-[0.7rem] text-graphite-faint">
                    {item.task.milestoneTitle ?? item.task.phaseTitle} / {item.task.topicTitle ?? "General"}
                  </p>
                </div>
                <Stamp tone="neutral" className="text-[0.7rem]">
                  {item.task.priority}
                </Stamp>
              </div>
            ))}
          </div>
        )}
      </section>

      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-ground/80 backdrop-blur-sm p-4">
          <div className="bg-paper rounded shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-hairline">
              <div className="flex items-center justify-between">
                <h3 className="text-[1.1rem] font-semibold text-graphite">Pick from Roadmap</h3>
                <button
                  onClick={() => setPickerOpen(false)}
                  className="text-graphite-muted hover:text-graphite text-xl leading-none"
                >
                  ×
                </button>
              </div>
              <div className="mt-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-graphite-faint" />
                <input
                  autoFocus
                  value={pickerQuery}
                  onChange={(event) => searchPicker(event.target.value)}
                  placeholder="Search roadmap tasks"
                  className="field pl-10 border-b-2"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {pickerLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-paper-shade animate-pulse rounded" />
                  ))}
                </div>
              ) : pickerQuery.trim() && pickerResults.length === 0 ? (
                <EmptyState
                  title="No matches"
                  description="No unfinished tasks match that search"
                />
              ) : (
                <div className="space-y-1">
                  {pickerResults.map((task) => {
                    const pinned = pinnedTaskIds.has(task.id);
                    return (
                      <div key={task.id} className="task-row py-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-[0.9rem] font-medium text-graphite">
                              {task.title}
                            </p>
                            <Stamp tone="amber">Roadmap</Stamp>
                          </div>
                          <p className="mt-0.5 truncate font-mono text-[0.7rem] text-graphite-faint">
                            {task.phaseTitle ?? "No phase"} / {task.topicTitle ?? "No topic"}
                          </p>
                        </div>
                        <SecondaryButton
                          onClick={() => connectTask(task)}
                          disabled={pinned}
                          className="px-4 py-1.5 text-[0.8rem]"
                        >
                          {pinned ? "Connected" : "Connect"}
                        </SecondaryButton>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
