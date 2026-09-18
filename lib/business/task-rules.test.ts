import { describe, expect, it } from "vitest";
import { completeTask, getRevisionWindow, skipTask } from "./task-rules";
import {
  isWithinQuietHours,
  shouldThrottleNotification,
} from "@/lib/notifications/notification-rules";

describe("task completion business logic", () => {
  it("marks a task as completed and stamps the completion time", () => {
    const task: {
      id: string;
      title: string;
      status: "TODO";
      priority: "HIGH";
    } = {
      id: "1",
      title: "Two Sum",
      status: "TODO",
      priority: "HIGH",
    };
    const result = completeTask(task);

    expect(result.status).toBe("COMPLETED");
    expect(result.completedAt).toBeInstanceOf(Date);
  });

  it("marks a task as skipped without blowing away its status unexpectedly", () => {
    const task: {
      id: string;
      title: string;
      status: "IN_PROGRESS";
      priority: "MEDIUM";
    } = {
      id: "2",
      title: "Skip Me",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
    };
    const result = skipTask(task);

    expect(result.status).toBe("SKIPPED");
  });

  it("creates a layered revision schedule based on the review day", () => {
    expect(getRevisionWindow(1)).toEqual([2, 4, 8, 15, 31]);
  });
});

describe("notification throttling logic", () => {
  it("prevents notifications during quiet hours", () => {
    const now = new Date("2026-09-18T23:30:00Z");

    expect(
      isWithinQuietHours(now, {
        quietHoursEnabled: true,
        quietHoursStart: "22:00",
        quietHoursEnd: "07:00",
        maxDailyNotifications: 5,
        minNotificationInterval: 30,
      }),
    ).toBe(true);
  });

  it("throttles based on max notifications per day and minimum interval", () => {
    const now = new Date("2026-09-18T12:00:00Z");
    const last = new Date("2026-09-18T11:20:00Z");

    expect(
      shouldThrottleNotification(5, last, now, {
        quietHoursEnabled: false,
        quietHoursStart: "22:00",
        quietHoursEnd: "07:00",
        maxDailyNotifications: 5,
        minNotificationInterval: 30,
      }),
    ).toBe(true);

    expect(
      shouldThrottleNotification(2, last, now, {
        quietHoursEnabled: false,
        quietHoursStart: "22:00",
        quietHoursEnd: "07:00",
        maxDailyNotifications: 5,
        minNotificationInterval: 30,
      }),
    ).toBe(false);
  });
});
