export const timezones = (() => {
  try {
    return Intl.supportedValuesOf("timeZone") as string[];
  } catch {
    return [];
  }
})();

export const defaultNotificationSettings = {
  browserEnabled: false,
  emailEnabled: false,
  smsEnabled: false,
  phoneNumber: null as string | null,
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

export const scheduleLabel: Record<string, string> = {
  morning: "Morning Reminder",
  midday: "Midday Reminder",
  evening: "Evening Reminder",
  final: "Final Reminder",
  nextDay: "Next-Day Summary",
};

export type UserSettings = {
  id: string;
  name: string | null;
  email: string;
  timezone: string;
  dailyStudyTargetMinutes: number;
  theme: string;
};

export type NotificationSettings = typeof defaultNotificationSettings;

export type SettingsTab =
  | "account"
  | "appearance"
  | "notifications"
  | "configuration";