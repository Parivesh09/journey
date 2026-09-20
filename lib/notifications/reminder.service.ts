import { NotificationStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { ensureDailyTasks } from "@/lib/business/daily-plan";
import { EmailNotificationProvider } from "./providers/email/email.provider";
import { LinqNotificationProvider } from "./providers/linq/linq.provider";
import { TelegramNotificationProvider } from "./providers/telegram/telegram.provider";
import type {
  NotificationPayload,
  NotificationResult,
} from "./notification.types";

const SLOTS_PER_DAY = 6;

export type ReminderScheduleEntry = {
  key: string;
  time: string;
  enabled: boolean;
};

export const DEFAULT_REMINDER_SCHEDULE: ReminderScheduleEntry[] = [
  { key: "morning", time: "08:00", enabled: false },
  { key: "midday", time: "13:00", enabled: false },
  { key: "evening", time: "19:00", enabled: false },
  { key: "final", time: "22:00", enabled: false },
  { key: "nextDay", time: "08:00", enabled: false },
];

type ReminderPreferences = {
  browserEnabled: boolean;
  emailEnabled: boolean;
  telegramEnabled: boolean;
  linqEnabled: boolean;
  smsEnabled: boolean;
  whatsappEnabled: boolean;
  phoneNumber: string | null;
  reminderSchedule: unknown;
  overdueRemindersEnabled: boolean;
  excludeCompletedTasks: boolean;
  dailyReminderEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  maxDailyNotifications: number;
  minNotificationInterval: number;
};

const defaultPreferences: ReminderPreferences = {
  browserEnabled: false,
  emailEnabled: false,
  telegramEnabled: false,
  linqEnabled: false,
  smsEnabled: false,
  whatsappEnabled: false,
  phoneNumber: null,
  reminderSchedule: DEFAULT_REMINDER_SCHEDULE,
  overdueRemindersEnabled: false,
  excludeCompletedTasks: true,
  dailyReminderEnabled: false,
  quietHoursEnabled: true,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
  maxDailyNotifications: 5,
  minNotificationInterval: 30,
};

/** Parse a user's reminderSchedule JSON leniently; falls back to defaults. */
export function normalizeSchedule(
  value: unknown,
): ReminderScheduleEntry[] {
  if (!Array.isArray(value)) return DEFAULT_REMINDER_SCHEDULE;
  const cleaned = value.filter(
    (entry): entry is ReminderScheduleEntry =>
      Boolean(entry) &&
      typeof entry === "object" &&
      typeof (entry as ReminderScheduleEntry).key === "string" &&
      typeof (entry as ReminderScheduleEntry).time === "string" &&
      typeof (entry as ReminderScheduleEntry).enabled === "boolean",
  );
  return cleaned.length ? cleaned : DEFAULT_REMINDER_SCHEDULE;
}

function slotIndexOfTime(time: string) {
  const hour = Number((time ?? "0").split(":")[0]);
  return Math.max(0, Math.min(SLOTS_PER_DAY - 1, Math.floor((hour || 0) / 4)));
}

export function getReminderSlotIndex(localHour: number) {
  return Math.max(
    0,
    Math.min(SLOTS_PER_DAY - 1, Math.floor((localHour || 0) / 4)),
  );
}

/** A slot is eligible when the digest switch is on or the schedule enables it. */
export function isSlotEnabled(
  schedule: ReminderScheduleEntry[],
  slotIndex: number,
  dailyReminderEnabled: boolean,
) {
  if (dailyReminderEnabled) return true;
  return schedule.some(
    (entry) => entry.enabled && slotIndexOfTime(entry.time) === slotIndex,
  );
}

export type LocalTime = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

/** Read a date's clock in an arbitrary IANA timezone. */
export function getLocalTime(date: Date, timeZone = "UTC"): LocalTime {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );
  return values as unknown as LocalTime;
}

/**
 * The full notification safety gate. Every reminder must pass every step;
 * an absent pre-opt-in anywhere means "do not send".
 */
