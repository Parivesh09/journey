import type { Task, RoutineTask, TaskPriority, TaskStatus } from "@/lib/types";
import type { UserSettings, NotificationPreferences, NotificationReminder } from "@/lib/types";
import type { RoadmapSummary } from "@/lib/types";

export interface TaskQueryParams {
  tab?: string;
  date?: string;
  roadmapId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
}

export interface CreateTaskInput {
  title: string;
  priority?: TaskPriority;
  isPersonalDaily?: boolean;
  description?: string;
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

export interface DailyFeed {
  tab: string;
  routines: RoutineTask[];
  connected: ConnectedTask[];
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

export interface RoadmapsResponse {
  roadmaps: RoadmapSummary[];
}

export interface RoadmapSummary {
  id: string;
  title: string;
  description: string | null;
  activated: boolean;
  dailyTaskCount?: number;
}

export interface ActivateRoadmapResponse {
  activated: boolean;
  roadmapId: string;
  categories: number;
  tasksCreated: number;
  tasksSkipped: number;
}

export interface DailyRoadmapsResponse {
  linkedRoadmaps: LinkedRoadmap[];
}

export interface LinkedRoadmap {
  id: string;
  roadmapId: string;
  roadmap: RoadmapSummary;
}

export interface LinkRoadmapResponse {
  message: string;
  linked: boolean;
  userDailyRoadmap: {
    id: string;
    userId: string;
    roadmapId: string;
    createdAt: Date;
  };
}

export interface UnlinkRoadmapResponse {
  message: string;
  linked: boolean;
}

export interface MilestoneResponse {
  roadmap: RoadmapSummary;
  nextUpTaskId: string | null;
  milestones: Milestone[];
  pinnedTaskIds: string[];
  phases: MilestonePhase[];
}

export interface MilestonePhase {
  id: string;
  title: string;
  category: string | null;
  topics: MilestoneTopic[];
}

export interface MilestoneTopic {
  id: string;
  title: string;
  tasks: MilestoneTask[];
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

export interface DailyPin {
  id: string;
  userId: string;
  taskId: string;
  createdAt: Date;
  task?: Task;
}

export interface DailyPinsResponse {
  pins: DailyPin[];
}

export interface PinTaskResponse {
  pin: DailyPin;
}

export interface SettingsResponse {
  user: UserSettings;
  notifications: NotificationPreferences | null;
}

export interface SaveSettingsRequest {
  name?: string;
  email?: string;
  timezone?: string;
  dailyStudyTargetMinutes?: number;
  theme?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface SaveSettingsResponse {
  user: UserSettings;
}

export interface StudySession {
  id: string;
  userId: string;
  durationMinutes: number;
  startedAt: Date;
  createdAt: Date;
}

export interface CreateStudySessionRequest {
  minutes: number;
}

export interface SessionResponse {
  authenticated: boolean;
  user?: UserSettings;
  notificationPreferences?: NotificationPreferences;
}

export interface AuthLoginRequest {
  email: string;
  password: string;
}

export interface AuthSignupRequest {
  name: string;
  email: string;
  password: string;
  timezone?: string;
}

export interface AuthResponse {
  user: UserSettings;
}

export interface PendingNotificationsResponse {
  reminders: NotificationReminder[];
}
