"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Circle,
  Link2,
  LoaderCircle,
  Lock,
  Plus,
} from "lucide-react";

type RoadmapSummary = {
  id: string;
  title: string;
  description: string | null;
};

type MilestoneTask = {
  id: string;
  title: string;
  status: string;
  priority: string;
  taskType: string | null;
  difficulty: string | null;
  phaseTitle: string | null;
  topicTitle: string | null;
  sequenceOrder: number;
};

type MilestoneTopic = { id: string; title: string; tasks: MilestoneTask[] };
type MilestonePhase = {
  id: string;
  title: string;
  category: string | null;
  topics: MilestoneTopic[];
};

type Milestone = {
  id: string;
  title: string;
  description?: string;
  status: "LOCKED" | "IN_PROGRESS" | "DONE";
  locked: boolean;
  manuallyCompleted: boolean;
  prereqMet: boolean;
  needsManualCompletion: boolean;
  prerequisites: Array<{ id: string; title: string; met: boolean }>;
  progress: { completed: number; total: number; percent: number };
  phases: MilestonePhase[];
  nextUpTaskId: string | null;
};

type MilestonesData = {
  roadmap: RoadmapSummary;
  nextUpTaskId: string | null;
  milestones: Milestone[];
  pinnedTaskIds: string[];
};

const KNOWN_TEMPLATES = [
  { roadmapId: "fullstack-v1", title: "Full Stack Web Development" },
  { roadmapId: "sde-master-roadmap", title: "SDE Master Roadmap" },
];

type Filters = {
  q: string;
  category: string;
  phaseId: string;
  topicId: string;
  taskType: string;
  status: string;
  difficulty: string;
};

const emptyFilters: Filters = {
  q: "",
  category: "",
  phaseId: "",
  topicId: "",
  taskType: "",
  status: "",
  difficulty: "",
};