export function notificationAllowed(params: {
  userActive: boolean;
  reminderTypeEnabled: boolean;
  channelEnabled: boolean;
  hasContact: boolean;
  alreadySent: boolean;
  withinQuietHours: boolean;
  throttled: boolean;
}): { allowed: boolean; reason?: string } {
  if (!params.userActive) return { allowed: false, reason: "USER_INACTIVE" };
  if (!params.reminderTypeEnabled)
    return { allowed: false, reason: "REMINDER_TYPE_DISABLED" };
  if (params.withinQuietHours)
    return { allowed: false, reason: "QUIET_HOURS" };
  if (params.throttled) return { allowed: false, reason: "THROTTLED" };
  if (!params.channelEnabled)
    return { allowed: false, reason: "CHANNEL_DISABLED" };
  if (!params.hasContact) return { allowed: false, reason: "NO_CONTACT" };
  if (params.alreadySent) return { allowed: false, reason: "ALREADY_SENT" };
  return { allowed: true };
}

type RemindableUser = {
  id: string;
  email: string;
  timezone: string;
  preferences: ReminderPreferences;
  local: LocalTime;
  slotIndex: number;
  telegramChatId: string | null;
};

function dateKeyOf(local: LocalTime) {
  return `${local.year}-${String(local.month).padStart(2, "0")}-${String(local.day).padStart(2, "0")}`;
}

function inLocalQuietHours(
  local: LocalTime,
  start: string,
  end: string,
) {
  const minutes = local.hour * 60 + local.minute;
  const [sh, sm] = (start ?? "22:00").split(":").map(Number);
  const [eh, em] = (end ?? "07:00").split(":").map(Number);
  const quietStart = (sh || 0) * 60 + (sm || 0);
  const quietEnd = (eh || 0) * 60 + (em || 0);
  if (quietStart < quietEnd) return minutes >= quietStart && minutes < quietEnd;
  return minutes >= quietStart || minutes < quietEnd;
}

async function collectRemindableUsers(now: Date): Promise<RemindableUser[]> {
  const rows = await prisma.user.findMany({
    where: { isActive: true },
    include: {
      notificationPreferences: true,
      integrations: true,
    },
  });

  return rows.flatMap((row) => {
    const timezone = row.timezone || "UTC";
    const local = getLocalTime(now, timezone);
    const slotIndex = getReminderSlotIndex(local.hour);
    const preferences: ReminderPreferences =
      row.notificationPreferences ?? defaultPreferences;
    const schedule = normalizeSchedule(preferences.reminderSchedule);
    if (!isSlotEnabled(schedule, slotIndex, preferences.dailyReminderEnabled)) {
      return [];
    }
    const telegramChatId =
      row.integrations.find(
        (integration) =>
          Boolean(integration.telegramChatId) &&
          integration.provider.toLowerCase() === "telegram",
      )?.telegramChatId ?? null;
    return [
      {
        id: row.id,
        email: row.email,
        timezone,
        preferences,
        local,
        slotIndex,
        telegramChatId,
      },
    ];
  });
}

async function loadTodayTasks(userId: string, excludeCompleted: boolean, now: Date) {
  await ensureDailyTasks(userId, now);
  const nowMidnight = new Date(now);
  nowMidnight.setHours(0, 0, 0, 0);
  const dayEnd = new Date(nowMidnight);
  dayEnd.setDate(dayEnd.getDate() + 1);
  return prisma.task.findMany({
    where: {
      userId,
      ...(excludeCompleted ? { status: { notIn: ["COMPLETED", "SKIPPED"] } } : {}),
      dueDate: { gte: nowMidnight, lt: dayEnd },
    },
    orderBy: { sequenceOrder: "asc" },
    take: 50,
  });
}

type ChannelGate = {
  key: string;
  enabled: boolean;
  hasContact: boolean;
  provider: "email" | "linq" | "telegram";
  channel: "email" | "sms" | "whatsapp" | "telegram";
  buildPayload: (payload: NotificationPayload) => NotificationPayload;
};

