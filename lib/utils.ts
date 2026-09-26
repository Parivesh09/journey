export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function extractErrorMessage(reason: unknown): string {
  if (reason && typeof reason === "object" && "data" in reason) {
    const data = (reason as { data?: { error?: string } }).data;
    if (data && typeof data.error === "string") {
      return data.error;
    }
  }
  return "";
}

export function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
}

export function toPercent(part: number, total: number): number {
  if (total === 0) {
    return 0;
  }

  return Math.min(100, Math.round((part / total) * 100));
}

/* Calendar date utilities */
export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

export function startOfWeek(date: Date, weekStartsOn: 0 | 1 = 1): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = (day + (7 - weekStartsOn)) % 7;
  result.setDate(result.getDate() - diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function endOfWeek(date: Date, weekStartsOn: 0 | 1 = 1): Date {
  const result = startOfWeek(date, weekStartsOn);
  result.setDate(result.getDate() + 6);
  result.setHours(23, 59, 59, 999);
  return result;
}

export function startOfMonth(date: Date): Date {
  const result = new Date(date);
  result.setDate(1);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function endOfMonth(date: Date): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + 1);
  result.setDate(0);
  result.setHours(23, 59, 59, 999);
  return result;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addWeeks(date: Date, weeks: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + weeks * 7);
  return result;
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function isBeforeDay(a: Date, b: Date): boolean {
  const aStart = startOfDay(a);
  const bStart = startOfDay(b);
  return aStart < bStart;
}

export function isAfterDay(a: Date, b: Date): boolean {
  const aStart = startOfDay(a);
  const bStart = startOfDay(b);
  return aStart > bStart;
}

export function formatDay(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function formatWeekRange(start: Date, end: Date): string {
  const sameMonth = start.getMonth() === end.getMonth();
  if (sameMonth) {
    return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { day: "numeric", year: "numeric" })}`;
  }
  return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

export function getDaysInMonth(date: Date): Date[] {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const days: Date[] = [];
  let current = startOfWeek(start);
  while (current <= endOfWeek(end)) {
    days.push(new Date(current));
    current = addDays(current, 1);
  }
  return days;
}

export function getWeekDays(date: Date, weekStartsOn: 0 | 1 = 1): Date[] {
  const start = startOfWeek(date, weekStartsOn);
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(addDays(start, i));
  }
  return days;
}

export function getTimeSlots(date: Date, slotMinutes = 30): Date[] {
  const slots: Date[] = [];
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  for (let i = 0; i < 24 * 60; i += slotMinutes) {
    slots.push(new Date(start.getTime() + i * 60000));
  }
  return slots;
}

export function formatTime(date: Date, timeZone?: string): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone,
  });
}

export function formatTime24(date: Date, timeZone?: string): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  });
}
