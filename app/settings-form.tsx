"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";

type NotificationSettings = {
  browserEnabled: boolean;
  emailEnabled: boolean;
  telegramEnabled: boolean;
  linqEnabled: boolean;
  smsEnabled: boolean;
  whatsappEnabled: boolean;
  phoneNumber: string | null;
  reminderSchedule: Array<{ key: string; time: string; enabled: boolean }>;
  excludeCompletedTasks: boolean;
  dailyReminderEnabled: boolean;
  missedTaskReminderEnabled: boolean;
  revisionReminderEnabled: boolean;
  weeklySummaryEnabled: boolean;
  weeklySummaryDay: number;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  maxDailyNotifications: number;
  minNotificationInterval: number;
  preferredChannel: string;
};

const defaultSchedule = [
  { key: "morning", time: "08:00", enabled: false },
  { key: "midday", time: "13:00", enabled: false },
  { key: "evening", time: "19:00", enabled: false },
  { key: "final", time: "22:00", enabled: false },
  { key: "nextDay", time: "08:00", enabled: false },
];

const defaultNotifications: NotificationSettings = {
  browserEnabled: false,
  emailEnabled: false,
  telegramEnabled: false,
  linqEnabled: false,
  smsEnabled: false,
  whatsappEnabled: false,
  phoneNumber: null,
  reminderSchedule: defaultSchedule,
  excludeCompletedTasks: true,
  dailyReminderEnabled: false,
  missedTaskReminderEnabled: false,
  revisionReminderEnabled: false,
  weeklySummaryEnabled: false,
  weeklySummaryDay: 0,
  quietHoursEnabled: true,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
  maxDailyNotifications: 5,
  minNotificationInterval: 30,
  preferredChannel: "BROWSER",
};

type UserSettings = {
  id: string;
  name: string | null;
  email: string;
  timezone: string;
  dailyStudyTargetMinutes: number;
  theme: string;
};

const timezones = (() => {
  try {
    return Intl.supportedValuesOf("timeZone") as string[];
  } catch {
    return [];
  }
})();

