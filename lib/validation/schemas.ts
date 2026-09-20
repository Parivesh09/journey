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

export const phoneSchema = z
  .string()
  .regex(/^\+[1-9]\d{7,14}$/, "Use an international format like +91XXXXXXXXXX");

export const reminderScheduleEntrySchema = z.object({
  key: z.string().min(1).max(40),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  enabled: z.boolean(),
});

export const notificationPreferenceSchema = z
  .object({
    browserEnabled: z.boolean().default(false),
    emailEnabled: z.boolean().default(false),
    telegramEnabled: z.boolean().default(false),
    linqEnabled: z.boolean().default(false),
    smsEnabled: z.boolean().default(false),
    whatsappEnabled: z.boolean().default(false),
    phoneNumber: z.union([phoneSchema, z.literal("")]).optional(),
    reminderSchedule: z.array(reminderScheduleEntrySchema).optional(),
    excludeCompletedTasks: z.boolean().default(true),
    dailyReminderEnabled: z.boolean().default(false),
    missedTaskReminderEnabled: z.boolean().default(false),
    revisionReminderEnabled: z.boolean().default(false),
    weeklySummaryEnabled: z.boolean().default(false),
    quietHoursEnabled: z.boolean().default(true),
    quietHoursStart: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
      .default("22:00"),
    quietHoursEnd: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
      .default("07:00"),
    maxDailyNotifications: z.number().int().min(1).max(20).default(5),
    minNotificationInterval: z.number().int().min(5).max(1440).default(30),
    preferredChannel: z
      .enum(["BROWSER", "EMAIL", "TELEGRAM", "LINQ", "SMS", "WHATSAPP"])
      .default("BROWSER"),
  });

export const accountSettingsSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    email: z.string().trim().email().optional(),
    timezone: z
      .string()
      .min(1)
      .max(64)
      .refine((value) => {
        try {
          new Intl.DateTimeFormat("en-US", { timeZone: value });
          return true;
        } catch {
          return false;
        }
      }, "Invalid IANA timezone")
      .optional(),
    dailyStudyTargetMinutes: z.number().int().min(15).max(720).optional(),
    theme: z.enum(["dark", "light"]).optional(),
    currentPassword: z.string().min(1).optional(),
    newPassword: z.string().min(8).max(128).optional(),
  })
  .strict()
  .refine(
    (values) => !values.newPassword || values.currentPassword,
    { message: "currentPassword is required to change the password", path: ["currentPassword"] },
  );