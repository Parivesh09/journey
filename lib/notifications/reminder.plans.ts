import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  DEFAULT_REMINDER_SCHEDULE,
  eligibleReminderTypes,
  getLocalTime,
  getReminderSlotIndex,
  isSlotEnabled,
  localDayStart,
  normalizeSchedule,
  weeklySummaryDue,
} from "./reminder.schedule";
import type {
  DailyReminderType,
  LocalTime,
  ReminderType,
} from "./reminder.schedule";
import {
  buildReminderMessage,
  buildWeeklySummaryMessage,
  dailyDigestTasksWhere,
  overdueTasksWhere,
  revisionTasksWhere,
} from "./reminder.tasks";

export type ReminderPreferences = {
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

export type RemindableUser = {
  id: string;
  email: string;
  timezone: string;
  preferences: ReminderPreferences;
  local: LocalTime;
  slotIndex: number;
};

export function dateKeyOf(local: LocalTime) {
  return `${local.year}-${String(local.month).padStart(2, "0")}-${String(local.day).padStart(2, "0")}`;
}

export function inLocalQuietHours(
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

export async function collectRemindableUsers(now: Date): Promise<RemindableUser[]> {
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

export async function loadTasksFor(userId: string, where: Prisma.TaskWhereInput) {
  return prisma.task.findMany({
    where: { userId, ...where },
    orderBy: { sequenceOrder: "asc" },
    take: 50,
  });
}

export type ReminderPlan = {
  type: ReminderType;
  key: string;
  tasks: Array<{ id: string; title: string }>;
  title: string;
  message: string;
};

/** All reminder messages a user is opted into that have something to say today. */
export async function buildPlans(user: RemindableUser): Promise<ReminderPlan[]> {
  const whereFor: Record<DailyReminderType, Prisma.TaskWhereInput> = {
    daily: dailyDigestTasksWhere(
      user.id,
      user.local,
      user.preferences.excludeCompletedTasks,
    ),
    missedTasks: overdueTasksWhere(user.local),
    revisionReview: revisionTasksWhere(user.local),
  };

  const plans: ReminderPlan[] = [];
  for (const type of eligibleReminderTypes(user.preferences)) {
    const tasks = await loadTasksFor(user.id, whereFor[type]);
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
export async function buildWeeklySummaryPlan(
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