export default function SettingsForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState<UserSettings | null>(null);
  const [notifications, setNotifications] = useState<NotificationSettings>(
    defaultNotifications,
  );
  const [password, setPassword] = useState({ current: "", next: "" });

  const load = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/settings", { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load settings");
      const data = (await response.json()) as {
        user: UserSettings;
        notifications: (Partial<NotificationSettings> & {
          reminderSchedule?: unknown;
        }) | null;
      };
      setUser(data.user);
      if (data.notifications) {
        const raw = data.notifications as NotificationSettings;
        setNotifications({
          ...defaultNotifications,
          ...raw,
          phoneNumber: raw.phoneNumber ?? null,
          reminderSchedule: Array.isArray(raw.reminderSchedule)
            ? (raw.reminderSchedule as NotificationSettings["reminderSchedule"])
            : defaultSchedule,
        });
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load settings");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/settings", { cache: "no-store" });
        if (!response.ok) throw new Error("Unable to load settings");
        const data = (await response.json()) as {
          user: UserSettings;
          notifications: (Partial<NotificationSettings> & {
            reminderSchedule?: unknown;
          }) | null;
        };
        if (cancelled) return;
        setUser(data.user);
        if (data.notifications) {
          const raw = data.notifications as NotificationSettings;
          setNotifications({
            ...defaultNotifications,
            ...raw,
            phoneNumber: raw.phoneNumber ?? null,
            reminderSchedule: Array.isArray(raw.reminderSchedule)
              ? (raw.reminderSchedule as NotificationSettings["reminderSchedule"])
              : defaultSchedule,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load settings",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function saveSettings(endpoint: string, body: unknown) {
    const response = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return response;
  }

  async function saveAccount(event?: FormEvent) {
    event?.preventDefault();
    if (!user) return;
    setSaving("account");
    setMessage("");
    setError("");
    const response = await saveSettings("/api/settings", {
      name: user.name,
      email: user.email,
      timezone: user.timezone,
      dailyStudyTargetMinutes: user.dailyStudyTargetMinutes,
      theme: user.theme,
      ...(password.next
        ? { currentPassword: password.current, newPassword: password.next }
        : {}),
    });
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Unable to save account settings.");
      setSaving("");
      return;
    }
    setPassword({ current: "", next: "" });
    setMessage("Account settings saved.");
    setSaving("");
    await load();
  }

  async function saveNotifications() {
    setSaving("notifications");
    setMessage("");
    setError("");
    const response = await fetch("/api/settings/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(notifications),
    });
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Unable to save notification settings.");
      setSaving("");
      return;
    }
    setMessage("Notification settings saved.");
    setSaving("");
  }

  function updateNotification<K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K],
  ) {
    setNotifications((current) => ({ ...current, [key]: value }));
  }

  function updateSchedule(index: number, patch: Partial<{ time: string; enabled: boolean }>) {
    setNotifications((current) => ({
      ...current,
      reminderSchedule: current.reminderSchedule.map((entry, i) =>
        i === index ? { ...entry, ...patch } : entry,
      ),
    }));
  }

  const scheduleLabel = useMemo(
    () => ({
      morning: "Morning Reminder",
      midday: "Midday Reminder",
      evening: "Evening Reminder",
      final: "Final Reminder",
      nextDay: "Next-Day Summary",
    }) as Record<string, string>,
    [],
  );

  if (loading) {
    return (
      <div className="mx-auto flex max-w-3xl items-center gap-3 py-16 text-slate-400">
        <LoaderCircle className="h-5 w-5 animate-spin" /> Loading settings...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/" className="text-sm text-slate-400 hover:text-white">
        Back to dashboard
      </Link>
      <h1 className="mt-8 text-3xl font-semibold">Settings</h1>
      <p className="mt-2 text-slate-400">
        Account details, notification channels, and reminder preferences for
        your workspace.
      </p>

      {message ? (
        <p className="mt-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-6 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      <form onSubmit={saveAccount} className="mt-8 space-y-6">
        <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-300">
            Account
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-slate-300">
              Name
              <input
                value={user?.name ?? ""}
                onChange={(event) =>
                  user &&
                  setUser({ ...user, name: event.target.value })
                }
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5"
              />
            </label>
            <label className="block text-sm text-slate-300">
              Email
              <input
                type="email"
                value={user?.email ?? ""}
                onChange={(event) =>
                  user && setUser({ ...user, email: event.target.value })
                }
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5"
              />
            </label>
          </div>
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <p className="text-sm text-slate-300">Change password</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <input
                type="password"
                placeholder="Current password"
                value={password.current}
                onChange={(event) =>
                  setPassword((current) => ({ ...current, current: event.target.value }))
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm"
              />
              <input
                type="password"
                placeholder="New password (min 8 chars)"
                minLength={8}
                value={password.next}
                onChange={(event) =>
                  setPassword((current) => ({ ...current, next: event.target.value }))
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm"
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Leave both fields empty to keep your current password.
            </p>
          </div>
          <button
            type="submit"
            disabled={saving === "account"}
            className="mt-5 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
          >
            {saving === "account" ? "Saving..." : "Save account"}
          </button>
        </section>
      </form>

      <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-300">
          Notifications
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Every channel is off by default. Reminders are only sent for channels
          you explicitly enable below.
        </p>
        <div className="mt-5 space-y-4">
          {(
            [
              ["browserEnabled", "Browser notifications"],
              ["emailEnabled", "Email reminders"],
              ["smsEnabled", "SMS reminders"],
              ["whatsappEnabled", "WhatsApp reminders"],
              ["telegramEnabled", "Telegram reminders"],
            ] as const
          ).map(([key, label]) => (
            <label
              key={key}
              className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3"
            >
              <span className="text-sm text-slate-200">{label}</span>
              <input
                type="checkbox"
                checked={notifications[key]}
                onChange={(event) => updateNotification(key, event.target.checked)}
                className="h-5 w-5 accent-cyan-400"
              />
            </label>
          ))}
        </div>

        {(notifications.smsEnabled || notifications.whatsappEnabled) ? (
          <label className="mt-5 block text-sm text-slate-300">
            Phone number (for SMS / WhatsApp)
            <input
              type="tel"
              value={notifications.phoneNumber ?? ""}
              onChange={(event) =>
                updateNotification("phoneNumber", event.target.value)
              }
              placeholder="+91 XXXXX XXXXX"
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5"
            />
            <span className="mt-1 block text-xs text-slate-500">
              Use an international format like +91XXXXXXXXXX. Nothing is sent
              unless the matching channel is enabled.
            </span>
          </label>
        ) : null}
        <button
          type="button"
          onClick={() => void saveNotifications()}
          disabled={saving === "notifications"}
          className="mt-5 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
        >
          {saving === "notifications" ? "Saving..." : "Save notifications"}
        </button>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-300">
          Reminder Schedule
        </h2>
        <label className="mt-5 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3">
          <span className="text-sm text-slate-200">
            Daily task reminder (master switch)
          </span>
          <input
            type="checkbox"
            checked={notifications.dailyReminderEnabled}
            onChange={(event) =>
              updateNotification("dailyReminderEnabled", event.target.checked)
            }
            className="h-5 w-5 accent-cyan-400"
          />
        </label>
        <p className="mt-3 text-xs text-slate-500">
          With the master switch off, enable individual reminders below.
        </p>
        <div className="mt-3 space-y-3">
          <label className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3">
            <span className="text-sm text-slate-200">
              Missed-task reminder (overdue tasks)
            </span>
            <input
              type="checkbox"
              checked={notifications.missedTaskReminderEnabled}
              onChange={(event) =>
                updateNotification(
                  "missedTaskReminderEnabled",
                  event.target.checked,
                )
              }
              className="h-5 w-5 accent-cyan-400"
            />
          </label>
          <label className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3">
            <span className="text-sm text-slate-200">
              Revision review (revision items due today)
            </span>
            <input
              type="checkbox"
              checked={notifications.revisionReminderEnabled}
              onChange={(event) =>
                updateNotification(
                  "revisionReminderEnabled",
                  event.target.checked,
                )
              }
              className="h-5 w-5 accent-cyan-400"
            />
          </label>
          <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3">
            <span className="text-sm text-slate-200">
              Weekly summary (past 7 days)
            </span>
            <span className="flex items-center gap-3">
              <select
                value={notifications.weeklySummaryDay}
                onChange={(event) =>
                  updateNotification(
                    "weeklySummaryDay",
                    Number(event.target.value),
                  )
                }
                disabled={!notifications.weeklySummaryEnabled}
                className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm disabled:opacity-50"
              >
                {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(
                  (day, index) => (
                    <option key={day} value={index}>
                      {day}
                    </option>
                  ),
                )}
              </select>
              <input
                type="checkbox"
                checked={notifications.weeklySummaryEnabled}
                onChange={(event) =>
                  updateNotification(
                    "weeklySummaryEnabled",
                    event.target.checked,
                  )
                }
                className="h-5 w-5 accent-cyan-400"
              />
            </span>
          </label>
        </div>
        <div className="mt-3 space-y-3">
          {notifications.reminderSchedule.map((entry, index) => (
            <div
              key={entry.key}
              className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3"
            >
              <span className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={entry.enabled}
                  onChange={(event) =>
                    updateSchedule(index, { enabled: event.target.checked })
                  }
                  className="h-5 w-5 accent-cyan-400"
                />
                <span className="text-sm text-slate-200">
                  {scheduleLabel[entry.key] ?? entry.key}
                </span>
              </span>
              <input
                type="time"
                value={entry.time}
                onChange={(event) =>
                  updateSchedule(index, { time: event.target.value })
                }
                className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm"
              />
            </div>
          ))}
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="flex items-center gap-3 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={notifications.excludeCompletedTasks}
              onChange={(event) =>
                updateNotification("excludeCompletedTasks", event.target.checked)
              }
              className="h-5 w-5 accent-cyan-400"
            />
            Exclude completed tasks
          </label>
          <label className="block text-sm text-slate-300">
            Max reminders per day
            <input
              type="number"
              min={1}
              max={20}
              value={notifications.maxDailyNotifications}
              onChange={(event) =>
                updateNotification(
                  "maxDailyNotifications",
                  Math.max(1, Math.min(20, Number(event.target.value) || 1)),
                )
              }
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5"
            />
          </label>
          <label className="block text-sm text-slate-300">
            Quiet hours start (HH:MM)
            <input
              type="time"
              value={notifications.quietHoursStart}
              onChange={(event) =>
                updateNotification("quietHoursStart", event.target.value)
              }
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5"
            />
          </label>
          <label className="block text-sm text-slate-300">
            Quiet hours end (HH:MM)
            <input
              type="time"
              value={notifications.quietHoursEnd}
              onChange={(event) =>
                updateNotification("quietHoursEnd", event.target.value)
              }
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5"
            />
          </label>
        </div>
        <button
          type="button"
          onClick={() => void saveNotifications()}
          disabled={saving === "notifications"}
          className="mt-5 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
        >
          {saving === "notifications" ? "Saving..." : "Save schedule"}
        </button>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-300">
          Preferences
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm text-slate-300">
            Timezone
            <select
              value={user?.timezone ?? "UTC"}
              onChange={(event) =>
                user && setUser({ ...user, timezone: event.target.value })
              }
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5"
            >
              {timezones.length
                ? timezones.map((zone) => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ))
                : null}
            </select>
          </label>
          <label className="block text-sm text-slate-300">
            Daily study target (minutes)
            <input
              type="number"
              min={15}
              max={720}
              value={user?.dailyStudyTargetMinutes ?? 240}
              onChange={(event) =>
                user &&
                setUser({
                  ...user,
                  dailyStudyTargetMinutes:
                    Math.max(15, Math.min(720, Number(event.target.value) || 240)),
                })
              }
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5"
            />
          </label>
          <label className="block text-sm text-slate-300">
            Theme
            <select
              value={user?.theme ?? "dark"}
              onChange={(event) =>
                user && setUser({ ...user, theme: event.target.value })
              }
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5"
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </label>
        </div>
        <button
          type="button"
          onClick={() => void saveAccount()}
          disabled={saving === "account"}
          className="mt-5 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
        >
          {saving === "account" ? "Saving..." : "Save preferences"}
        </button>
      </section>
    </div>
  );
}