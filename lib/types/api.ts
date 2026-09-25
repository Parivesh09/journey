export interface ApiError {
  error: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface TaskCategory {
  id: string;
  name: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  categoryId: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  estimatedMinutes: number;
  plannedMinutes: number | null;
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

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED";

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
  };
}

export interface DailyFeed {
  tab: string;
  routines: RoutineTask[];
  connected: ConnectedTask[];
}

export interface RoadmapSummary {
  id: string;
  title: string;
  description: string | null;
  activated: boolean;
  dailyTaskCount?: number;
}

export interface RoadmapsResponse {
  roadmaps: RoadmapSummary[];
}

export interface ActiveRoadmap {
  id: string;
  title: string;
  description: string | null;
  dailyTaskCount: number;
}

export interface LinkedRoadmap {
  id: string;
  roadmapId: string;
  roadmap: RoadmapSummary;
}

export interface DailyRoadmapsResponse {
  linkedRoadmaps: LinkedRoadmap[];
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
  roadmap: RoadmapSummary;
  nextUpTaskId: string | null;
  milestones: Milestone[];
  pinnedTaskIds: string[];
  phases: MilestonePhase[];
}

export interface MilestonesResponse {
  data: MilestonesData;
  pinnedTaskIds: string[];
}

export interface CompleteMilestoneRequest {
  milestoneId: string;
  roadmapId: string;
}

export interface UserSettings {
  id: string;
  name: string | null;
  email: string;
  timezone: string;
  dailyStudyTargetMinutes: number;
  theme: string;
  onboardingDismissedAt: Date | null;
}

export interface NotificationPreferences {
  browserEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  phoneNumber: string | null;
  reminderSchedule: ReminderScheduleEntry[];
  excludeCompletedTasks: boolean;
  dailyReminderEnabled: boolean;
  missedTaskReminderEnabled: boolean;
  revisionReminderEnabled: boolean;
  weeklySummaryEnabled: boolean;
  weeklySummaryDay: number;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  maxDailyNotifications: number;
  minNotificationInterval: number;
  preferredChannel: string;
}

export interface ReminderScheduleEntry {
  key: string;
  time: string;
  enabled: boolean;
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

export interface NotificationReminder {
  id: string;
  title: string;
  message: string;
}

export interface PendingNotificationsResponse {
  reminders: NotificationReminder[];
}