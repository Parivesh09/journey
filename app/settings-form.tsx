"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SectionHead, SkeletonRows } from "@/app/components/ui";

type NotificationSettings = {
  browserEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
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
  smsEnabled: false,
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

const labelClass =
  "block text-[0.72rem] font-semibold text-graphite-2";

function ToggleRow({
  label,
  checked,
  onChange,
  disabled,
  children,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <label className="flex items-center justify-between gap-4 border-b border-graphite/15 py-3">
      <span className="text-[0.875rem] text-graphite">{label}</span>
      <span className="flex shrink-0 items-center gap-3">
        {children}
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          className="h-4 w-4 accent-amber-ink"
        />
      </span>
    </label>
  );
}

export default function SettingsForm() {
  const router = useRouter();
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
    router.refresh();
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
    return <SkeletonRows rows={6} />;
  }

  return (
    <div className="space-y-10">
      {message ? (
        <p
          className="rounded-xl border border-valid/30 bg-valid/[0.05] px-3 py-2.5 text-[0.78rem] font-medium text-valid"
          role="status"
        >
          {message}
        </p>
      ) : null}
      {error ? (
        <p
          className="rounded-xl border border-stamp/30 bg-stamp/[0.05] px-3 py-2.5 text-[0.78rem] font-medium text-stamp"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <form onSubmit={saveAccount}>
        <section>
          <SectionHead
            index="01"
            title="Account"
            instruction="Your identity, sign-in email, and password."
          />
          <div className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <label className={labelClass}>
              Name
              <input
                value={user?.name ?? ""}
                onChange={(event) =>
                  user && setUser({ ...user, name: event.target.value })
                }
                className="field mt-1 normal-case tracking-normal"
              />
            </label>
            <label className={labelClass}>
              Email
              <input
                type="email"
                value={user?.email ?? ""}
                onChange={(event) =>
                  user && setUser({ ...user, email: event.target.value })
                }
                className="field mt-1 normal-case tracking-normal"
              />
            </label>
          </div>
          <div className="mt-5 rounded-xl border border-rule bg-paper/50 p-4">
            <p className="text-[0.72rem] font-semibold text-graphite-2">
              Change password
            </p>
            <div className="mt-3 grid gap-x-6 gap-y-4 sm:grid-cols-2">
              <input
                type="password"
                placeholder="Current password"
                value={password.current}
                onChange={(event) =>
                  setPassword((current) => ({ ...current, current: event.target.value }))
                }
                aria-label="Current password"
                className="field"
              />
              <input
                type="password"
                placeholder="New password (min 8 chars)"
                minLength={8}
                value={password.next}
                onChange={(event) =>
                  setPassword((current) => ({ ...current, next: event.target.value }))
                }
                aria-label="New password"
                className="field"
              />
            </div>
            <p className="mt-2 text-[0.72rem] text-graphite-2">
              Leave both fields empty to keep your current password.
            </p>
          </div>
          <button
            type="submit"
            disabled={saving === "account"}
            className="btn btn-primary mt-5"
          >
            {saving === "account" ? "Saving" : "Save account"}
          </button>
        </section>
      </form>

      <section>
        <SectionHead
          index="02"
          title="Notifications"
          instruction="Every channel is off by default. Reminders are only sent for channels you explicitly enable below."
        />
        <div className="mt-4 border-t border-graphite/25">
          {(
            [
              ["browserEnabled", "Browser notifications"],
              ["emailEnabled", "Email reminders"],
              ["smsEnabled", "SMS reminders"],
            ] as const
          ).map(([key, label]) => (
            <ToggleRow
              key={key}
              label={label}
              checked={notifications[key]}
              onChange={(checked) => updateNotification(key, checked)}
            />
          ))}
        </div>

        {notifications.smsEnabled ? (
          <label className={`${labelClass} mt-5`}>
            Phone number (for SMS)
            <input
              type="tel"
              value={notifications.phoneNumber ?? ""}
              onChange={(event) =>
                updateNotification("phoneNumber", event.target.value)
              }
              placeholder="+91 XXXXX XXXXX"
              className="field mt-1 normal-case tracking-normal"
            />
            <span className="mt-1 block text-[0.72rem] normal-case tracking-normal text-graphite-2">
              Use an international format like +91XXXXXXXXXX. Nothing is sent
              unless the matching channel is enabled.
            </span>
          </label>
        ) : null}
        <button
          type="button"
          onClick={() => void saveNotifications()}
          disabled={saving === "notifications"}
          className="btn btn-primary mt-5"
        >
          {saving === "notifications" ? "Saving" : "Save notifications"}
        </button>
      </section>

      <section>
        <SectionHead
          index="03"
          title="Reminder schedule"
          instruction="With the master switch off, enable individual reminders below."
        />
        <div className="mt-4 border-t border-graphite/25">
          <ToggleRow
            label="Daily task reminder (master switch)"
            checked={notifications.dailyReminderEnabled}
            onChange={(checked) =>
              updateNotification("dailyReminderEnabled", checked)
            }
          />
          <ToggleRow
            label="Missed-task reminder (overdue tasks)"
            checked={notifications.missedTaskReminderEnabled}
            onChange={(checked) =>
              updateNotification("missedTaskReminderEnabled", checked)
            }
          />
          <ToggleRow
            label="Revision review (revision items due today)"
            checked={notifications.revisionReminderEnabled}
            onChange={(checked) =>
              updateNotification("revisionReminderEnabled", checked)
            }
          />
          <ToggleRow
            label="Weekly summary (past 7 days)"
            checked={notifications.weeklySummaryEnabled}
            onChange={(checked) =>
              updateNotification("weeklySummaryEnabled", checked)
            }
          >
            <select
              value={notifications.weeklySummaryDay}
              onChange={(event) =>
                updateNotification(
                  "weeklySummaryDay",
                  Number(event.target.value),
                )
              }
              disabled={!notifications.weeklySummaryEnabled}
              aria-label="Weekly summary day"
              className="field w-auto appearance-none pr-6"
            >
              {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(
                (day, index) => (
                  <option key={day} value={index}>
                    {day}
                  </option>
                ),
              )}
            </select>
          </ToggleRow>
        </div>

        <div className="mt-1 border-t border-graphite/25">
          {notifications.reminderSchedule.map((entry, index) => (
            <div
              key={entry.key}
              className="flex items-center justify-between gap-4 border-b border-graphite/15 py-3"
            >
              <label className="flex items-center gap-3 text-[0.875rem] text-graphite">
                <input
                  type="checkbox"
                  checked={entry.enabled}
                  onChange={(event) =>
                    updateSchedule(index, { enabled: event.target.checked })
                  }
                  className="h-4 w-4 accent-amber-ink"
                />
                {scheduleLabel[entry.key] ?? entry.key}
              </label>
              <input
                type="time"
                value={entry.time}
                onChange={(event) =>
                  updateSchedule(index, { time: event.target.value })
                }
                aria-label={`${scheduleLabel[entry.key] ?? entry.key} time`}
                className="field w-auto"
              />
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <label className="flex items-center gap-3 text-[0.875rem] text-graphite">
            <input
              type="checkbox"
              checked={notifications.excludeCompletedTasks}
              onChange={(event) =>
                updateNotification("excludeCompletedTasks", event.target.checked)
              }
              className="h-4 w-4 accent-amber-ink"
            />
            Exclude completed tasks
          </label>
          <label className={labelClass}>
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
              className="field mt-1 normal-case tracking-normal"
            />
          </label>
          <label className={labelClass}>
            Quiet hours start (HH:MM)
            <input
              type="time"
              value={notifications.quietHoursStart}
              onChange={(event) =>
                updateNotification("quietHoursStart", event.target.value)
              }
              className="field mt-1 normal-case tracking-normal"
            />
          </label>
          <label className={labelClass}>
            Quiet hours end (HH:MM)
            <input
              type="time"
              value={notifications.quietHoursEnd}
              onChange={(event) =>
                updateNotification("quietHoursEnd", event.target.value)
              }
              className="field mt-1 normal-case tracking-normal"
            />
          </label>
        </div>
        <button
          type="button"
          onClick={() => void saveNotifications()}
          disabled={saving === "notifications"}
          className="btn btn-primary mt-5"
        >
          {saving === "notifications" ? "Saving" : "Save schedule"}
        </button>
      </section>

      <section>
        <SectionHead
          index="04"
          title="Preferences"
          instruction="Timezone, daily focus target, and reading theme."
        />
        <div className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <label className={labelClass}>
            Timezone
            <select
              value={user?.timezone ?? "UTC"}
              onChange={(event) =>
                user && setUser({ ...user, timezone: event.target.value })
              }
              className="field mt-1 appearance-none pr-6 normal-case tracking-normal"
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
          <label className={labelClass}>
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
              className="field mt-1 normal-case tracking-normal"
            />
          </label>
          <label className={labelClass}>
            Theme
            <select
              value={user?.theme ?? "dark"}
              onChange={(event) =>
                user && setUser({ ...user, theme: event.target.value })
              }
              className="field mt-1 appearance-none pr-6 normal-case tracking-normal"
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
          className="btn btn-mark mt-5"
        >
          {saving === "account" ? "Saving" : "Save preferences"}
        </button>
      </section>
    </div>
  );
}
