export type NotificationChannel =
  | "browser"
  | "email"
  | "telegram"
  | "linq"
  | "sms"
  | "whatsapp";

export type NotificationPayload = {
  userId: string;
  title: string;
  message: string;
  channel: NotificationChannel;
  metadata?: Record<string, unknown>;
};

export type NotificationResult = {
  success: boolean;
  provider: string;
  providerMessageId?: string;
  status?: string;
  errorCode?: string;
  errorMessage?: string;
};

export type NotificationProvider = {
  send(notification: NotificationPayload): Promise<NotificationResult>;
};

export type NotificationPreference = {
  browserEnabled: boolean;
  emailEnabled: boolean;
  telegramEnabled: boolean;
  linqEnabled: boolean;
  smsEnabled: boolean;
  whatsappEnabled: boolean;
  phoneNumber: string | null;
  reminderSchedule: unknown;
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
};
