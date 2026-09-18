import { z } from "zod";

export const taskSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  estimatedMinutes: z.number().int().positive().optional(),
  dueDate: z.string().datetime().optional().or(z.literal("")),
  status: z
    .enum(["TODO", "IN_PROGRESS", "COMPLETED", "SKIPPED"])
    .default("TODO"),
});

export const notificationPreferenceSchema = z.object({
  browserEnabled: z.boolean().default(true),
  emailEnabled: z.boolean().default(false),
  telegramEnabled: z.boolean().default(false),
  linqEnabled: z.boolean().default(false),
  dailyReminderEnabled: z.boolean().default(true),
  missedTaskReminderEnabled: z.boolean().default(true),
  revisionReminderEnabled: z.boolean().default(true),
  weeklySummaryEnabled: z.boolean().default(true),
  quietHoursEnabled: z.boolean().default(true),
  quietHoursStart: z.string().default("22:00"),
  quietHoursEnd: z.string().default("07:00"),
  maxDailyNotifications: z.number().int().min(1).max(20).default(5),
  minNotificationInterval: z.number().int().min(5).max(1440).default(240),
  preferredChannel: z
    .enum(["browser", "email", "telegram", "linq"])
    .default("browser"),
});
