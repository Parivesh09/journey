import type { TaskCategory } from "./api";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED";
export type TaskType = "dsa" | "cs" | "development" | "system-design" | "project" | "revision" | "mock-interview" | "other";

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  categoryId: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  estimatedMinutes: number;
  plannedHours: number | null;
  plannedMinutes: number | null;
  plannedSeconds: number | null;
  dueDate: Date | null;
  taskType: string;
  difficulty: string | null;
  dailySlot: string | null;
  isDailyTask: boolean;
  isPersonalDaily: boolean;
  sourceId: string | null;
  roadmapId: string | null;
  milestoneId: string | null;
  milestoneTitle: string | null;
  phaseId: string | null;
  phaseTitle: string | null;
  topicId: string | null;
  topicTitle: string | null;
  sequenceOrder: number;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  category?: TaskCategory | null;
}

export interface RoutineTask extends Task {
  doneToday: boolean;
}

export interface ConnectedTask {
  pinId: string;
  task: {
    id: string;
    title: string;
    status: string;
    priority: string;
    phaseTitle: string | null;
    topicTitle: string | null;
    milestoneTitle: string | null;
    plannedHours: number | null;
    plannedMinutes: number | null;
    plannedSeconds: number | null;
  };
}

export interface DailyFeed {
  tab: string;
  routines: RoutineTask[];
  connected: ConnectedTask[];
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  categoryId?: string;
  estimatedMinutes?: number;
  plannedHours?: number;
  plannedMinutes?: number;
  plannedSeconds?: number;
  dueDate?: string;
  dailySlot?: string;
  startTime?: string;
  endTime?: string;
  taskType?: string;
  isPersonalDaily?: boolean;
}

export interface UpdateTaskInput {
  id: string;
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  categoryId?: string;
  estimatedMinutes?: number;
  plannedHours?: number;
  plannedMinutes?: number;
  plannedSeconds?: number;
  dueDate?: string;
  dailySlot?: string;
  startTime?: string;
  endTime?: string;
  completed?: boolean;
}

export interface TaskFilters {
  q: string;
  category: string;
  phaseId: string;
  topicId: string;
  taskType: string;
  status: string;
  difficulty: string;
}

export const DEFAULT_TASK_FILTERS: TaskFilters = {
  q: "",
  category: "",
  phaseId: "",
  topicId: "",
  taskType: "",
  status: "",
  difficulty: "",
};

export interface TaskCompletion {
  id: string;
  userId: string;
  taskId: string;
  completedAt: Date;
  createdAt: Date;
}

export interface DailyTaskPin {
  id: string;
  userId: string;
  taskId: string;
  createdAt: Date;
  task?: Task;
}