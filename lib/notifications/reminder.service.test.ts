import { describe, expect, it } from "vitest";

import {
  DEFAULT_REMINDER_SCHEDULE,
  buildReminderMessage,
  eligibleReminderTypes,
  getLocalTime,
  getReminderSlotIndex,
  isSlotEnabled,
  localWeekday,
  normalizeSchedule,
  notificationAllowed,
  overdueTasksWhere,
  revisionTasksWhere,
  todayTasksWhere,
  weeklySummaryDue,
  buildWeeklySummaryMessage,
} from "@/lib/notifications/reminder.service";

describe("getReminderSlotIndex", () => {
  it("maps local hours to 6 slots", () => {
    expect(getReminderSlotIndex(0)).toBe(0);
    expect(getReminderSlotIndex(3)).toBe(0);
    expect(getReminderSlotIndex(4)).toBe(1);
    expect(getReminderSlotIndex(8)).toBe(2);
    expect(getReminderSlotIndex(12)).toBe(3);
    expect(getReminderSlotIndex(19)).toBe(4);
    expect(getReminderSlotIndex(22)).toBe(5);
    expect(getReminderSlotIndex(23)).toBe(5);
  });

  it("clamps out-of-range hours", () => {
    expect(getReminderSlotIndex(-5)).toBe(0);
    expect(getReminderSlotIndex(30)).toBe(5);
  });
});

describe("normalizeSchedule", () => {
  it("keeps well-formed entries", () => {
    const schedule = [
      { key: "morning", time: "08:00", enabled: true },
      { key: "midday", time: "13:00", enabled: false },
    ];
    expect(normalizeSchedule(schedule)).toEqual(schedule);
  });

  it("falls back to defaults for junk input", () => {
    expect(normalizeSchedule(null)).toEqual(DEFAULT_REMINDER_SCHEDULE);
    expect(normalizeSchedule("08:00")).toEqual(DEFAULT_REMINDER_SCHEDULE);
    expect(normalizeSchedule([])).toEqual(DEFAULT_REMINDER_SCHEDULE);
    expect(normalizeSchedule([{ nope: true }])).toEqual(DEFAULT_REMINDER_SCHEDULE);
  });

  it("drops malformed entries but keeps valid ones", () => {
    const schedule = normalizeSchedule([
      { key: "morning", time: "08:00", enabled: true },
      { key: "broken" },
      "nope",
      null,
    ]);
    expect(schedule).toEqual([{ key: "morning", time: "08:00", enabled: true }]);
  });
});

describe("isSlotEnabled", () => {
  it("is enabled for every slot when the daily digest is on", () => {
    for (let slot = 0; slot < 6; slot++) {
      expect(isSlotEnabled([], slot, true)).toBe(true);
    }
  });

  it("is enabled only for slots with an enabled schedule entry", () => {
    const schedule = [
      { key: "morning", time: "08:00", enabled: true }, // slot 2
      { key: "evening", time: "19:00", enabled: true }, // slot 4
    ];
    expect(isSlotEnabled(schedule, 2, false)).toBe(true);
    expect(isSlotEnabled(schedule, 4, false)).toBe(true);
    expect(isSlotEnabled(schedule, 0, false)).toBe(false);
    expect(isSlotEnabled(schedule, 3, false)).toBe(false);
  });

  it("ignores disabled entries", () => {
    const schedule = [
      { key: "morning", time: "08:00", enabled: false },
    ];
    expect(isSlotEnabled(schedule, 2, false)).toBe(false);
  });
});

describe("notificationAllowed", () => {
  const required = {
    userActive: true,
    reminderTypeEnabled: true,
    channelEnabled: true,
    hasContact: true,
    alreadySent: false,
    withinQuietHours: false,
    throttled: false,
  };

  it("allows when every gate passes", () => {
    expect(notificationAllowed(required).allowed).toBe(true);
  });

  it("blocks when any safety gate fails", () => {
    expect(notificationAllowed({ ...required, userActive: false })).toEqual({
      allowed: false,
      reason: "USER_INACTIVE",
    });
    expect(
      notificationAllowed({ ...required, reminderTypeEnabled: false }),
    ).toEqual({ allowed: false, reason: "REMINDER_TYPE_DISABLED" });
    expect(notificationAllowed({ ...required, channelEnabled: false })).toEqual({
      allowed: false,
      reason: "CHANNEL_DISABLED",
    });
    expect(notificationAllowed({ ...required, hasContact: false })).toEqual({
      allowed: false,
      reason: "NO_CONTACT",
    });
    expect(notificationAllowed({ ...required, withinQuietHours: true })).toEqual({
      allowed: false,
      reason: "QUIET_HOURS",
    });
    expect(notificationAllowed({ ...required, throttled: true })).toEqual({
      allowed: false,
      reason: "THROTTLED",
    });
    expect(notificationAllowed({ ...required, alreadySent: true })).toEqual({
      allowed: false,
      reason: "ALREADY_SENT",
    });
  });
});

