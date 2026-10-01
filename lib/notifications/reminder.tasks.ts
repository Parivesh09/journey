import { Prisma } from "@prisma/client";

import { localDayStart } from "./reminder.schedule";
import type { LocalTime, ReminderType } from "./reminder.schedule";

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

/** Personal daily routines plus roadmap tasks explicitly pinned to the day. */
export function dailyDigestTasksWhere(
  userId: string,
  local: LocalTime,
  excludeCompleted: boolean,
): Prisma.TaskWhereInput {
  const start = localDayStart(local);
  return {
    OR: [{ isPersonalDaily: true }, { dailyPins: { some: { userId } } }],
    ...(excludeCompleted
      ? {
          status: { notIn: ["COMPLETED", "SKIPPED"] },
          completions: {
            none: {
              completedAt: { gte: start, lt: new Date(start.getTime() + 86400000) },
            },
          },
        }
      : {}),
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
