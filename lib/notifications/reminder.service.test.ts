import { describe, expect, it } from "vitest";

import {
  DEFAULT_REMINDER_SCHEDULE,
  getLocalTime,
  getReminderSlotIndex,
  isSlotEnabled,
  normalizeSchedule,
  notificationAllowed,
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