"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Link2, Lock, Plus } from "lucide-react";
import {
  Bubble,
  EmptyNote,
  SectionHead,
  SkeletonRows,
  Stamp,
  FormError,
} from "@/app/components/ui";

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

const RAMP =
  "linear-gradient(90deg, var(--color-amber-ink), var(--color-amber))";

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
        Object.fromEntries(pinBody.pins.map((pin) => [pin.taskId, pin.id])),
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
      fetch("/api/daily-pins").then(
        (response) =>
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
    if (!data)
      return {
        categories: [],
        phases: [],
        topics: [],
        taskTypes: [],
        difficulties: [],
      };
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
          total += topic.tasks.filter((task) =>
            taskMatches(task, filters),
          ).length;
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
      setError(
        reason instanceof Error ? reason.message : "Unable to update the task.",
      );
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
      setError(
        reason instanceof Error ? reason.message : "Unable to update the pin.",
      );
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
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to complete the milestone.",
      );
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
    return <SkeletonRows rows={4} />;
  }

  return (
    <div>
      {error ? <FormError>{error}</FormError> : null}

      <section>
        <SectionHead
          index="01"
          title={title}
          instruction="Milestones gate each other — a milestone unlocks only when its prerequisites are done."
        />
        <div className="mt-4 flex flex-wrap items-end gap-2">
          <label className="min-w-[12rem] flex-1 text-[0.72rem] font-semibold text-graphite-2">
            Active roadmap
            <select
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
              className="field mt-1 appearance-none pr-6"
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
          </label>
          <button
            type="button"
            onClick={() => setActivateOpen(true)}
            className="btn btn-secondary shrink-0"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Activate
          </button>
        </div>
      </section>

      {loading ? (
        <SkeletonRows rows={4} />
      ) : data && data.milestones.length > 0 ? (
        <>
          {nextUpTask ? (
            <div className="mt-8 flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-xl border border-amber/25 bg-amber/[0.07] px-4 py-3">
              <Stamp tone="amber">Next up</Stamp>
              <span className="min-w-0 flex-1 truncate text-[0.875rem] font-medium text-graphite">
                {nextUpTask.title}
              </span>
              <span className="shrink-0 font-mono text-[0.68rem] text-graphite-2">
                {nextUpTask.phaseTitle} / {nextUpTask.topicTitle}
              </span>
            </div>
          ) : null}

          <section
            aria-label="Filters"
            className="mt-7 grid gap-x-4 gap-y-3 border-y border-stone-400 py-5 sm:grid-cols-2 lg:grid-cols-4"
          >
            <input
              value={filters.q}
              onChange={(event) => updateFilter("q", event.target.value)}
              placeholder="Search questions or topics"
              aria-label="Search questions or topics"
              className="field"
            />
            <select
              value={filters.phaseId}
              onChange={(event) => updateFilter("phaseId", event.target.value)}
              aria-label="Filter by phase"
              className="field appearance-none pr-6"
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
              aria-label="Filter by topic"
              className="field appearance-none pr-6"
            >
              <option value="">All topics</option>
              {facets.topics
                .filter(
                  (topic) =>
                    !filters.phaseId || topic.phaseId === filters.phaseId,
                )
                .map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.title}
                  </option>
                ))}
            </select>
            <select
              value={filters.category}
              onChange={(event) => updateFilter("category", event.target.value)}
              aria-label="Filter by category"
              className="field appearance-none pr-6"
            >
              <option value="">All categories</option>
              {facets.categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <select
              value={filters.taskType}
              onChange={(event) => updateFilter("taskType", event.target.value)}
              aria-label="Filter by question type"
              className="field appearance-none pr-6"
            >
              <option value="">All question types</option>
              {facets.taskTypes.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <select
              value={filters.status}
              onChange={(event) => updateFilter("status", event.target.value)}
              aria-label="Filter by status"
              className="field appearance-none pr-6"
            >
              <option value="">All statuses</option>
              <option value="TODO">To do</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="SKIPPED">Skipped</option>
            </select>
            <select
              value={filters.difficulty}
              onChange={(event) =>
                updateFilter("difficulty", event.target.value)
              }
              aria-label="Filter by difficulty"
              className="field appearance-none pr-6"
            >
              <option value="">All difficulty</option>
              {facets.difficulties.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <p className="self-end text-[0.78rem] font-medium text-graphite-2">
              {matchingTaskCount} matching task
              {matchingTaskCount === 1 ? "" : "s"}
            </p>
          </section>

          <div className="mt-8 space-y-9">
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
        <div className="mt-6">
          <EmptyNote>
            No roadmap active yet. Activate one to start working through its
            milestones.
          </EmptyNote>
          <button
            type="button"
            onClick={() => setActivateOpen(true)}
            className="btn btn-primary mt-4"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Activate a roadmap
          </button>
        </div>
      )}

      {activateOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b0f18]/50 px-4 py-8 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="activate-roadmap-title"
        >
          <div className="panel w-full max-w-md overflow-hidden p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4 border-b border-stone-400 pb-4">
              <h2
                id="activate-roadmap-title"
                className="text-[1.15rem] font-semibold tracking-tight text-graphite"
              >
                Activate a roadmap
              </h2>
              <button
                type="button"
                onClick={() => setActivateOpen(false)}
                aria-label="Close"
                className="-mr-1 -mt-1 px-2 py-1 font-mono text-lg leading-none text-graphite-2 hover:text-graphite"
              >
                ×
              </button>
            </div>
            <div className="mt-4 border-t border-stone-400">
              {KNOWN_TEMPLATES.map((template) => {
                const active = roadmaps.some(
                  (roadmap) => roadmap.id === template.roadmapId,
                );
                return (
                  <div
                    key={template.roadmapId}
                    className="flex items-center justify-between gap-3 border-b border-stone-400 py-3"
                  >
                    <span className="text-[0.9rem] font-medium text-graphite">
                      {template.title}
                    </span>
                    <button
                      type="button"
                      disabled={active || activating}
                      onClick={() => activateRoadmap(template.roadmapId)}
                      className={cn(
                        "btn shrink-0 px-3 py-1.5 text-[0.75rem]",
                        active ? "btn-secondary" : "btn-primary",
                      )}
                    >
                      {active
                        ? "Active"
                        : activating
                          ? "Activating"
                          : "Activate"}
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

function statusPill(milestone: Milestone): {
  label: string;
  tone: "neutral" | "valid" | "amber";
} {
  if (milestone.status === "LOCKED")
    return { label: "Locked", tone: "neutral" };
  if (milestone.status === "DONE")
    return {
      label: milestone.manuallyCompleted ? "Done · marked" : "Done",
      tone: "valid",
    };
  return { label: "In progress", tone: "amber" };
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
  const anyFilterActive = Boolean(
    filters.q ||
    filters.phaseId ||
    filters.topicId ||
    filters.category ||
    filters.taskType ||
    filters.status ||
    filters.difficulty,
  );

  return (
    <section className="border-t border-stone-400 pt-6">
      <header>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-md bg-amber/12 px-1.5 py-0.5 font-mono text-[0.68rem] font-semibold tabular-nums text-amber-ink">
            M{index + 1}
          </span>
          <h3 className="min-w-0 flex-1 text-[1.05rem] font-semibold tracking-tight text-graphite">
            {milestone.title}
          </h3>
          <Stamp tone={pill.tone}>
            {locked ? <Lock className="h-3 w-3" aria-hidden /> : null}
            {pill.label}
          </Stamp>
        </div>
        {milestone.description ? (
          <p className="mt-1.5 max-w-[68ch] text-[0.8125rem] leading-5 text-graphite-2">
            {milestone.description}
          </p>
        ) : null}

        <div className="mt-4 flex items-center gap-4">
          <div
            className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-rule"
            role="progressbar"
            aria-valuenow={milestone.progress.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${milestone.title} progress`}
          >
            <div
              className="h-full"
              style={{
                width: `${milestone.progress.percent}%`,
                backgroundImage: RAMP,
              }}
            />
          </div>
          <span className="shrink-0 font-mono text-[0.7rem] tabular-nums text-graphite-2">
            {milestone.progress.completed}/{milestone.progress.total} ·{" "}
            {milestone.progress.percent}%
          </span>
        </div>

        {locked && blockedPrereqs.length > 0 ? (
          <p className="mt-3 flex items-start gap-2 text-[0.8125rem] leading-5 text-graphite-2">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>
              Complete{" "}
              {blockedPrereqs
                .map((prereq) => `"${prereq.title}"`)
                .join(" and ")}{" "}
              first to unlock this milestone.
            </span>
          </p>
        ) : null}

        {milestone.needsManualCompletion && !locked ? (
          <button
            type="button"
            disabled={completing}
            onClick={() => onComplete(milestone)}
            className="btn btn-line mt-4 border-valid/40 px-3 py-1.5 text-[0.75rem] text-valid"
          >
            {completing ? "Marking complete" : "Mark milestone complete"}
          </button>
        ) : null}
      </header>

      <div className={locked ? "opacity-45" : ""}>
        {milestone.phases.map((phase) => {
          const renderedTopics = phase.topics.filter(
            (topic) => topic.tasks.length > 0,
          );
          if (renderedTopics.length === 0) return null;
          return (
            <details
              key={phase.id}
              className="group border-b border-stone-400"
              open={anyFilterActive}
            >
              <summary className="flex items-center gap-3 py-3 text-[0.9rem] font-semibold text-graphite">
                <span
                  aria-hidden
                  className="grid h-5 w-5 place-items-center rounded-md bg-amber/12 text-[0.85rem] leading-none text-amber-ink transition-transform duration-150 ease-out group-open:rotate-45"
                >
                  +
                </span>
                <span className="min-w-0 flex-1 truncate">{phase.title}</span>
                <span className="shrink-0 font-mono text-[0.68rem] text-graphite-2">
                  {renderedTopics.length} topic
                  {renderedTopics.length === 1 ? "" : "s"}
                </span>
              </summary>
              <div className="pb-1">
                {renderedTopics.map((topic) => (
                  <div key={topic.id} className="pb-2">
                    <p className="pt-2 text-[0.72rem] font-semibold text-graphite-2">
                      {topic.title}
                    </p>
                    <div className="border-t border-stone-400">
                      {topic.tasks.map((task, taskIndex) => {
                        const isDone = task.status === "COMPLETED";
                        const pinned = Boolean(pinnedById[task.id]);
                        return (
                          <div
                            key={task.id}
                            className="relative border-b border-stone-400 last:border-b-0"
                          >
                            <span className="hl" data-on={isDone} aria-hidden />
                            <div className="relative z-10 flex items-center gap-3 py-2.5 pl-1">
                              <span className="w-5 shrink-0 font-mono text-[0.62rem] tabular-nums text-graphite-3">
                                {String(taskIndex + 1).padStart(2, "0")}
                              </span>
                              <Bubble
                                filled={isDone}
                                busy={mutating === task.id}
                                disabled={locked}
                                label={
                                  isDone
                                    ? "Mark task incomplete"
                                    : "Mark task complete"
                                }
                                onClick={() => onToggleTask(task)}
                              />
                              <div className="min-w-0 flex-1">
                                <p
                                  className={
                                    isDone
                                      ? "truncate text-[0.875rem] leading-6 text-graphite-2 line-through decoration-graphite/50"
                                      : "truncate text-[0.875rem] leading-6 text-graphite"
                                  }
                                >
                                  {task.title}
                                </p>
                                <p className="mt-0.5 truncate font-mono text-[0.65rem] text-graphite-2">
                                  {[
                                    task.taskType,
                                    task.difficulty,
                                    task.priority,
                                  ]
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
                                    : pinned
                                      ? "Remove from daily"
                                      : "Add to daily"
                                }
                                aria-pressed={pinned}
                                className={`btn shrink-0 gap-1.5 px-2 py-1 text-[0.7rem] ${
                                  pinned
                                    ? "btn-line text-amber-ink shadow-[inset_0_0_0_1.5px_var(--color-amber-ink)]"
                                    : locked
                                      ? "cursor-not-allowed text-graphite-3"
                                      : "text-graphite-2 hover:text-graphite"
                                }`}
                              >
                                <Link2 className="h-3.5 w-3.5" aria-hidden />
                                {locked
                                  ? "Locked"
                                  : pinned
                                    ? "In daily"
                                    : "Daily"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
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
