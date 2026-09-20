import { NotificationStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { ensureDailyTasks } from "@/lib/business/daily-plan";
import { EmailNotificationProvider } from "./providers/email/email.provider";
import { LinqNotificationProvider } from "./providers/linq/linq.provider";
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

/** The distinct messages a user's reminder preference can produce. */
export type ReminderType =
  | "daily"
  | "missedTasks"
  | "revisionReview"
  | "weeklySummary";

/** Reminder types that are evaluated from a task query (weekly uses week stats). */
export type DailyReminderType = Exclude<ReminderType, "weeklySummary">;

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
  smsEnabled: boolean;
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
};

const defaultPreferences: ReminderPreferences = {
  browserEnabled: false,
  emailEnabled: false,
  smsEnabled: false,
  phoneNumber: null,
  reminderSchedule: DEFAULT_REMINDER_SCHEDULE,
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
};

/** Which reminder types a user has opted into. */
export function eligibleReminderTypes(preferences: {
  dailyReminderEnabled: boolean;
  missedTaskReminderEnabled: boolean;
  revisionReminderEnabled: boolean;
}): DailyReminderType[] {
  const types: DailyReminderType[] = [];
  if (preferences.dailyReminderEnabled) types.push("daily");
  if (preferences.missedTaskReminderEnabled) types.push("missedTasks");
  if (preferences.revisionReminderEnabled) types.push("revisionReview");
  return types;
}

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

/** A slot is eligible when the digest master switch is on or the schedule enables it. */
export function isSlotEnabled(
  schedule: ReminderScheduleEntry[],
  slotIndex: number,
  masterEnabled: boolean,
) {
  if (masterEnabled) return true;
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

/** UTC Date instance of the user's local midnight. */
function localDayStart(local: LocalTime) {
  return new Date(Date.UTC(local.year, local.month - 1, local.day));
}

/** Day-of-week number (0=Sunday .. 6=Saturday) in the user's local timezone. */
export function localWeekday(local: LocalTime) {
  return localDayStart(local).getUTCDay();
}

/** Weekly summary fires only on the user's chosen local weekday. */
export function weeklySummaryDue(local: LocalTime, day: number) {
  return Boolean(local && localWeekday(local) === (day ?? 0));
}

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

/** Tasks due within the user's local day. */
export function todayTasksWhere(local: LocalTime): Prisma.TaskWhereInput {
  const start = localDayStart(local);
  return {
    dueDate: { gte: start, lt: new Date(start.getTime() + 86400000) },
  };
}

/** Tasks whose due date is before the user's local day and still open. */
export function overdueTasksWhere(local: LocalTime): Prisma.TaskWhereInput {
  return {
    status: { notIn: ["COMPLETED", "SKIPPED"] },
    dueDate: { lt: localDayStart(local) },
  };
}

/** Template revision items due within the user's local day that are open. */
export function revisionTasksWhere(local: LocalTime): Prisma.TaskWhereInput {
  const start = localDayStart(local);
  return {
    status: { notIn: ["COMPLETED", "SKIPPED"] },
    taskType: "revision",
    dueDate: { gte: start, lt: new Date(start.getTime() + 86400000) },
  };
}

/** The title/body for a given reminder type once its tasks are known. */
export function buildReminderMessage(
  type: ReminderType,
  tasks: Array<{ title: string }>,
): { title: string; message: string } {
  const list = tasks.map((task, index) => `${index + 1}. ${task.title}`);
  const suffix = tasks.length === 1 ? "" : "s";
  switch (type) {
    case "missedTasks":
      return {
        title: "Missed tasks need your attention",
        message: [
          `You have ${tasks.length} overdue task${suffix} not yet completed:`,
          ...list,
          "Reschedule or complete them so your plan stays on track.",
        ].join("\n"),
      };
    case "revisionReview":
      return {
        title: "Revision is due today",
        message: [
          `Review these ${tasks.length} revision item${suffix} before the day ends:`,
          ...list,
        ].join("\n"),
      };
    default:
      return {
        title: "SDE Command Center reminder",
        message: [
          "Remaining tasks for today:",
          ...list,
          "Complete these tasks before the day ends.",
        ].join("\n"),
      };
  }
}

/** The weekly-summary message from the past-7-days stats. */
export function buildWeeklySummaryMessage(params: {
  completedCount: number;
  focusMinutes: number;
  completedTasks: Array<{ title: string }>;
}): { title: string; message: string } {
  const taskSuffix = params.completedCount === 1 ? "" : "s";
  const head = `You completed ${params.completedCount} task${taskSuffix} and logged ${params.focusMinutes} min of study this week.`;
  const list = params.completedTasks.map(
    (task, index) => `${index + 1}. ${task.title}`,
  );
  return {
    title: "SDE Command Center — weekly summary",
    message: [
      head,
      ...(list.length ? ["Highlights:"] : []),
      ...list,
      "Keep the streak going — your roadmap re-syncs on schedule.",
    ].join("\n"),
  };
}

type RemindableUser = {
  id: string;
  email: string;
  timezone: string;
  preferences: ReminderPreferences;
  local: LocalTime;
  slotIndex: number;
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
    },
  });

  return rows.flatMap((row) => {
    const timezone = row.timezone || "UTC";
    const local = getLocalTime(now, timezone);
    const slotIndex = getReminderSlotIndex(local.hour);
    const preferences: ReminderPreferences =
      row.notificationPreferences ?? defaultPreferences;
    const schedule = normalizeSchedule(preferences.reminderSchedule);
    // Any enabled type turns the slot machine on (schedule entries still fine-tune it).
    const hasAnyReminderEnabled =
      preferences.dailyReminderEnabled ||
      preferences.missedTaskReminderEnabled ||
      preferences.revisionReminderEnabled ||
      preferences.weeklySummaryEnabled;
    if (!isSlotEnabled(schedule, slotIndex, hasAnyReminderEnabled)) {
      return [];
    }
    return [
      {
        id: row.id,
        email: row.email,
        timezone,
        preferences,
        local,
        slotIndex,
      },
    ];
  });
}

