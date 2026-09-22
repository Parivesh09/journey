"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Plus, Search, Link2, Link as LinkIcon, X } from "lucide-react";
import {
  SectionHead,
  Stamp,
  Bubble,
  PrimaryButton,
  SecondaryButton,
  EmptyState,
  FormGroup,
  IconButton,
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

type ActiveRoadmap = {
  id: string;
  title: string;
  description: string | null;
  dailyTaskCount: number;
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
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [activeTabInModal, setActiveTabInModal] = useState<"personal" | "roadmap">("personal");
  const [pickerQuery, setPickerQuery] = useState("");
  const [activeRoadmaps, setActiveRoadmaps] = useState<ActiveRoadmap[]>([]);
  const [roadmapsLoading, setRoadmapsLoading] = useState(false);
  const [selectedRoadmapTasks, setSelectedRoadmapTasks] = useState<PickerTask[]>([]);
  const [roadmapTasksLoading, setRoadmapTasksLoading] = useState(false);
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<string | null>(null);
  const [linkingAll, setLinkingAll] = useState(false);

  const pinnedTaskIds = useMemo(
    () => new Set(connected.map((item) => item.task.id)),
    [connected],
  );

  const filteredRoadmapTasks = useMemo(() => {
    if (!pickerQuery.trim()) return selectedRoadmapTasks;
    const query = pickerQuery.toLowerCase();
    return selectedRoadmapTasks.filter(
      (task) =>
        task.title.toLowerCase().includes(query) ||
        (task.phaseTitle ?? "").toLowerCase().includes(query) ||
        (task.topicTitle ?? "").toLowerCase().includes(query) ||
        (task.milestoneTitle ?? "").toLowerCase().includes(query)
    );
  }, [selectedRoadmapTasks, pickerQuery]);

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
      setAddModalOpen(false);
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
      setAddModalOpen(false);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to connect that task.",
      );
    }
  }

  async function loadActiveRoadmaps() {
    setRoadmapsLoading(true);
    try {
      const response = await fetch("/api/roadmaps");
      if (!response.ok) throw new Error("load");
      const data = (await response.json()) as { roadmaps: ActiveRoadmap[] };
      setActiveRoadmaps(data.roadmaps);
    } catch {
      setActiveRoadmaps([]);
    } finally {
      setRoadmapsLoading(false);
    }
  }

  async function loadRoadmapTasksForRoadmap(roadmapId: string) {
    setSelectedRoadmapId(roadmapId);
    setRoadmapTasksLoading(true);
    try {
      const response = await fetch(`/api/milestones?roadmapId=${roadmapId}`);
      if (!response.ok) throw new Error("load");
      const data = (await response.json()) as {
        milestones: Array<{
          phases: Array<{
            topics: Array<{
              tasks: PickerTask[];
            }>;
          }>;
        }>;
      };
      const tasks: PickerTask[] = [];
      for (const m of data.milestones) {
        for (const p of m.phases) {
          for (const t of p.topics) {
            tasks.push(...t.tasks);
          }
        }
      }
      setSelectedRoadmapTasks(tasks);
    } catch {
      setSelectedRoadmapTasks([]);
    } finally {
      setRoadmapTasksLoading(false);
    }
  }

  async function linkAllTasks() {
    if (selectedRoadmapTasks.length === 0) return;
    setLinkingAll(true);
    setError("");
    try {
      for (const task of selectedRoadmapTasks) {
        if (!pinnedTaskIds.has(task.id)) {
          await fetch("/api/daily-pins", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ taskId: task.id }),
          });
        }
      }
      // Reload daily feed
      const response = await fetch("/api/tasks?tab=daily");
      if (response.ok) {
        const daily = (await response.json()) as DailyFeed;
        setConnected(daily.connected);
      }
      setAddModalOpen(false);
      setSelectedRoadmapId(null);
      setSelectedRoadmapTasks([]);
    } catch {
      setError("Unable to link roadmap tasks.");
    } finally {
      setLinkingAll(false);
    }
  }

  useEffect(() => {
    if (addModalOpen && activeTabInModal === "roadmap") {
      loadActiveRoadmaps();
    }
  }, [addModalOpen, activeTabInModal]);

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

      <div className="flex justify-between items-center pb-4 border-b border-hairline">
        <div>
          <h2 className="text-[1.1rem] font-semibold text-graphite">Today's Workspace</h2>
          <p className="text-[0.85rem] text-graphite-muted">Personal daily routines and roadmap tasks</p>
        </div>
        <PrimaryButton onClick={() => setAddModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Daily Task
        </PrimaryButton>
      </div>

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
            action={
              <SecondaryButton onClick={() => {
                setActiveTabInModal("personal");
                setAddModalOpen(true);
              }}>
                Add Personal Routine
              </SecondaryButton>
            }
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
            action={
              <SecondaryButton onClick={() => {
                setActiveTabInModal("roadmap");
                setAddModalOpen(true);
              }}>
                Pull From Roadmap
              </SecondaryButton>
            }
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

      {/* Unified Add Task Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-ground/80 backdrop-blur-sm p-4">
          <div className="bg-paper rounded shadow-xl max-w-xl w-full max-h-[85vh] flex flex-col">
            <div className="p-6 border-b border-hairline flex items-center justify-between">
              <h3 className="text-[1.1rem] font-semibold text-graphite">Add Daily Task</h3>
              <button
                onClick={() => setAddModalOpen(false)}
                className="text-graphite-muted hover:text-graphite text-xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-hairline px-6">
              <button
                type="button"
                onClick={() => setActiveTabInModal("personal")}
                className={`py-3 px-4 text-[0.9rem] font-medium border-b-2 transition-colors ${
                  activeTabInModal === "personal"
                    ? "border-highlighter-amber text-graphite"
                    : "border-transparent text-graphite-muted hover:text-graphite"
                }`}
              >
                Personal Routine
              </button>
              <button
                type="button"
                onClick={() => setActiveTabInModal("roadmap")}
                className={`py-3 px-4 text-[0.9rem] font-medium border-b-2 transition-colors ${
                  activeTabInModal === "roadmap"
                    ? "border-highlighter-amber text-graphite"
                    : "border-transparent text-graphite-muted hover:text-graphite"
                }`}
              >
                From Active Roadmap
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {activeTabInModal === "personal" ? (
                <form onSubmit={addRoutine} className="space-y-4">
                  <FormGroup label="Routine Title">
                    <input
                      autoFocus
                      value={newTitle}
                      onChange={(event) => setNewTitle(event.target.value)}
                      placeholder="e.g. 30 min DSA Practice, Review Flashcards"
                      className="field border-b-2"
                    />
                  </FormGroup>
                  <p className="text-[0.75rem] text-graphite-faint">
                    Personal routines repeat every day and help build strong study habits.
                  </p>
                  <div className="pt-4 flex justify-end gap-3">
                    <SecondaryButton onClick={() => setAddModalOpen(false)}>
                      Cancel
                    </SecondaryButton>
                    <PrimaryButton type="submit" disabled={adding || !newTitle.trim()}>
                      {adding ? "Adding..." : "Add Routine"}
                    </PrimaryButton>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  {selectedRoadmapId ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[0.9rem] font-semibold text-graphite">
                          Daily Tasks in Selected Roadmap
                        </h4>
                        <IconButton
                          onClick={() => {
                            setSelectedRoadmapId(null);
                            setSelectedRoadmapTasks([]);
                            setPickerQuery("");
                          }}
                          ariaLabel="Back to roadmap list"
                        >
                          <X className="h-4 w-4" />
                        </IconButton>
                      </div>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-graphite-faint" />
                        <input
                          value={pickerQuery}
                          onChange={(event) => setPickerQuery(event.target.value)}
                          placeholder="Filter tasks..."
                          className="field pl-10 border-b-2"
                        />
                      </div>

                      <div className="max-h-[300px] overflow-y-auto space-y-1">
                        {roadmapTasksLoading ? (
                          <div className="space-y-2">
                            {[...Array(3)].map((_, i) => (
                              <div key={i} className="h-12 bg-paper-shade animate-pulse rounded" />
                            ))}
                          </div>
                        ) : filteredRoadmapTasks.length === 0 ? (
                          <EmptyState
                            title={pickerQuery.trim() ? "No matching tasks" : "No tasks in this roadmap"}
                            description={pickerQuery.trim() ? "Try a different search term" : "This roadmap has no pending tasks"}
                          />
                        ) : (
                          filteredRoadmapTasks.map((task) => {
                            const pinned = pinnedTaskIds.has(task.id);
                            return (
                              <div key={task.id} className="task-row py-2.5">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="truncate text-[0.85rem] font-medium text-graphite">
                                      {task.title}
                                    </p>
                                    <Stamp tone="amber">Roadmap</Stamp>
                                  </div>
                                  <p className="mt-0.5 truncate font-mono text-[0.65rem] text-graphite-faint">
                                    {task.phaseTitle ?? "No phase"} / {task.topicTitle ?? "No topic"}
                                  </p>
                                </div>
                                <SecondaryButton
                                  onClick={() => connectTask(task)}
                                  disabled={pinned}
                                  className="px-3 py-1 text-[0.75rem]"
                                >
                                  {pinned ? "Connected" : "Connect"}
                                </SecondaryButton>
                              </div>
                            );
                          })
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t border-hairline flex justify-end gap-3">
                        <SecondaryButton
                          onClick={() => {
                            setSelectedRoadmapId(null);
                            setSelectedRoadmapTasks([]);
                            setPickerQuery("");
                          }}
                        >
                          Back to Roadmaps
                        </SecondaryButton>
                        <PrimaryButton
                          onClick={linkAllTasks}
                          disabled={linkingAll || selectedRoadmapTasks.length === 0}
                        >
                          {linkingAll ? "Linking All..." : `Link All (${selectedRoadmapTasks.length})`}
                        </PrimaryButton>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-[0.85rem] text-graphite-muted">
                        Select an active roadmap to link its daily tasks to your workspace. Linked tasks will appear in your "Focus Tasks" section and can be completed daily.
                      </p>

                      {roadmapsLoading ? (
                        <div className="space-y-2">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-16 bg-paper-shade animate-pulse rounded" />
                          ))}
                        </div>
                      ) : activeRoadmaps.length === 0 ? (
                        <EmptyState
                          title="No active roadmaps"
                          description="Activate a roadmap from the Roadmap Library first"
                          action={
                            <SecondaryButton onClick={() => setAddModalOpen(false)}>
                              Browse Roadmaps
                            </SecondaryButton>
                          }
                        />
                      ) : (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                          {activeRoadmaps.map((roadmap) => (
                            <div
                              key={roadmap.id}
                              className="flex items-center justify-between p-4 border border-hairline rounded hover:border-hairline-strong hover:bg-paper-shade/50 transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-[0.9rem] font-medium text-graphite truncate">
                                  {roadmap.title}
                                </p>
                                {roadmap.description && (
                                  <p className="mt-1 text-[0.8rem] text-graphite-faint truncate">
                                    {roadmap.description}
                                  </p>
                                )}
                                <div className="mt-2 flex items-center gap-3 text-[0.75rem] text-graphite-faint">
                                  <span className="flex items-center gap-1">
                                    <LinkIcon className="h-3.5 w-3.5" />
                                    {roadmap.dailyTaskCount} daily tasks
                                  </span>
                                </div>
                              </div>
                              <SecondaryButton
                                onClick={() => loadRoadmapTasksForRoadmap(roadmap.id)}
                                className="shrink-0"
                              >
                                View & Link
                              </SecondaryButton>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