function channelGatesFor(user: RemindableUser): ChannelGate[] {
  const preferences = user.preferences;
  return [
    {
      key: "email",
      enabled: preferences.emailEnabled,
      hasContact: Boolean(user.email),
      provider: "email",
      channel: "email",
      buildPayload: (payload) => ({
        ...payload,
        metadata: { ...payload.metadata, email: user.email },
      }),
    },
    {
      key: "sms",
      enabled: preferences.smsEnabled,
      hasContact: Boolean(preferences.phoneNumber),
      provider: "linq",
      channel: "sms",
      buildPayload: (payload) => ({
        ...payload,
        metadata: { ...payload.metadata, to: preferences.phoneNumber },
      }),
    },
    {
      key: "whatsapp",
      enabled: preferences.whatsappEnabled,
      hasContact: Boolean(preferences.phoneNumber),
      provider: "linq",
      channel: "whatsapp",
      buildPayload: (payload) => ({
        ...payload,
        metadata: { ...payload.metadata, to: preferences.phoneNumber },
      }),
    },
    {
      key: "telegram",
      enabled: preferences.telegramEnabled,
      hasContact: Boolean(user.telegramChatId),
      provider: "telegram",
      channel: "telegram",
      buildPayload: (payload) => ({
        ...payload,
        metadata: {
          ...payload.metadata,
          telegramChatId: user.telegramChatId ?? undefined,
        },
      }),
    },
  ];
}

const providerByChannel = {
  email: () => new EmailNotificationProvider(),
  linq: () => new LinqNotificationProvider(),
  telegram: () => new TelegramNotificationProvider(),
};

