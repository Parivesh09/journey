"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  PageHeader,
  SectionHead,
  Stamp,
  Drawer,
  IconButton,
  Card,
} from "@/app/components/ui";
import {
  useGetSettingsQuery,
  useSaveNotificationSettingsMutation,
} from "@/lib/api";

type User = {
  id: string;
  name: string | null;
  email: string;
  timezone: string;
  dailyStudyTargetMinutes: number;
  theme: string;
};

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

export default function NotificationsClient({
  user,
  totalNotifications,
  deliveredCount,
  failedCount,
}: {
  user: User;
  totalNotifications: number;
  deliveredCount: number;
  failedCount: number;
}) {
  const { data } = useGetSettingsQuery();
  const [saveNotificationSettings] = useSaveNotificationSettingsMutation();

  const [notificationSettings, setNotificationSettings] = useState(
    defaultNotificationSettings,
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    if (data?.notifications) {
      setNotificationSettings({
        ...defaultNotificationSettings,
        ...data.notifications,
      });
    }
  }, [data?.notifications]);

  const saveSettings = async () => {
    try {
      await saveNotificationSettings(notificationSettings).unwrap();
      return true;
    } catch (reason: any) {
      alert(
        typeof reason?.data?.error === "string"
          ? reason.data.error
          : "Failed to save notification settings",
      );
      return false;
    }
  };

  const updateNotification = <K extends keyof typeof notificationSettings>(
    key: K,
    value: typeof notificationSettings[K]
  ) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: value
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

  const scheduleLabel: Record<string, string> = {
    morning: "Morning Reminder",
    midday: "Midday Reminder",
    evening: "Evening Reminder",
    final: "Final Reminder",
    nextDay: "Next-Day Summary",
  };

  return (
    <>
      <main className="px-6 py-8 sm:px-8 lg:px-12">
        <Sheet>
          <PageHeader
            title="Notifications"
            subtitle="Your notification channels and delivery status"
            action={
              <IconButton
                onClick={() => setIsDrawerOpen(true)}
                ariaLabel="Open notification settings"
              >
                <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </IconButton>
            }
          />

          <div className="grid gap-6 mt-8 md:grid-cols-3">
            <Card className="p-5">
              <h3 className="text-base font-semibold text-foreground">Total</h3>
              <p className="text-2xl font-mono font-semibold text-foreground mt-2">
                {totalNotifications}
              </p>
              <p className="text-sm text-graphite-muted mt-1">
                total notifications sent
              </p>
            </Card>

            <Card className="p-5">
              <h3 className="text-base font-semibold text-foreground">Delivered</h3>
              <p className="text-2xl font-mono font-semibold text-success mt-2">
                {deliveredCount}
              </p>
              <p className="text-sm text-graphite-muted mt-1">
                successfully delivered
              </p>
            </Card>

            <Card className="p-5">
              <h3 className="text-base font-semibold text-foreground">Failed</h3>
              <p className="text-2xl font-mono font-semibold text-destructive mt-2">
                {failedCount}
              </p>
              <p className="text-sm text-graphite-muted mt-1">
                delivery failures
              </p>
            </Card>
          </div>

          <SectionHead
            index="01"
            title="Channels"
            instruction="Your active notification channels"
          />
          <div className="mt-6 space-y-4">
            {[
              { name: "Browser", status: notificationSettings.browserEnabled ? "Active" : "Paused", last: "2 minutes ago" },
              { name: "Email", status: notificationSettings.emailEnabled ? "Active" : "Paused", last: "Never" },
              { name: "SMS", status: notificationSettings.smsEnabled ? "Active" : "Paused", last: "15 minutes ago" },
            ].map((channel, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {channel.name}
                  </p>
                  <p className="text-sm text-graphite-muted">
                    Last: {channel.last}
                  </p>
                </div>
                <Stamp tone={channel.status === "Active" ? "valid" : "neutral"}>
                  {channel.status}
                </Stamp>
              </div>
            ))}
          </div>
        </Sheet>
      </main>

      <Drawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Notification Settings"
      >
        <div className="space-y-8">
          <SectionHead
            index="02"
            title="Notification Channels"
            instruction="Every channel is off by default. Reminders are only sent for channels you explicitly enable"
          />
          <div className="space-y-4">
            <label className="flex items-center justify-between py-3 border-b border-border cursor-pointer">
              <span className="text-[0.9rem] text-foreground">Browser notifications</span>
              <input
                type="checkbox"
                checked={notificationSettings.browserEnabled}
                onChange={(e) => updateNotification("browserEnabled", e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
            </label>
            <label className="flex items-center justify-between py-3 border-b border-border cursor-pointer">
              <span className="text-[0.9rem] text-foreground">Email reminders</span>
              <input
                type="checkbox"
                checked={notificationSettings.emailEnabled}
                onChange={(e) => updateNotification("emailEnabled", e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
            </label>
            <label className="flex items-center justify-between py-3 border-b border-border cursor-pointer">
              <span className="text-[0.9rem] text-foreground">SMS reminders</span>
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
              <label className="block text-[0.85rem] font-medium text-foreground">
                Phone number (for SMS)
              </label>
              <input
                type="tel"
                value={notificationSettings.phoneNumber ?? ""}
                onChange={(e) => updateNotification("phoneNumber", e.target.value)}
                placeholder="+91 XXXXX XXXXX"
                className="field border-b-2"
              />
              <p className="text-[0.75rem] text-graphite-muted mt-1">
                Use international format like +91XXXXXXXXXX
              </p>
            </div>
          )}

          <SectionHead
            index="03"
            title="Reminder Schedule"
            instruction="Enable individual reminders and configure timing"
          />
          <div className="space-y-4">
            <label className="flex items-center justify-between py-2 border-b border-hairline cursor-pointer">
              <span className="text-[0.9rem] text-foreground">Daily task reminder</span>
              <input
                type="checkbox"
                checked={notificationSettings.dailyReminderEnabled}
                onChange={(e) => updateNotification("dailyReminderEnabled", e.target.checked)}
                className="h-4 w-4 accent-highlighter-amber"
              />
            </label>
            <label className="flex items-center justify-between py-2 border-b border-border cursor-pointer">
              <span className="text-[0.9rem] text-foreground">Missed-task reminder</span>
              <input
                type="checkbox"
                checked={notificationSettings.missedTaskReminderEnabled}
                onChange={(e) => updateNotification("missedTaskReminderEnabled", e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
            </label>
            <label className="flex items-center justify-between py-2 border-b border-border cursor-pointer">
              <span className="text-[0.9rem] text-foreground">Revision review</span>
              <input
                type="checkbox"
                checked={notificationSettings.revisionReminderEnabled}
                onChange={(e) => updateNotification("revisionReminderEnabled", e.target.checked)}
                className="h-4 w-4 accent-highlighter-amber"
              />
            </label>
            <label className="flex items-center justify-between py-2 border-b border-border cursor-pointer">
              <span className="text-[0.9rem] text-foreground">Weekly summary</span>
              <input
                type="checkbox"
                checked={notificationSettings.weeklySummaryEnabled}
                onChange={(e) => updateNotification("weeklySummaryEnabled", e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
            </label>
            {notificationSettings.weeklySummaryEnabled && (
              <div className="flex items-center justify-between py-2 border-b border-border pl-4">
                <span className="text-[0.85rem] text-graphite-muted">Summary day</span>
                <select
                  value={notificationSettings.weeklySummaryDay}
                  onChange={(e) => updateNotification("weeklySummaryDay", Number(e.target.value))}
                  className="field border-b-2 w-32"
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
            <p className="text-[0.8rem] font-semibold text-graphite-muted uppercase tracking-wide">
              Scheduled Times
            </p>
            {notificationSettings.reminderSchedule?.map((entry, index) => (
              <div key={entry.key} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={entry.enabled}
                    onChange={(e) => updateSchedule(index, { enabled: e.target.checked })}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="text-[0.85rem] text-foreground">
                    {scheduleLabel[entry.key] ?? entry.key}
                  </span>
                </label>
                <input
                  type="time"
                  value={entry.time}
                  onChange={(e) => updateSchedule(index, { time: e.target.value })}
                  className="field border-b-2 w-28 text-center"
                />
              </div>
            ))}
          </div>

          <SectionHead
            index="04"
            title="Rules & Limits"
            instruction="Quiet hours and notification limits"
          />
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <span className="text-[0.85rem] text-foreground">Max notifications per day</span>
              <input
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
                className="field border-b-2 w-20 text-center"
              />
            </div>
            <label className="flex items-center justify-between py-2 border-b border-border cursor-pointer">
              <span className="text-[0.85rem] text-foreground">Exclude completed tasks</span>
              <input
                type="checkbox"
                checked={notificationSettings.excludeCompletedTasks}
                onChange={(e) => updateNotification("excludeCompletedTasks", e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
            </label>
          </div>

          <div className="mt-8 pt-6 border-t border-border flex justify-end gap-3">
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                const saved = await saveSettings();
                if (saved) {
                  setIsDrawerOpen(false);
                }
              }}
              className="btn btn-primary"
            >
              Save Settings
            </button>
          </div>
        </div>
      </Drawer>
    </>
  );
}