async function loadTasksFor(
  userId: string,
  where: Prisma.TaskWhereInput,
  now: Date,
) {
  await ensureDailyTasks(userId, now);
  return prisma.task.findMany({
    where: { userId, ...where },
    orderBy: { sequenceOrder: "asc" },
    take: 50,
  });
}

type ChannelGate = {
  key: string;
  enabled: boolean;
  hasContact: boolean;
  provider: "email" | "linq";
  channel: "email" | "sms";
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
  ];
}

const providerByChannel = {
  email: () => new EmailNotificationProvider(),
  linq: () => new LinqNotificationProvider(),
};

type ReminderPlan = {
  type: ReminderType;
  key: string;
  tasks: Array<{ id: string; title: string }>;
  title: string;
  message: string;
};

/** All reminder messages a user is opted into that have something to say today. */
async function buildPlans(user: RemindableUser, now: Date): Promise<ReminderPlan[]> {
  const whereFor: Record<DailyReminderType, Prisma.TaskWhereInput> = {
    daily: {
      ...(user.preferences.excludeCompletedTasks
        ? { status: { notIn: ["COMPLETED", "SKIPPED"] } }
        : {}),
      ...todayTasksWhere(user.local),
    },
    missedTasks: overdueTasksWhere(user.local),
    revisionReview: revisionTasksWhere(user.local),
  };

  const plans: ReminderPlan[] = [];
  for (const type of eligibleReminderTypes(user.preferences)) {
    const tasks = await loadTasksFor(user.id, whereFor[type], now);
    if (!tasks.length) continue;
    const { title, message } = buildReminderMessage(type, tasks);
    plans.push({
      type,
      key: `${dateKeyOf(user.local)}:${user.slotIndex}:${type}`,
      tasks,
      title,
      message,
    });
  }

  if (
    user.preferences.weeklySummaryEnabled &&
    weeklySummaryDue(user.local, user.preferences.weeklySummaryDay)
  ) {
    const weekly = await buildWeeklySummaryPlan(user);
    if (weekly) plans.push(weekly);
  }

  return plans;
}

/** Past-7-days stats plan; null when the user logged no activity to report. */
async function buildWeeklySummaryPlan(
  user: RemindableUser,
): Promise<ReminderPlan | null> {
  const weekStart = new Date(localDayStart(user.local).getTime() - 6 * 86400000);
  const [completedCount, completedTasks, focus] = await Promise.all([
    prisma.task.count({
      where: {
        userId: user.id,
        status: "COMPLETED",
        completedAt: { gte: weekStart },
      },
    }),
    prisma.task.findMany({
      where: {
        userId: user.id,
        status: "COMPLETED",
        completedAt: { gte: weekStart },
      },
      orderBy: { completedAt: "desc" },
      take: 5,
      select: { id: true, title: true },
    }),
    prisma.studySession.aggregate({
      where: { userId: user.id, startedAt: { gte: weekStart } },
      _sum: { durationMinutes: true },
    }),
  ]);

  const focusMinutes = focus._sum.durationMinutes ?? 0;
  if (completedCount === 0 && focusMinutes === 0) return null;

  const { title, message } = buildWeeklySummaryMessage({
    completedCount,
    focusMinutes,
    completedTasks,
  });
  return {
    type: "weeklySummary",
    key: `${dateKeyOf(user.local)}:${user.slotIndex}:weeklySummary`,
    tasks: completedTasks,
    title,
    message,
  };
}

type SendResult = {
  userId: string;
  type?: ReminderType;
  sent: boolean;
  reason?: string;
  browserQueued?: boolean;
  taskCount?: number;
  reminderKey?: string;
  channels?: Array<{ provider: string; success: boolean }>;
};

