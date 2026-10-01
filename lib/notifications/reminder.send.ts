import { NotificationStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type {
  NotificationPayload,
  NotificationResult,
} from "./notification.types";
import { EmailNotificationProvider } from "./providers/email/email.provider";
import { LinqNotificationProvider } from "./providers/linq/linq.provider";
import {
  buildPlans,
  collectRemindableUsers,
  dateKeyOf,
  inLocalQuietHours,
} from "./reminder.plans";
import type { RemindableUser } from "./reminder.plans";
import type { ReminderType } from "./reminder.schedule";
import { notificationAllowed } from "./reminder.tasks";

export type ChannelGate = {
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

export type SendResult = {
  userId: string;
  type?: ReminderType;
  sent: boolean;
  reason?: string;
  browserQueued?: boolean;
  taskCount?: number;
  reminderKey?: string;
  channels?: Array<{ provider: string; success: boolean }>;
};

export async function sendUserReminders(user: RemindableUser, now: Date): Promise<SendResult[]> {
  const plans = await buildPlans(user);
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
      const plans = await buildPlans(user);
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
