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
