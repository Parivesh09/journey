"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link2, Plus, Search } from "lucide-react";
import {
  Bubble,
  EmptyNote,
  FormError,
  SectionHead,
  SkeletonRows,
  Stamp,
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
  return (
    <div className="relative border-b border-graphite/15 last:border-b-0">
      <span className="hl" data-on={routine.doneToday} aria-hidden />
      <div className="relative z-10 flex items-center gap-3 px-1 py-3">
        <Bubble
          filled={routine.doneToday}
          busy={updating}
          label={routine.doneToday ? "Mark not done today" : "Mark done today"}
          onClick={onToggle}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p
              className={
                routine.doneToday
                  ? "truncate text-[0.9rem] leading-6 text-graphite-2 line-through decoration-graphite/50"
                  : "truncate text-[0.9rem] font-medium leading-6 text-graphite"
              }
            >
              {routine.title}
            </p>
            <span className="badge badge-routine">Routine</span>
          </div>
          <p className="mt-0.5 truncate font-mono text-[0.65rem] text-graphite-2">
            Every day ·{" "}
            {routine.plannedMinutes ?? routine.estimatedMinutes ?? 60}m
            {routine.doneToday ? " · done today" : ""}
          </p>
        </div>
        <Stamp>{routine.priority}</Stamp>
      </div>
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
    <div>
      {error ? <FormError>{error}</FormError> : null}

      <section>
        <SectionHead
          index="01"
          title="Every-day habits"
          instruction={
            routines.length === 0
              ? "Small, repeatable habits you keep regardless of the roadmap."
              : `${remaining} of ${routines.length} left today. Routines reset each day.`
          }
        />
        <form onSubmit={addRoutine} className="mt-4 flex items-end gap-2">
          <input
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            placeholder="Add a routine, e.g. 30 min DSA"
            aria-label="New routine title"
            className="field"
          />
          <button
            type="submit"
            disabled={adding || !newTitle.trim()}
            aria-label="Add routine"
            className="btn btn-primary shrink-0"
          >
            <Plus className="h-4 w-4" aria-hidden />
            {adding ? "Adding" : "Add"}
          </button>
        </form>

        {loading ? (
          <SkeletonRows rows={2} />
        ) : routines.length === 0 ? (
          <EmptyNote>
            No routines yet. Start with one habit you can keep every day.
          </EmptyNote>
        ) : (
          <div className="mt-4 border-t border-graphite/25">
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

      <section className="mt-10">
        <SectionHead
          index="02"
          title="Focus tasks"
          instruction="Roadmap tasks you've pulled into your day. They stay here until you complete them."
          aside={`${connected.length} connected`}
        />
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="btn btn-secondary"
          >
            <Link2 className="h-4 w-4" aria-hidden />
            From roadmap
          </button>
        </div>

        {loading ? (
          <SkeletonRows rows={2} />
        ) : connected.length === 0 ? (
          <EmptyNote>
            Nothing connected. Pick unfinished roadmap tasks to work on here.
          </EmptyNote>
        ) : (
          <div className="mt-4 border-t border-graphite/25">
            {connected.map((item) => (
              <div
                key={item.pinId}
                className="flex items-center gap-3 border-b border-graphite/15 px-1 py-3 last:border-b-0"
              >
                <Bubble
                  filled={false}
                  busy={updating === item.task.id}
                  label={`Complete ${item.task.title}`}
                  onClick={() => completeConnected(item)}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[0.9rem] font-medium leading-6 text-graphite">
                      {item.task.title}
                    </p>
                    <span className="badge badge-roadmap">Roadmap</span>
                  </div>
                  <p className="mt-0.5 truncate font-mono text-[0.65rem] text-graphite-2">
                    {item.task.milestoneTitle ?? item.task.phaseTitle} /{" "}
                    {item.task.topicTitle ?? "General"}
                  </p>
                </div>
                <Stamp>{item.task.priority}</Stamp>
              </div>
            ))}
          </div>
        )}
      </section>

      {pickerOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b0f18]/50 px-4 py-8 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="roadmap-picker-title"
        >
          <div className="panel w-full max-w-2xl overflow-hidden p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4 border-b border-stone-400 pb-4">
              <h2
                id="roadmap-picker-title"
                className="text-[1.15rem] font-semibold tracking-tight text-graphite"
              >
                Pick from your roadmap
              </h2>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                aria-label="Close roadmap picker"
                className="-mr-1 -mt-1 px-2 py-1 font-mono text-lg leading-none text-graphite-2 hover:text-graphite"
              >
                ×
              </button>
            </div>

            <div className="relative mt-4">
              <Search
                className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite-3"
                aria-hidden
              />
              <input
                autoFocus
                value={pickerQuery}
                onChange={(event) => searchPicker(event.target.value)}
                placeholder="Search roadmap tasks"
                aria-label="Search roadmap tasks"
                className="field pl-6"
              />
            </div>

            <div className="mt-4 max-h-[50vh] overflow-y-auto">
              {pickerLoading ? (
                <SkeletonRows rows={3} />
              ) : pickerQuery.trim() && pickerResults.length === 0 ? (
                <EmptyNote>No unfinished tasks match that search.</EmptyNote>
              ) : (
                <div className="border-t border-graphite/25">
                  {pickerResults.map((task) => {
                    const pinned = pinnedTaskIds.has(task.id);
                    return (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 border-b border-graphite/15 px-1 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-[0.9rem] font-medium text-graphite">
                              {task.title}
                            </p>
                            <span className="badge badge-roadmap">Roadmap</span>
                          </div>
                          <p className="mt-0.5 truncate font-mono text-[0.65rem] text-graphite-2">
                            {task.phaseTitle ?? "No phase"} /{" "}
                            {task.topicTitle ?? "No topic"}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={pinned}
                          onClick={() => connectTask(task)}
                          className="btn btn-secondary shrink-0 px-3 py-1.5 text-[0.75rem]"
                        >
                          {pinned ? "Connected" : "Connect"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