describe("eligibleReminderTypes", () => {
  it("only returns opt-in types in a stable order", () => {
    expect(
      eligibleReminderTypes({
        dailyReminderEnabled: true,
        missedTaskReminderEnabled: false,
        revisionReminderEnabled: true,
      }),
    ).toEqual(["daily", "revisionReview"]);
    expect(
      eligibleReminderTypes({
        dailyReminderEnabled: false,
        missedTaskReminderEnabled: true,
        revisionReminderEnabled: true,
      }),
    ).toEqual(["missedTasks", "revisionReview"]);
    expect(
      eligibleReminderTypes({
        dailyReminderEnabled: false,
        missedTaskReminderEnabled: false,
        revisionReminderEnabled: false,
      }),
    ).toEqual([]);
  });
});

describe("weekly summary", () => {
  // 2026-09-20 is a Sunday.
  const sunday = { year: 2026, month: 9, day: 20, hour: 9, minute: 0 };
  const monday = { year: 2026, month: 9, day: 21, hour: 9, minute: 0 };

  it("localWeekday reflects the user's local calendar day", () => {
    expect(localWeekday(sunday)).toBe(0);
    expect(localWeekday(monday)).toBe(1);
  });

  it("weeklySummaryDue only fires on the chosen weekday", () => {
    expect(weeklySummaryDue(sunday, 0)).toBe(true);
    expect(weeklySummaryDue(sunday, 1)).toBe(false);
    expect(weeklySummaryDue(monday, 1)).toBe(true);
  });

  it("buildWeeklySummaryMessage reports counts and highlights", () => {
    const { title, message } = buildWeeklySummaryMessage({
      completedCount: 3,
      focusMinutes: 240,
      completedTasks: [{ title: "Two Sum" }, { title: "LRU Cache" }],
    });
    expect(title).toMatch(/weekly summary/i);
    expect(message).toContain("3 tasks");
    expect(message).toContain("240 min");
    expect(message).toContain("1. Two Sum");
    expect(message).toContain("2. LRU Cache");
  });

  it("buildWeeklySummaryMessage handles a focus-only week", () => {
    const { message } = buildWeeklySummaryMessage({
      completedCount: 0,
      focusMinutes: 45,
      completedTasks: [],
    });
    expect(message).toContain("0 tasks");
    expect(message).toContain("45 min");
    expect(message).not.toContain("Highlights:");
  });
});

describe("task-day filters (local-midnight boundaries)", () => {
  const local = { year: 2026, month: 9, day: 20, hour: 9, minute: 0 };
  const start = new Date(Date.UTC(2026, 8, 20)); // Sep 20 00:00 UTC

  it("todayTasksWhere scopes to the local day", () => {
    const where = todayTasksWhere(local);
    const due = where.dueDate as { gte: Date; lt: Date };
    expect(due.gte).toEqual(start);
    expect(due.lt).toEqual(new Date(start.getTime() + 86400000));
  });

  it("overdueTasksWhere means before the local day, open only", () => {
    const where = overdueTasksWhere(local);
    const due = where.dueDate as { lt: Date };
    expect(due.lt).toEqual(start);
    expect(where.status).toEqual({ notIn: ["COMPLETED", "SKIPPED"] });
  });

  it("revisionTasksWhere targets revision items due within the local day", () => {
    const where = revisionTasksWhere(local);
    const due = where.dueDate as { gte: Date; lt: Date };
    expect(where.taskType).toBe("revision");
    expect(due.gte).toEqual(start);
    expect(due.lt).toEqual(new Date(start.getTime() + 86400000));
  });
});

describe("buildReminderMessage", () => {
  const tasks = [
    { title: "Revise arrays" },
    { title: "Revise graphs" },
  ];

  it("builds a daily digest listing the day's tasks", () => {
    const { title, message } = buildReminderMessage("daily", tasks);
    expect(title).toContain("reminder");
    expect(message).toContain("1. Revise arrays");
    expect(message).toContain("2. Revise graphs");
  });

  it("flags overdue count for missed-task reminders", () => {
    const { title, message } = buildReminderMessage("missedTasks", tasks);
    expect(title).toContain("Missed tasks");
    expect(message).toContain("2 overdue tasks");
  });

  it("singularizes counts and pins revision items for revision review", () => {
    const one = buildReminderMessage("revisionReview", [{ title: "Revise SQL" }]);
    expect(one.title).toContain("Revision is due today");
    expect(one.message).toContain("1 revision item");
    const many = buildReminderMessage("revisionReview", tasks);
    expect(many.message).toContain("2 revision items");
    expect(many.message).toContain("Revise arrays");
  });
});

describe("getLocalTime", () => {
  it("reads the wall clock in the user's timezone", () => {
    const utc = new Date("2026-09-20T12:30:00Z");
    const local = getLocalTime(utc, "UTC");
    expect(local.hour).toBe(12);
    expect(local.minute).toBe(30);
    expect(local.year).toBe(2026);
    expect(local.month).toBe(9);
    expect(local.day).toBe(20);
  });

  it("shifts to a non-UTC timezone", () => {
    const utc = new Date("2026-09-20T00:30:00Z");
    const kolkata = getLocalTime(utc, "Asia/Kolkata");
    expect(kolkata.hour).toBe(6); // UTC+5:30
  });
});