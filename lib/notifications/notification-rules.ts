export type NotificationReminderType =
  "daily" | "missed-task" | "revision" | "weekly";

export type NotificationThresholds = {
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  maxDailyNotifications: number;
  minNotificationInterval: number;
};

export function isWithinQuietHours(
  currentTime: Date,
  thresholds: NotificationThresholds,
): boolean {
  if (!thresholds.quietHoursEnabled) {
    return false;
  }

  const minutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const [startHour, startMinute] = thresholds.quietHoursStart
    .split(":")
    .map(Number);
  const [endHour, endMinute] = thresholds.quietHoursEnd.split(":").map(Number);

  const quietStart = startHour * 60 + startMinute;
  const quietEnd = endHour * 60 + endMinute;

  if (quietStart < quietEnd) {
    return minutes >= quietStart && minutes < quietEnd;
  }

  return minutes >= quietStart || minutes < quietEnd;
}

export function shouldThrottleNotification(
  reminderCountToday: number,
  lastNotificationAt: Date | null,
  now: Date,
  thresholds: NotificationThresholds,
): boolean {
  if (reminderCountToday >= thresholds.maxDailyNotifications) {
    return true;
  }

  if (!lastNotificationAt) {
    return false;
  }

  const elapsedMinutes = (now.getTime() - lastNotificationAt.getTime()) / 60000;
  return elapsedMinutes < thresholds.minNotificationInterval;
}

export function getRevisionSchedule(days: number): number[] {
  return [1, 3, 7, 14, 30].map((step) => days + step);
}