async function sendUserReminder(user: RemindableUser, now: Date) {
  const { preferences, local, slotIndex } = user;
  const tasks = await loadTodayTasks(
    user.id,
    preferences.excludeCompletedTasks,
    now,
  );
  if (!tasks.length) {
    return { userId: user.id, sent: false, reason: "NO_INCOMPLETE_TASK_FOR_TODAY" };
  }

  const reminderKey = `${user.id}:${dateKeyOf(local)}:${slotIndex}`;
  const existing = await prisma.notification.findUnique({
    where: { reminderKey },
    select: { id: true },
  });
  if (existing) {
    return { userId: user.id, sent: false, reason: "ALREADY_SENT_FOR_DAY_AND_SLOT" };
  }

  const gates = channelGatesFor(user).filter(
    (gate) =>
      notificationAllowed({
        userActive: true,
        reminderTypeEnabled: true,
        channelEnabled: gate.enabled,
        hasContact: gate.hasContact,
        alreadySent: false,
        withinQuietHours: false,
        throttled: false,
      }).allowed,
  );

  const browserEnabled = preferences.browserEnabled;
  if (!browserEnabled && gates.length === 0) {
    return { userId: user.id, sent: false, reason: "NO_ENABLED_CHANNEL" };
  }

  const title = "SDE Command Center reminder";
  const message = [
    "Remaining tasks for today:",
    ...tasks.map((task, index) => `${index + 1}. ${task.title}`),
    "Complete these tasks before the day ends.",
  ].join("\n");

  let reminder;
  try {
    reminder = await prisma.notification.create({
      data: {
        userId: user.id,
        taskId: tasks[0].id,
        reminderKey,
        provider: "fanout",
        channel: "BROWSER",
        title,
        message,
        scheduledFor: now,
        status: NotificationStatus.SENT,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { userId: user.id, sent: false, reason: "ALREADY_SENT_FOR_DAY_AND_SLOT" };
    }
    throw error;
  }

  const results: NotificationResult[] = [];
  for (const gate of gates) {
    const base: NotificationPayload = {
      userId: user.id,
      title,
      message,
      channel: gate.channel,
      metadata: {},
    };
    results.push(
      await providerByChannel[gate.provider]().send(gate.buildPayload(base)),
    );
  }

  const channelTokens: Record<string, "EMAIL" | "TELEGRAM" | "SMS" | "WHATSAPP"> = {
    email: "EMAIL",
    telegram: "TELEGRAM",
    sms: "SMS",
    whatsapp: "WHATSAPP",
  };
  for (let index = 0; index < results.length; index++) {
    const result = results[index];
    const gate = gates[index];
    await prisma.notificationLog.create({
      data: {
        userId: user.id,
        notificationId: reminder.id,
        provider: result.provider,
        providerMessageId: result.providerMessageId,
        channel: gate ? channelTokens[gate.channel] : "SMS",
        status: result.success ? "SENT" : "FAILED",
        title,
        message,
        errorCode: result.errorCode,
        errorMessage: result.errorMessage,
        sentAt: result.success ? now : undefined,
        failedAt: result.success ? undefined : now,
      },
    });
  }

  return {
    userId: user.id,
    sent: browserEnabled || results.some((result) => result.success),
    browserQueued: browserEnabled,
    taskCount: tasks.length,
    reminderKey,
    channels: results.map((result) => ({
      provider: result.provider,
      success: result.success,
    })),
  };
}

export async function sendDueReminders(now = new Date()) {
  const users = await collectRemindableUsers(now);
  const results = [];
  for (const user of users) {
    const quietHours = user.preferences.quietHoursEnabled
      ? inLocalQuietHours(
          user.local,
          user.preferences.quietHoursStart,
          user.preferences.quietHoursEnd,
        )
      : false;
    if (quietHours) {
      results.push({ userId: user.id, sent: false, reason: "QUIET_HOURS" });
      continue;
    }
    const todayKey = dateKeyOf(user.local);
    const sentToday = await prisma.notification.count({
      where: {
        userId: user.id,
        reminderKey: { startsWith: `${user.id}:${todayKey}` },
      },
    });
    if (sentToday >= (user.preferences.maxDailyNotifications || 5)) {
      results.push({ userId: user.id, sent: false, reason: "DAILY_LIMIT_REACHED" });
      continue;
    }
    results.push(await sendUserReminder(user, now));
  }
  return results;
}

export async function previewDueReminders(now = new Date()) {
  const users = await collectRemindableUsers(now);
  return Promise.all(
    users.map(async (user) => {
      const tasks = await loadTodayTasks(
        user.id,
        user.preferences.excludeCompletedTasks,
        now,
      );
      const reminderKey = `${user.id}:${dateKeyOf(user.local)}:${user.slotIndex}`;
      const existingReminder = await prisma.notification.findUnique({
        where: { reminderKey },
        select: { id: true },
      });
      return {
        userId: user.id,
        timezone: user.timezone,
        slotIndex: user.slotIndex,
        ready: !existingReminder && tasks.length > 0,
        reason: existingReminder
          ? "ALREADY_SENT_FOR_DAY_AND_SLOT"
          : tasks.length
            ? "READY"
            : "NO_INCOMPLETE_TASK_FOR_TODAY",
        taskCount: tasks.length,
        channels: {
          browser: user.preferences.browserEnabled,
          email: Boolean(user.preferences.emailEnabled && user.email),
          sms: Boolean(
            user.preferences.smsEnabled && user.preferences.phoneNumber,
          ),
          whatsapp: Boolean(
            user.preferences.whatsappEnabled && user.preferences.phoneNumber,
          ),
          telegram: Boolean(user.preferences.telegramEnabled && user.telegramChatId),
        },
        preferences: {
          dailyReminderEnabled: user.preferences.dailyReminderEnabled,
          maxDailyNotifications: user.preferences.maxDailyNotifications,
          excludeCompletedTasks: user.preferences.excludeCompletedTasks,
        },
      };
    }),
  );
}

export async function getPendingBrowserReminders(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      notificationPreferences: { select: { browserEnabled: true } },
    },
  });
  if (!user || !user.notificationPreferences?.browserEnabled) return [];

  const reminders = await prisma.notification.findMany({
    where: {
      userId: user.id,
      channel: "BROWSER",
      status: "SENT",
    },
    include: { task: true },
    orderBy: { createdAt: "asc" },
    take: 5,
  });

  if (reminders.length) {
    await prisma.notification.updateMany({
      where: { id: { in: reminders.map((reminder) => reminder.id) } },
      data: {
        status: "READ",
        lastProviderEvent: "browser-delivered",
        lastProviderEventAt: new Date(),
      },
    });
  }

  return reminders;
}