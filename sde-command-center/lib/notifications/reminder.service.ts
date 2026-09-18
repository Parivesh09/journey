import { NotificationStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { ensureDailyTasks } from "@/lib/business/daily-plan";
import { EmailNotificationProvider } from "./providers/email/email.provider";
import { LinqNotificationProvider } from "./providers/linq/linq.provider";
import type {
  NotificationPayload,
  NotificationResult,
} from "./notification.types";

const reminderIntervalHours = 4;
const indiaTimeZone = "Asia/Kolkata";

function getIndiaTime(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: indiaTimeZone,
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
  return values as {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
  };
}

function isReminderWindow(now: Date) {
  const india = getIndiaTime(now);
  const withinHours = india.hour >= 8 || india.hour < 2;
  const scheduledHour = [0, 8, 12, 16, 20].includes(india.hour);
  return withinHours && scheduledHour && india.minute <= 15;
}

function startOfToday(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function getReminderSlot(now: Date) {
  const india = getIndiaTime(now);
  const slot =
    india.hour === 0 ? 4 : Math.floor((india.hour - 8) / reminderIntervalHours);
  return `${india.year}-${String(india.month).padStart(2, "0")}-${String(india.day).padStart(2, "0")}:${slot}`;
}

export async function sendNextTaskReminder(now = new Date()) {
  if (!isReminderWindow(now)) {
    return { sent: false, reason: "OUTSIDE_IST_REMINDER_WINDOW" };
  }

  const user = await prisma.user.findUnique({
    where: { email: "user@sdecommand.center" },
    include: { notificationPreferences: true },
  });

  if (!user) {
    return { sent: false, reason: "USER_NOT_FOUND" };
  }

  await ensureDailyTasks(user.id, now);

  const preferences =
    user.notificationPreferences ??
    (await prisma.notificationPreference.create({
      data: {
        userId: user.id,
        browserEnabled: true,
        emailEnabled: true,
        linqEnabled: true,
        minNotificationInterval: 240,
        maxDailyNotifications: 8,
      },
    }));

  const dayStart = startOfToday(now);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  const task = await prisma.task.findFirst({
    where: {
      userId: user.id,
      status: { notIn: ["COMPLETED", "SKIPPED"] },
      dueDate: { gte: dayStart, lt: dayEnd },
    },
    orderBy: { sequenceOrder: "asc" },
  });

  if (!task) {
    return { sent: false, reason: "NO_INCOMPLETE_TASK_FOR_TODAY" };
  }

  const reminderKey = `${user.id}:${task.id}:${getReminderSlot(now)}`;
  const title = "SDE Command Center reminder";
  const message = `Next task: ${task.title}. Complete this task before moving to the next one.`;
  let reminder;

  try {
    reminder = await prisma.notification.create({
      data: {
        userId: user.id,
        taskId: task.id,
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
      return {
        sent: false,
        reason: "ALREADY_SENT_FOR_TASK_AND_SLOT",
        taskId: task.id,
      };
    }
    throw error;
  }

  const payload: NotificationPayload = {
    userId: user.id,
    title,
    message,
    channel: "email",
    metadata: {
      email: process.env.REMINDER_EMAIL ?? "rimjha.parivesh2002@gmail.com",
      taskId: task.id,
      reminderKey,
    },
  };
  const results: NotificationResult[] = [];

  if (preferences.emailEnabled) {
    results.push(await new EmailNotificationProvider().send(payload));
  }

  if (preferences.linqEnabled) {
    results.push(
      await new LinqNotificationProvider().send({
        ...payload,
        channel: "linq",
      }),
    );
  }

  for (const result of results) {
    await prisma.notificationLog.create({
      data: {
        userId: user.id,
        notificationId: reminder.id,
        provider: result.provider,
        providerMessageId: result.providerMessageId,
        channel: result.provider === "linq" ? "LINQ" : "EMAIL",
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
    sent: true,
    taskId: task.id,
    taskTitle: task.title,
    channels: results.map((result) => ({
      provider: result.provider,
      success: result.success,
    })),
  };
}

export async function previewNextTaskReminder(now = new Date()) {
  if (!isReminderWindow(now)) {
    return { ready: false, reason: "OUTSIDE_IST_REMINDER_WINDOW" };
  }

  const user = await prisma.user.findUnique({
    where: { email: "user@sdecommand.center" },
    include: { notificationPreferences: true },
  });

  if (!user) {
    return { ready: false, reason: "USER_NOT_FOUND" };
  }

  const dayStart = startOfToday(now);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  const task = await prisma.task.findFirst({
    where: {
      userId: user.id,
      status: { notIn: ["COMPLETED", "SKIPPED"] },
      dueDate: { gte: dayStart, lt: dayEnd },
    },
    orderBy: { sequenceOrder: "asc" },
  });

  if (!task) {
    return { ready: false, reason: "NO_INCOMPLETE_TASK_FOR_TODAY" };
  }

  const preferences = user.notificationPreferences;
  const reminderKey = `${user.id}:${task.id}:${getReminderSlot(now)}`;
  const existingReminder = await prisma.notification.findUnique({
    where: { reminderKey },
    select: { id: true, status: true },
  });

  return {
    ready: !existingReminder,
    reason: existingReminder ? "ALREADY_SENT_FOR_TASK_AND_SLOT" : "READY",
    task: { id: task.id, title: task.title, dueDate: task.dueDate },
    reminderKey,
    channels: {
      browser: Boolean(preferences?.browserEnabled),
      email: Boolean(preferences?.emailEnabled && process.env.SMTP_HOST),
      linq: Boolean(
        preferences?.linqEnabled &&
        process.env.LINQ_ENABLED === "true" &&
        process.env.LINQ_API_KEY &&
        process.env.LINQ_TO,
      ),
    },
    configuration: {
      smtpConfigured: Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM),
      linqConfigured: Boolean(
        process.env.LINQ_ENABLED === "true" &&
        process.env.LINQ_API_KEY &&
        process.env.LINQ_TO,
      ),
      browserRequiresOpenTab: true,
    },
  };
}

export async function getPendingBrowserReminders() {
  const user = await prisma.user.findUnique({
    where: { email: "user@sdecommand.center" },
  });

  if (!user) return [];

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