export default function RoadmapTab({
  title,
  initialFilters,
}: {
  title: string;
  initialFilters?: { category?: string; taskType?: string };
}) {
  const [roadmaps, setRoadmaps] = useState<RoadmapSummary[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [data, setData] = useState<MilestonesData | null>(null);
  const [pinnedById, setPinnedById] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<Filters>({
    ...emptyFilters,
    ...(initialFilters?.category ? { category: initialFilters.category } : {}),
    ...(initialFilters?.taskType ? { taskType: initialFilters.taskType } : {}),
  });
  const [activateOpen, setActivateOpen] = useState(false);
  const [activating, setActivating] = useState(false);
  const [mutating, setMutating] = useState<string | null>(null);
  const [completingMilestone, setCompletingMilestone] = useState<string | null>(
    null,
  );

  useEffect(() => {
    fetch("/api/roadmaps")
      .then((response) => response.json())
      .then((body: { roadmaps: RoadmapSummary[] }) => {
        setRoadmaps(body.roadmaps);
        if (body.roadmaps.length > 0 && !body.roadmaps[0]?.id) return;
        setSelectedId((current) => current || body.roadmaps[0]?.id || "");
      })
      .catch(() => setError("Unable to load your roadmaps."))
      .finally(() => setLoading(false));
  }, []);

  async function loadMilestones(roadmapId: string) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/milestones?roadmapId=${roadmapId}`);
      if (!response.ok) throw new Error("load");
      const body = (await response.json()) as MilestonesData;
      setData(body);
      const pinResponse = await fetch("/api/daily-pins");
      const pinBody = (await pinResponse.json()) as {
        pins: Array<{ id: string; taskId: string }>;
      };
      setPinnedById(
        Object.fromEntries(
          pinBody.pins.map((pin) => [pin.taskId, pin.id]),
        ),
      );
    } catch {
      setData(null);
      setError("Unable to load this roadmap. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    Promise.all([
      fetch(`/api/milestones?roadmapId=${selectedId}`).then((response) => {
        if (!response.ok) throw new Error("load");
        return response.json() as Promise<MilestonesData>;
      }),
      fetch("/api/daily-pins").then((response) =>
        response.json() as Promise<{
          pins: Array<{ id: string; taskId: string }>;
        }>,
      ),
    ])
      .then(([milestones, pinBody]) => {
        if (cancelled) return;
        setData(milestones);
        setPinnedById(
          Object.fromEntries(pinBody.pins.map((pin) => [pin.taskId, pin.id])),
        );
        setError("");
      })
      .catch(() => {
        if (cancelled) return;
        setData(null);
        setError("Unable to load this roadmap. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  async function activateRoadmap(roadmapId: string) {
    setActivating(true);
    setError("");
    try {
      const response = await fetch("/api/roadmaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roadmapId }),
      });
      if (!response.ok) throw new Error("activate");
      const body = (await response.json()) as RoadmapSummary;
      setRoadmaps((current) => [...current, body]);
      setSelectedId(body.id);
      setActivateOpen(false);
    } catch {
      setError("Unable to activate that roadmap.");
    } finally {
      setActivating(false);
    }
  }

  function updateFilter(name: keyof Filters, value: string) {
    setFilters((current) => ({
      ...current,
      [name]: value,
      ...(name === "phaseId" ? { topicId: "" } : {}),
    }));
  }

  const facets = useMemo(() => {
    if (!data) return { categories: [], phases: [], topics: [], taskTypes: [], difficulties: [] };
    const categories = new Set<string>();
    const phases = new Set<{ id: string; title: string }>();
    const topics = new Set<{ id: string; title: string; phaseId: string }>();
    const taskTypes = new Set<string>();
    const difficulties = new Set<string>();
    for (const milestone of data.milestones) {
      for (const phase of milestone.phases) {
        if (phase.category) categories.add(phase.category);
        phases.add({ id: phase.id, title: phase.title });
        for (const topic of phase.topics) {
          topics.add({ id: topic.id, title: topic.title, phaseId: phase.id });
          for (const task of topic.tasks) {
            if (task.taskType) taskTypes.add(task.taskType);
            if (task.difficulty) difficulties.add(task.difficulty);
          }
        }
      }
    }
    return {
      categories: [...categories].sort(),
      phases: [...phases].sort((a, b) => a.title.localeCompare(b.title)),
      topics: [...topics].sort((a, b) => a.title.localeCompare(b.title)),
      taskTypes: [...taskTypes].sort(),
      difficulties: [...difficulties].sort(),
    };
  }, [data]);

  const matchingTaskCount = useMemo(() => {
    if (!data) return 0;
    return data.milestones.reduce((total, milestone) => {
      for (const phase of visiblePhases(milestone, filters)) {
        for (const topic of phase.topics) {
          total += topic.tasks.filter((task) => taskMatches(task, filters))
            .length;
        }
      }
      return total;
    }, 0);
  }, [data, filters]);

  async function toggleTask(task: MilestoneTask) {
    if (mutating) return;
    setMutating(task.id);
    setError("");
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: task.status !== "COMPLETED" }),
      });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "toggle");
      }
      await loadMilestones(selectedId);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update the task.");
    } finally {
      setMutating(null);
    }
  }

  async function togglePin(task: MilestoneTask) {
    if (mutating) return;
    setMutating(task.id);
    setError("");
    try {
      const pinId = pinnedById[task.id];
      if (pinId) {
        const response = await fetch(`/api/daily-pins/${pinId}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("disconnect");
      } else {
        const response = await fetch("/api/daily-pins", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskId: task.id }),
        });
        if (!response.ok) {
          const body = (await response.json()) as { error?: string };
          throw new Error(body.error ?? "connect");
        }
      }
      await loadMilestones(selectedId);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update the pin.");
    } finally {
      setMutating(null);
    }
  }

  async function completeMilestone(milestone: Milestone) {
    setCompletingMilestone(milestone.id);
    setError("");
    try {
      const response = await fetch(`/api/milestones/${milestone.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roadmapId: selectedId }),
      });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "complete");
      }
      await loadMilestones(selectedId);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to complete the milestone.");
    } finally {
      setCompletingMilestone(null);
    }
  }

  const nextUpTask = useMemo(() => {
    if (!data?.nextUpTaskId) return null;
    for (const milestone of data.milestones) {
      for (const phase of milestone.phases) {
        for (const topic of phase.topics) {
          const task = topic.tasks.find(
            (item) => item.id === data.nextUpTaskId,
          );
          if (task) return task;
        }
      }
    }
    return null;
  }, [data]);

  if (loading && data === null && roadmaps.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-6 text-slate-400">
        <LoaderCircle className="h-5 w-5 animate-spin" /> Loading your roadmaps...
      </div>
    );
  }

  return (
    <div>
      {error ? (
        <p className="mb-5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-950/55 p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
              Roadmap
            </p>
            <h2 className="mt-1 text-xl font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-slate-400">
              Milestones gate each other — a milestone unlocks only when its
              prerequisites are done.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            >
              {roadmaps.length === 0 ? (
                <option value="">No active roadmap</option>
              ) : (
                roadmaps.map((roadmap) => (
                  <option key={roadmap.id} value={roadmap.id}>
                    {roadmap.title}
                  </option>
                ))
              )}
            </select>
            <button
              type="button"
              onClick={() => setActivateOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/50 px-4 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-400/10"
            >
              <Plus className="h-4 w-4" /> Activate
            </button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-6 text-slate-400">
          <LoaderCircle className="h-5 w-5 animate-spin" /> Loading milestones...
        </div>
      ) : data && data.milestones.length > 0 ? (
        <>
          {nextUpTask ? (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-cyan-400/25 bg-cyan-400/5 p-4">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                Next up
              </span>
              <span className="min-w-0 truncate text-sm text-slate-200">
                {nextUpTask.title}
              </span>
              <span className="ml-auto shrink-0 text-xs text-slate-500">
                {nextUpTask.phaseTitle} / {nextUpTask.topicTitle}
              </span>
            </div>
          ) : null}

          <section className="mb-6 grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <input
              value={filters.q}
              onChange={(event) => updateFilter("q", event.target.value)}
              placeholder="Search questions or topics"
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-cyan-400"
            />
            <select
              value={filters.phaseId}
              onChange={(event) => updateFilter("phaseId", event.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            >
              <option value="">All phases</option>
              {facets.phases.map((phase) => (
                <option key={phase.id} value={phase.id}>
                  {phase.title}
                </option>
              ))}
            </select>
            <select
              value={filters.topicId}
              onChange={(event) => updateFilter("topicId", event.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            >
              <option value="">All topics</option>
              {facets.topics
                .filter((topic) => !filters.phaseId || topic.phaseId === filters.phaseId)
                .map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.title}
                  </option>
                ))}
            </select>
            <select
              value={filters.category}
              onChange={(event) => updateFilter("category", event.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            >
              <option value="">All categories</option>
              {facets.categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <select
              value={filters.taskType}
              onChange={(event) => updateFilter("taskType", event.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            >
              <option value="">All question types</option>
              {facets.taskTypes.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <select
              value={filters.status}
              onChange={(event) => updateFilter("status", event.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            >
              <option value="">All statuses</option>
              <option value="TODO">To do</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="SKIPPED">Skipped</option>
            </select>
            <select
              value={filters.difficulty}
              onChange={(event) => updateFilter("difficulty", event.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            >
              <option value="">All difficulty</option>
              {facets.difficulties.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </section>

          <p className="mb-3 text-sm text-slate-500">
            {matchingTaskCount} matching task
            {matchingTaskCount === 1 ? "" : "s"}
          </p>

          <div className="grid gap-6">
            {data.milestones.map((milestone, index) => (
              <MilestoneCard
                key={milestone.id}
                milestone={milestone}
                pinnedById={pinnedById}
                filters={filters}
                mutating={mutating}
                completing={completingMilestone === milestone.id}
                index={index}
                onToggleTask={toggleTask}
                onTogglePin={togglePin}
                onComplete={completeMilestone}
              />
            ))}
          </div>
        </>
      ) : (
        <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-8 text-center">
          <p className="text-sm text-slate-400">
            No roadmap active yet. Activate one to start working through its
            milestones.
          </p>
          <button
            type="button"
            onClick={() => setActivateOpen(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950"
          >
            <Plus className="h-4 w-4" /> Activate a roadmap
          </button>
        </section>
      )}

      {activateOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="activate-roadmap-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-950 p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">
                  Add a roadmap
                </p>
                <h2 id="activate-roadmap-title" className="mt-1 text-2xl font-semibold">
                  Activate
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActivateOpen(false)}
                className="text-slate-400 hover:text-white"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="grid gap-3">
              {KNOWN_TEMPLATES.map((template) => {
                const active = roadmaps.some(
                  (roadmap) => roadmap.id === template.roadmapId,
                );
                return (
                  <div
                    key={template.roadmapId}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3"
                  >
                    <span className="text-sm font-medium text-slate-100">
                      {template.title}
                    </span>
                    <button
                      type="button"
                      disabled={active || activating}
                      onClick={() => activateRoadmap(template.roadmapId)}
                      className="rounded-lg border border-cyan-400/50 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-400/10 disabled:border-slate-700 disabled:text-slate-500"
                    >
                      {active ? "Active" : activating ? "Activating…" : "Activate"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function taskMatches(task: MilestoneTask, filters: Filters) {
  const search = filters.q.trim().toLowerCase();
  const matchesSearch =
    !search ||
    task.title.toLowerCase().includes(search) ||
    (task.topicTitle ?? "").toLowerCase().includes(search) ||
    (task.phaseTitle ?? "").toLowerCase().includes(search);
  return (
    matchesSearch &&
    (!filters.taskType || task.taskType === filters.taskType) &&
    (!filters.status || task.status === filters.status) &&
    (!filters.difficulty || task.difficulty === filters.difficulty)
  );
}

function visiblePhases(milestone: Milestone, filters: Filters) {
  return milestone.phases
    .filter((phase) => !filters.phaseId || phase.id === filters.phaseId)
    .filter((phase) => !filters.category || phase.category === filters.category)
    .map((phase) => ({
      ...phase,
      topics: phase.topics
        .filter((topic) => !filters.topicId || topic.id === filters.topicId)
        .map((topic) => ({
          ...topic,
          tasks: topic.tasks.filter((task) => taskMatches(task, filters)),
        })),
    }));
}

function statusPill(
  milestone: Milestone,
): { label: string; className: string } {
  if (milestone.status === "LOCKED")
    return {
      label: "Locked",
      className: "bg-slate-800 text-slate-400",
    };
  if (milestone.status === "DONE")
    return {
      label: milestone.manuallyCompleted ? "Done · marked" : "Done",
      className: "bg-emerald-500/15 text-emerald-300",
    };
  return {
    label: "In progress",
    className: "bg-cyan-400/15 text-cyan-300",
  };
}

function MilestoneCard({
  milestone,
  pinnedById,
  filters,
  mutating,
  completing,
  index,
  onToggleTask,
  onTogglePin,
  onComplete,
}: {
  milestone: Milestone;
  pinnedById: Record<string, string>;
  filters: Filters;
  mutating: string | null;
  completing: boolean;
  index: number;
  onToggleTask: (task: MilestoneTask) => void;
  onTogglePin: (task: MilestoneTask) => void;
  onComplete: (milestone: Milestone) => void;
}) {
  const pill = statusPill(milestone);
  const locked = milestone.locked;
  const blockedPrereqs = milestone.prerequisites.filter(
    (prereq) => !prereq.met,
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/55">
      <header className="border-b border-slate-800 bg-slate-900/40 px-6 py-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-slate-500">
            M{index + 1}
          </span>
          <h3 className="min-w-0 flex-1 text-lg font-semibold">{milestone.title}</h3>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${pill.className}`}
          >
            {locked ? <Lock className="h-3 w-3" /> : null}
            {pill.label}
          </span>
        </div>
        {milestone.description ? (
          <p className="mt-2 text-sm text-slate-400">{milestone.description}</p>
        ) : null}

        <div className="mt-4 flex items-center gap-4">
          <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-cyan-400 transition-all"
              style={{ width: `${milestone.progress.percent}%` }}
            />
          </div>
          <span className="shrink-0 text-xs text-slate-400">
            {milestone.progress.completed}/{milestone.progress.total} ·{" "}
            {milestone.progress.percent}%
          </span>
        </div>

        {locked && blockedPrereqs.length > 0 ? (
          <p className="mt-3 flex items-start gap-2 text-sm text-slate-500">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Complete {blockedPrereqs.map((prereq) => `"${prereq.title}"`).join(" and ")}{" "}
              first to unlock this milestone.
            </span>
          </p>
        ) : null}

        {milestone.needsManualCompletion && !locked ? (
          <button
            type="button"
            disabled={completing}
            onClick={() => onComplete(milestone)}
            className="mt-4 rounded-lg border border-emerald-400/50 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-400/10 disabled:opacity-50"
          >
            {completing ? "Marking complete…" : "Mark milestone complete"}
          </button>
        ) : null}
      </header>

      <div className={locked ? "opacity-50" : ""}>
        {milestone.phases.map((phase) => {
          const renderedTopics = phase.topics.filter(
            (topic) => topic.tasks.length > 0,
          );
          if (renderedTopics.length === 0) return null;
          const anyFilterActive = Boolean(
            filters.q || filters.phaseId || filters.topicId || filters.category
              || filters.taskType || filters.status || filters.difficulty,
          );
          return (
            <details key={phase.id} className="group" open={anyFilterActive}>
              <summary className="flex cursor-pointer items-center gap-3 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-900/50">
                <span className="text-xs uppercase tracking-[0.14em] text-cyan-300">
                  {phase.title}
                </span>
                <span className="ml-auto text-xs text-slate-500">
                  {renderedTopics.length} topic
                  {renderedTopics.length === 1 ? "" : "s"}
                </span>
              </summary>
              <div className="divide-y divide-slate-800">
                {renderedTopics.map((topic) => (
                  <div key={topic.id} className="px-6 py-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                      {topic.title}
                    </p>
                    <div className="divide-y divide-slate-800">
                      {topic.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-3 py-2.5"
                        >
                          <button
                            type="button"
                            aria-label={
                              task.status === "COMPLETED"
                                ? "Mark task incomplete"
                                : "Mark task complete"
                            }
                            disabled={locked || mutating === task.id}
                            onClick={() => onToggleTask(task)}
                            className={`shrink-0 disabled:cursor-not-allowed ${
                              locked ? "text-slate-600" : "text-cyan-300"
                            }`}
                          >
                            {mutating === task.id ? (
                              <LoaderCircle className="h-5 w-5 animate-spin" />
                            ) : task.status === "COMPLETED" ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                            ) : (
                              <Circle className="h-5 w-5" />
                            )}
                          </button>
                          <div className="min-w-0 flex-1">
                            <p
                              className={
                                task.status === "COMPLETED"
                                  ? "truncate text-sm text-slate-500 line-through"
                                  : "truncate text-sm"
                              }
                            >
                              {task.title}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-slate-600">
                              {[task.taskType, task.difficulty, task.priority]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          </div>
                          <button
                            type="button"
                            disabled={locked || mutating === task.id}
                            onClick={() => onTogglePin(task)}
                            title={
                              locked
                                ? "Unlock the milestone first"
                                : pinnedById[task.id]
                                  ? "Remove from daily"
                                  : "Add to daily"
                            }
                            className={`flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold disabled:cursor-not-allowed ${
                              pinnedById[task.id]
                                ? "border border-cyan-400/40 text-cyan-200"
                                : locked
                                  ? "text-slate-600"
                                  : "text-slate-400 hover:text-cyan-200"
                            }`}
                          >
                            <Link2 className="h-3.5 w-3.5" />
                            {locked ? "Locked" : pinnedById[task.id] ? "In daily" : "Daily"}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}