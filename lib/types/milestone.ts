import type { TaskPriority, TaskStatus } from "./task";

export interface Prerequisite {
  id: string;
  title: string;
  met: boolean;
}

export interface MilestoneProgress {
  completed: number;
  total: number;
  percent: number;
}

export interface MilestoneTask {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  taskType: string | null;
  difficulty: string | null;
  phaseTitle: string | null;
  topicTitle: string | null;
  sequenceOrder: number;
}

export interface MilestoneTopic {
  id: string;
  title: string;
  tasks: MilestoneTask[];
}

export interface MilestonePhase {
  id: string;
  title: string;
  category: string | null;
  topics: MilestoneTopic[];
}

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  status: "LOCKED" | "IN_PROGRESS" | "DONE";
  locked: boolean;
  manuallyCompleted: boolean;
  prereqMet: boolean;
  needsManualCompletion: boolean;
  prerequisites: Prerequisite[];
  progress: MilestoneProgress;
  phases: MilestonePhase[];
  nextUpTaskId: string | null;
}

export interface MilestonesData {
  roadmap: import("./roadmap").RoadmapSummary;
  nextUpTaskId: string | null;
  milestones: Milestone[];
  pinnedTaskIds: string[];
  phases: MilestonePhase[];
}

export interface MilestonesResponse extends MilestonesData {}

export interface CompleteMilestoneRequest {
  milestoneId: string;
  roadmapId: string;
}

export interface MilestoneStatusPill {
  label: string;
  tone: "neutral" | "valid" | "amber";
}

export interface Filters {
  q: string;
  category: string;
  phaseId: string;
  topicId: string;
  taskType: string;
  status: string;
  difficulty: string;
}

export const emptyFilters: Filters = {
  q: "",
  category: "",
  phaseId: "",
  topicId: "",
  taskType: "",
  status: "",
  difficulty: "",
};

export function taskMatches(task: MilestoneTask, filters: Filters) {
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

export function visiblePhases(milestone: Milestone, filters: Filters) {
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

export function statusPill(milestone: Milestone): {
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

export const KNOWN_TEMPLATES = [
  { roadmapId: "fullstack-v1", title: "Full Stack Web Development" },
  { roadmapId: "sde-master-roadmap", title: "SDE Master Roadmap" },
] as const;

export const RAMP =
  "linear-gradient(90deg, var(--color-amber-ink), var(--color-amber))";