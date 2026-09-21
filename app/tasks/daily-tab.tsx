"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  CheckCircle2,
  Circle,
  LoaderCircle,
  Link2,
  Plus,
  Search,
} from "lucide-react";

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
    <div className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-900/70">
      <button
        type="button"
        aria-label={routine.doneToday ? "Mark not done today" : "Mark done today"}
        disabled={updating}
        onClick={onToggle}
        className="shrink-0 text-cyan-300 disabled:opacity-50"
      >
        {updating ? (
          <LoaderCircle className="h-5 w-5 animate-spin" />
        ) : routine.doneToday ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
        ) : (
          <Circle className="h-5 w-5 text-slate-500" />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <p
          className={
            routine.doneToday
              ? "truncate text-slate-500 line-through"
              : "truncate font-medium text-slate-100"
          }
        >
          {routine.title}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Every day · {routine.plannedMinutes ?? routine.estimatedMinutes ?? 60}m
          {routine.doneToday ? " · done today" : ""}
        </p>
      </div>
      <span className="rounded-md bg-slate-800 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-300">
        {routine.priority}
      </span>
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
        if (!cancelled) setError("Unable to load your daily feed. Please try again.");
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
        body: JSON.stringify({ title, priority: "MEDIUM", isPersonalDaily: true }),
      });
      if (!response.ok) throw new Error("create");
      const data = (await response.json()) as { task: Routine };
      setRoutines((current) => [{ ...data.task, doneToday: false }, ...current]);
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
          item.id === routine.id ? { ...item, doneToday: data.doneToday } : item,
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
      setConnected((current) => [
        ...current,
        { pinId: data.pin.id, task },
      ]);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to connect that task.",
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
      {error ? (
        <p className="mb-5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-950/55 p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
              Personal routines
            </p>
            <h2 className="mt-1 text-xl font-semibold">Every-day habits</h2>
            <p className="mt-1 text-sm text-slate-400">
              {routines.length === 0
                ? "Small, repeatable habits you keep regardless of the roadmap."
                : `${remaining} of ${routines.length} left today. Routines reset each day.`}
            </p>
          </div>
          <form onSubmit={addRoutine} className="flex gap-2">
            <input
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              placeholder="Add a routine, e.g. 30 min DSA"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-cyan-400 sm:w-72"
            />
            <button
              type="submit"
              disabled={adding || !newTitle.trim()}
              className="shrink-0 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
            </button>
          </form>
        </div>

        {loading ? (
          <div className="mt-5 flex items-center gap-3 rounded-xl bg-slate-900/70 p-4 text-sm text-slate-400">
            <LoaderCircle className="h-4 w-4 animate-spin" /> Loading routines...
          </div>
        ) : routines.length === 0 ? (
          <p className="mt-5 rounded-xl bg-slate-900/70 p-4 text-sm text-slate-400">
            No routines yet. Start with one habit you can keep every day.
          </p>
        ) : (
          <div className="mt-5 divide-y divide-slate-800 overflow-hidden rounded-xl border border-slate-800">
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

      <section className="rounded-2xl border border-slate-800 bg-slate-950/55 p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
              Connected from roadmap
            </p>
            <h2 className="mt-1 text-xl font-semibold">Focus tasks</h2>
            <p className="mt-1 text-sm text-slate-400">
              Roadmap tasks you&apos;ve pulled into your day. They stay here
              until you complete them.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/50 px-4 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-400/10"
          >
            <Link2 className="h-4 w-4" /> From roadmap
          </button>
        </div>

        {loading ? (
          <div className="mt-5 flex items-center gap-3 rounded-xl bg-slate-900/70 p-4 text-sm text-slate-400">
            <LoaderCircle className="h-4 w-4 animate-spin" /> Loading connected
            tasks...
          </div>
        ) : connected.length === 0 ? (
          <p className="mt-5 rounded-xl bg-slate-900/70 p-4 text-sm text-slate-400">
            Nothing connected. Pick unfinished roadmap tasks to work on here.
          </p>
        ) : (
          <div className="mt-5 divide-y divide-slate-800 overflow-hidden rounded-xl border border-slate-800">
            {connected.map((item) => (
              <div
                key={item.pinId}
                className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-900/70"
              >
                <button
                  type="button"
                  aria-label={`Complete ${item.task.title}`}
                  disabled={updating === item.task.id}
                  onClick={() => completeConnected(item)}
                  className="shrink-0 text-cyan-300 disabled:opacity-50"
                >
                  {updating === item.task.id ? (
                    <LoaderCircle className="h-5 w-5 animate-spin" />
                  ) : (
                    <Circle className="h-5 w-5 text-slate-500" />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-100">
                    {item.task.title}
                  </p>
                  <p className="mt-1 truncate text-xs text-slate-500">
                    {item.task.milestoneTitle ?? item.task.phaseTitle} /{" "}
                    {item.task.topicTitle ?? "General"}
                  </p>
                </div>
                <span className="rounded-md bg-slate-800 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-300">
                  {item.task.priority}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {pickerOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="roadmap-picker-title"
        >
          <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-950 p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">
                  Connect a task
                </p>
                <h2 id="roadmap-picker-title" className="mt-1 text-2xl font-semibold">
                  Pick from your roadmap
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="text-slate-400 hover:text-white"
                aria-label="Close roadmap picker"
              >
                ×
              </button>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                autoFocus
                value={pickerQuery}
                onChange={(event) => searchPicker(event.target.value)}
                placeholder="Search roadmap tasks"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-cyan-400"
              />
            </div>

            <div className="mt-4 max-h-[50vh] overflow-y-auto">
              {pickerLoading ? (
                <div className="flex items-center gap-3 rounded-lg border border-slate-800 p-4 text-sm text-slate-400">
                  <LoaderCircle className="h-4 w-4 animate-spin" /> Searching...
                </div>
              ) : pickerQuery.trim() && pickerResults.length === 0 ? (
                <p className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-400">
                  No unfinished tasks match that search.
                </p>
              ) : (
                <div className="divide-y divide-slate-800 overflow-hidden rounded-lg border border-slate-800">
                  {pickerResults.map((task) => {
                    const pinned = pinnedTaskIds.has(task.id);
                    return (
                      <div key={task.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-100">
                            {task.title}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-slate-500">
                            {task.phaseTitle ?? "No phase"} /{" "}
                            {task.topicTitle ?? "No topic"}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={pinned}
                          onClick={() => connectTask(task)}
                          className="shrink-0 rounded-lg border border-cyan-400/50 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-400/10 disabled:border-slate-700 disabled:text-slate-500 disabled:hover:bg-transparent"
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