export type NotificationChannel = "BROWSER" | "EMAIL" | "TELEGRAM" | "LINQ" | "SMS" | "WHATSAPP";
export type NotificationStatus = "QUEUED" | "SENT" | "DELIVERED" | "FAILED" | "READ";

export interface ReminderScheduleEntry {
  key: string;
  time: string;
  enabled: boolean;
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
  preferredChannel: NotificationChannel;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationPreferences = {
  browserEnabled: false,
  emailEnabled: false,
  smsEnabled: false,
  phoneNumber: null,
  reminderSchedule: [
    { key: "morning", time: "08:00", enabled: false },
    { key: "midday", time: "13:00", enabled: false },
    { key: "evening", time: "19:00", enabled: false },
    { key: "final", time: "22:00", enabled: false },
    { key: "nextDay", time: "08:00", enabled: false },
  ],
  excludeCompletedTasks: true,
  dailyReminderEnabled: false,
  missedTaskReminderEnabled: false,
  revisionReminderEnabled: false,
  weeklySummaryEnabled: false,
  weeklySummaryDay: 0,
  quietHoursEnabled: true,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
  maxDailyNotifications: 5,
  minNotificationInterval: 30,
  preferredChannel: "BROWSER",
};

export const SCHEDULE_LABELS: Record<string, string> = {
  morning: "Morning Reminder",
  midday: "Midday Reminder",
  evening: "Evening Reminder",
  final: "Final Reminder",
  nextDay: "Next-Day Summary",
};

export interface NotificationReminder {
  id: string;
  title: string;
  message: string;
}

export interface PendingNotificationsResponse {
  reminders: NotificationReminder[];
}

export interface Notification {
  id: string;
  userId: string;
  taskId: string | null;
  reminderKey: string | null;
  provider: string;
  channel: NotificationChannel;
  title: string;
  message: string;
  status: NotificationStatus;
  scheduledFor: Date | null;
  providerMessageId: string | null;
  lastProviderEvent: string | null;
  lastProviderEventAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}