"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet, PageHeader, SectionHead, PrimaryButton, SecondaryButton, FormGroup, Loader, Card, CardContent, Input, Label, Caption } from "@/app/components/ui";
import { useGetSettingsQuery, useSaveSettingsMutation, useSaveNotificationSettingsMutation } from "@/lib/api";
import type { ApiError } from "@/lib/types";

const timezones = (() => {
  try {
    return Intl.supportedValuesOf("timeZone") as string[];
  } catch {
    return [];
  }
})();

const defaultNotificationSettings = {
  browserEnabled: false,
  emailEnabled: false,
  smsEnabled: false,
  phoneNumber: null as string | null,
  reminderSchedule: [
    { key: "morning", time: "08:00", enabled: false },
    { key: "midday", time: "13:00", enabled: false },
    { key: "evening", time: "19:00", enabled: false },
    { key: "final", time: "22:00", enabled: false },
    { key: "nextDay", time: "08:00", enabled: false },
  ],
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

const scheduleLabel: Record<string, string> = {
  morning: "Morning Reminder",
  midday: "Midday Reminder",
  evening: "Evening Reminder",
  final: "Final Reminder",
  nextDay: "Next-Day Summary",
};

type UserSettings = {
  id: string;
  name: string | null;
  email: string;
  timezone: string;
  dailyStudyTargetMinutes: number;
  theme: string;
};

type NotificationSettings = typeof defaultNotificationSettings;

export default function SettingsPage() {
  const router = useRouter();
  const { data, isLoading, error: queryError } = useGetSettingsQuery();
  const [saveSettings, { isLoading: saving }] = useSaveSettingsMutation();
  const [saveNotificationSettings] = useSaveNotificationSettingsMutation();

  const [activeTab, setActiveTab] = useState<"account" | "notifications">("account");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState<UserSettings | null>(null);
  const [password, setPassword] = useState({ current: "", next: "" });
  const [notificationSettings, setNotificationSettings] = useState(defaultNotificationSettings);

  if (data?.user && !user) {
    setUser(data.user);
  }
  if (data?.notifications && !notificationSettings) {
    setNotificationSettings({
      ...defaultNotificationSettings,
      ...data.notifications,
    });
  }

  async function saveAccount(event?: React.FormEvent) {
    event?.preventDefault();
    if (!user) return;
    setMessage("");
    setError("");
    try {
      await saveSettings({
        name: user.name ?? undefined,
        email: user.email,
        timezone: user.timezone,
        dailyStudyTargetMinutes: user.dailyStudyTargetMinutes,
        theme: user.theme,
        ...(password.next
          ? { currentPassword: password.current, newPassword: password.next }
          : {}),
      }).unwrap();
      setPassword({ current: "", next: "" });
      setMessage("Account settings saved.");
      router.refresh();
    } catch (reason: unknown) {
      const message = reason && typeof reason === "object" && "data" in reason
        ? (reason as { data?: ApiError }).data?.error
        : undefined;
      setError(
        typeof message === "string"
          ? message
          : "Unable to save account settings.",
      );
    }
  }

  const saveNotificationSettingsHandler = async () => {
    try {
      await saveNotificationSettings(notificationSettings).unwrap();
      setMessage("Notification settings saved.");
      return true;
    } catch (reason: any) {
      setError(
        typeof reason?.data?.error === "string"
          ? reason.data.error
          : "Failed to save notification settings",
      );
      return false;
    }
  };

  const updateNotification = <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateSchedule = (
    index: number,
    patch: Partial<{ time: string; enabled: boolean }>
  ) => {
    setNotificationSettings(prev => ({
      ...prev,
      reminderSchedule: prev.reminderSchedule.map((entry, i) =>
        i === index ? { ...entry, ...patch } : entry
      ),
    }));
  };

  if (isLoading) {
    return <Loader label="Loading settings" />;
  }

  if (queryError || !user) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        Unable to load settings.
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Tab Navigation */}
      <div className="flex border-b border-border">
        {(["account", "notifications"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab
                ? "border-primary text-foreground"
                : "border-transparent text-graphite-muted hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === "account" && (
        <form onSubmit={saveAccount}>
          {message && (
            <div className="rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">
              {message}
            </div>
          )}
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <SectionHead
            index="01"
            title="Account"
            instruction="Your identity, sign-in email, and password"
          />
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <FormGroup label="Name">
              <Input
                value={user?.name ?? ""}
                onChange={(event) =>
                  user && setUser({ ...user, name: event.target.value })
                }
              />
            </FormGroup>
            <FormGroup label="Email">
              <Input
                type="email"
                value={user?.email ?? ""}
                onChange={(event) =>
                  user && setUser({ ...user, email: event.target.value })
                }
              />
            </FormGroup>
          </div>

          <Card className="mt-6 p-4">
            <Label className="text-sm font-semibold text-graphite-muted uppercase tracking-wide">
              Change Password
            </Label>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input
                type="password"
                placeholder="Current password"
                value={password.current}
                onChange={(event) =>
                  setPassword((current) => ({
                    ...current,
                    current: event.target.value,
                  }))
                }
              />
              <Input
                type="password"
                placeholder="New password (min 8 chars)"
                minLength={8}
                value={password.next}
                onChange={(event) =>
                  setPassword((current) => ({
                    ...current,
                    next: event.target.value,
                  }))
                }
              />
            </div>
            <Caption className="mt-2">
              Leave both fields empty to keep your current password.
            </Caption>
          </Card>

          <div className="mt-6">
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Account"}
            </PrimaryButton>
          </div>
        </form>
      )}

      {activeTab === "notifications" && (
        <form onSubmit={async (e) => { e.preventDefault(); await saveNotificationSettingsHandler(); }}>
          {message && (
            <div className="rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">
              {message}
            </div>
          )}
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <SectionHead
            index="01"
            title="Notification Channels"
            instruction="Every channel is off by default. Reminders are only sent for channels you explicitly enable"
          />
          <div className="mt-6 space-y-4">
            <label className="flex items-center justify-between py-3 border-b border-border cursor-pointer">
              <span className="text-sm text-foreground">Browser notifications</span>
              <input
                type="checkbox"
                checked={notificationSettings.browserEnabled}
                onChange={(e) => updateNotification("browserEnabled", e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
            </label>
            <label className="flex items-center justify-between py-3 border-b border-border cursor-pointer">
              <span className="text-sm text-foreground">Email reminders</span>
              <input
                type="checkbox"
                checked={notificationSettings.emailEnabled}
                onChange={(e) => updateNotification("emailEnabled", e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
            </label>
            <label className="flex items-center justify-between py-3 border-b border-border cursor-pointer">
              <span className="text-sm text-foreground">SMS reminders</span>
              <input
                type="checkbox"
                checked={notificationSettings.smsEnabled}
                onChange={(e) => updateNotification("smsEnabled", e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
            </label>
          </div>

          {notificationSettings.smsEnabled && (
            <div className="space-y-2 border-t border-border pt-4">
              <Label className="block text-sm font-medium text-foreground">
                Phone number (for SMS)
              </Label>
              <Input
                type="tel"
                value={notificationSettings.phoneNumber ?? ""}
                onChange={(e) => updateNotification("phoneNumber", e.target.value)}
                placeholder="+91 XXXXX XXXXX"
              />
              <Caption>
                Use international format like +91XXXXXXXXXX
              </Caption>
            </div>
          )}

          <SectionHead
            index="02"
            title="Reminder Schedule"
            instruction="Enable individual reminders and configure timing"
          />
          <div className="mt-6 space-y-4">
            <label className="flex items-center justify-between py-2 border-b border-border cursor-pointer">
              <span className="text-sm text-foreground">Daily task reminder</span>
              <input
                type="checkbox"
                checked={notificationSettings.dailyReminderEnabled}
                onChange={(e) => updateNotification("dailyReminderEnabled", e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
            </label>
            <label className="flex items-center justify-between py-2 border-b border-border cursor-pointer">
              <span className="text-sm text-foreground">Missed-task reminder</span>
              <input
                type="checkbox"
                checked={notificationSettings.missedTaskReminderEnabled}
                onChange={(e) => updateNotification("missedTaskReminderEnabled", e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
            </label>
            <label className="flex items-center justify-between py-2 border-b border-border cursor-pointer">
              <span className="text-sm text-foreground">Revision review</span>
              <input
                type="checkbox"
                checked={notificationSettings.revisionReminderEnabled}
                onChange={(e) => updateNotification("revisionReminderEnabled", e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
            </label>
            <label className="flex items-center justify-between py-2 border-b border-border cursor-pointer">
              <span className="text-sm text-foreground">Weekly summary</span>
              <input
                type="checkbox"
                checked={notificationSettings.weeklySummaryEnabled}
                onChange={(e) => updateNotification("weeklySummaryEnabled", e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
            </label>
            {notificationSettings.weeklySummaryEnabled && (
              <div className="flex items-center justify-between py-2 border-b border-border pl-4">
                <span className="text-sm text-graphite-muted">Summary day</span>
                <select
                  value={notificationSettings.weeklySummaryDay}
                  onChange={(e) => updateNotification("weeklySummaryDay", Number(e.target.value))}
                  className="input w-32"
                >
                  {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day, index) => (
                    <option key={day} value={index}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <Caption className="font-semibold uppercase tracking-wide">Scheduled Times</Caption>
            {notificationSettings.reminderSchedule?.map((entry, index) => (
              <div key={entry.key} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={entry.enabled}
                    onChange={(e) => updateSchedule(index, { enabled: e.target.checked })}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="text-sm text-foreground">
                    {scheduleLabel[entry.key] ?? entry.key}
                  </span>
                </label>
                <Input
                  type="time"
                  value={entry.time}
                  onChange={(e) => updateSchedule(index, { time: e.target.value })}
                  className="input w-28 text-center"
                />
              </div>
            ))}
          </div>

          <SectionHead
            index="03"
            title="Rules & Limits"
            instruction="Quiet hours and notification limits"
          />
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-foreground">Max notifications per day</span>
              <Input
                type="number"
                min={1}
                max={20}
                value={notificationSettings.maxDailyNotifications}
                onChange={(e) =>
                  updateNotification(
                    "maxDailyNotifications",
                    Math.max(1, Math.min(20, Number(e.target.value) || 1))
                  )
                }
                className="input w-20 text-center"
              />
            </div>
            <label className="flex items-center justify-between py-2 border-b border-border cursor-pointer">
              <span className="text-sm text-foreground">Exclude completed tasks</span>
              <input
                type="checkbox"
                checked={notificationSettings.excludeCompletedTasks}
                onChange={(e) => updateNotification("excludeCompletedTasks", e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
            </label>
          </div>

          <div className="mt-8 pt-6 border-t border-border flex justify-end gap-3">
            <button type="button" className="btn btn-secondary" onClick={() => { setMessage(""); setError(""); }}>
              Cancel
            </button>
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Settings"}
            </PrimaryButton>
          </div>
        </form>
      )}
    </div>
  );
}