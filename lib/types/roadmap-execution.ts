import type { TaskPriority, TaskStatus } from "./task";
import type { RoadmapSummary } from "./roadmap";

export type ExecutionStatus = "TODO" | "IN_PROGRESS" | "COMPLETED";

export interface ExecutionTimer {
  id: string;
  status: ExecutionStatus;
  elapsedSeconds: number;
  estimatedSeconds?: number | null;
  startedAt: number | null; // timestamp
  pausedAt: number | null; // timestamp
}

export interface RoadmapExecution {
  id: string;
  title: string;
  description: string | null;
  progress: {
    completed: number;
    total: number;
    percent: number;
  };
  timeProgress: {
    estimatedSeconds: number;
    actualSeconds: number;
    remainingSeconds: number;
  };
  milestones: MilestoneExecution[];
  activeTimer: ExecutionTimer | null;
}

export interface MilestoneExecution {
  id: string;
  title: string;
  description: string | null;
  status: "LOCKED" | "IN_PROGRESS" | "DONE";
  locked: boolean;
  manuallyCompleted: boolean;
  prerequisites: {
    id: string;
    title: string;
    met: boolean;
  }[];
  progress: {
    completed: number;
    total: number;
    percent: number;
  };
  timeProgress: {
    estimatedSeconds: number;
    actualSeconds: number;
    remainingSeconds: number;
  };
  topics: TopicExecution[];
  phases: string[]; // Array of phase IDs
  activeTimer: ExecutionTimer | null;
}

export interface TopicExecution {
  id: string;
  title: string;
  description: string | null;
  progress: {
    completed: number;
    total: number;
    percent: number;
  };
  timeProgress: {
    estimatedSeconds: number;
    actualSeconds: number;
    remainingSeconds: number;
  };
  tasks: TaskExecution[];
  activeTimer: ExecutionTimer | null;
}

export interface TaskExecution {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  taskType: string | null;
  difficulty: string | null;
  phaseTitle: string | null;
  topicTitle: string | null;
  milestoneTitle: string | null;
  sequenceOrder: number;
  estimatedSeconds: number;
  actualSeconds: number;
  remainingSeconds: number;
  completedAt: Date | null;
  activeTimer: ExecutionTimer | null;
}

export interface NextRoadmapAction {
  type: "milestone" | "topic" | "task";
  id: string;
  title: string;
  description: string | null;
  estimatedSeconds: number;
  phaseTitle: string | null;
  topicTitle: string | null;
  milestoneTitle: string | null;
}