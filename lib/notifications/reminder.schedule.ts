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
export function localDayStart(local: LocalTime) {
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