async function sendUserReminders(user: RemindableUser, now: Date): Promise<SendResult[]> {
  const plans = await buildPlans(user, now);
  if (!plans.length) {
    return [
      {
        userId: user.id,
        sent: false,
        reason: "NOTHING_DUE_FOR_ENABLED_REMINDERS",
      },
    ];
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

  const browserEnabled = user.preferences.browserEnabled;
  if (!browserEnabled && gates.length === 0) {
    return [
      {
        userId: user.id,
        sent: false,
        reason: "NO_ENABLED_CHANNEL",
      },
    ];
  }

  const results: SendResult[] = [];
  for (const plan of plans) {
    const reminderKey = `${user.id}:${plan.key}`;
    const existing = await prisma.notification.findUnique({
      where: { reminderKey },
      select: { id: true },
    });
    if (existing) {
      results.push({
        userId: user.id,
        type: plan.type,
        sent: false,
        reason: "ALREADY_SENT_FOR_DAY_AND_SLOT",
      });
      continue;
    }

    let reminder;
    try {
      reminder = await prisma.notification.create({
        data: {
          userId: user.id,
          taskId: plan.tasks[0]?.id,
          reminderKey,
          provider: "fanout",
          channel: "BROWSER",
          title: plan.title,
          message: plan.message,
          scheduledFor: now,
          status: NotificationStatus.SENT,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        results.push({
          userId: user.id,
          type: plan.type,
          sent: false,
          reason: "ALREADY_SENT_FOR_DAY_AND_SLOT",
        });
        continue;
      }
      throw error;
    }

    const channelResults: NotificationResult[] = [];
    for (const gate of gates) {
      const base: NotificationPayload = {
        userId: user.id,
        title: plan.title,
        message: plan.message,
        channel: gate.channel,
        metadata: {},
      };
      channelResults.push(
        await providerByChannel[gate.provider]().send(gate.buildPayload(base)),
      );
    }

    const channelTokens: Record<string, "EMAIL" | "SMS"> = {
      email: "EMAIL",
      sms: "SMS",
    };
    for (let index = 0; index < channelResults.length; index++) {
      const result = channelResults[index];
      const gate = gates[index];
      await prisma.notificationLog.create({
        data: {
          userId: user.id,
          notificationId: reminder.id,
          provider: result.provider,
          providerMessageId: result.providerMessageId,
          channel: gate ? channelTokens[gate.channel] : "SMS",
          status: result.success ? "SENT" : "FAILED",
          title: plan.title,
          message: plan.message,
          errorCode: result.errorCode,
          errorMessage: result.errorMessage,
          sentAt: result.success ? now : undefined,
          failedAt: result.success ? undefined : now,
        },
      });
    }

    results.push({
      userId: user.id,
      type: plan.type,
      sent: browserEnabled || channelResults.some((result) => result.success),
      browserQueued: browserEnabled,
      taskCount: plan.tasks.length,
      reminderKey,
      channels: channelResults.map((result) => ({
        provider: result.provider,
        success: result.success,
      })),
    });
  }
  return results;
}

export async function sendDueReminders(now = new Date()) {
  const users = await collectRemindableUsers(now);
  const results: Array<SendResult | { userId: string; sent: boolean; reason: string }> = [];
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
    results.push(...(await sendUserReminders(user, now)));
  }
  return results;
}

export async function previewDueReminders(now = new Date()) {
  const users = await collectRemindableUsers(now);
  return Promise.all(
    users.map(async (user) => {
      const plans = await buildPlans(user, now);
      const existingKeys = new Set(
        (
          await prisma.notification.findMany({
            where: {
              userId: user.id,
              reminderKey: { in: plans.map((plan) => `${user.id}:${plan.key}`) },
            },
            select: { reminderKey: true },
          })
        )
          .map((row) => row.reminderKey?.replace(`${user.id}:`, ""))
          .filter((key): key is string => Boolean(key)),
      );
      return {
        userId: user.id,
        timezone: user.timezone,
        slotIndex: user.slotIndex,
        channels: {
          browser: user.preferences.browserEnabled,
          email: Boolean(user.preferences.emailEnabled && user.email),
          sms: Boolean(
            user.preferences.smsEnabled && user.preferences.phoneNumber,
          ),
        },
        reminders: plans.map((plan) => ({
          type: plan.type,
          ready: !existingKeys.has(plan.key),
          reason: existingKeys.has(plan.key)
            ? "ALREADY_SENT_FOR_DAY_AND_SLOT"
            : "READY",
          taskCount: plan.tasks.length,
        })),
        preferences: {
          dailyReminderEnabled: user.preferences.dailyReminderEnabled,
          missedTaskReminderEnabled: user.preferences.missedTaskReminderEnabled,
          revisionReminderEnabled: user.preferences.revisionReminderEnabled,
          weeklySummaryEnabled: user.preferences.weeklySummaryEnabled,
          weeklySummaryDay: user.preferences.weeklySummaryDay,
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