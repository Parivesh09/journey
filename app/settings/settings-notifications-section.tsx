"use client";

import {
  Caption,
  Input,
  Label,
  PrimaryButton,
  SectionHead,
} from "@/app/components/ui";
import {
  scheduleLabel,
  type NotificationSettings,
} from "@/app/settings/settings-defaults";
import { SettingsMessages } from "@/app/settings/settings-messages";

export function NotificationsSection({
  onSubmit,
  notificationSettings,
  updateNotification,
  updateSchedule,
  message,
  error,
  saving,
  onCancel,
}: {
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  notificationSettings: NotificationSettings;
  updateNotification: <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K],
  ) => void;
  updateSchedule: (
    index: number,
    patch: Partial<{ time: string; enabled: boolean }>,
  ) => void;
  message: string;
  error: string;
  saving: boolean;
  onCancel: () => void;
}) {
  return (
    <form onSubmit={onSubmit}>
      <SettingsMessages message={message} error={error} />

      <SectionHead
        index="01"
        title="Notification Channels"
        instruction="Every channel is off by default. Reminders are only sent for channels you explicitly enable"
      />
      <div className="mt-6 space-y-4">
        <label className="flex items-center justify-between py-3 border-b border-border cursor-pointer">
          <span className="text-sm text-foreground">
            Browser notifications
          </span>
          <input
            type="checkbox"
            checked={notificationSettings.browserEnabled}
            onChange={(e) =>
              updateNotification("browserEnabled", e.target.checked)
            }
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
            onChange={(e) =>
              updateNotification("phoneNumber", e.target.value)
            }
            placeholder="+91 XXXXX XXXXX"
          />
          <Caption>Use international format like +91XXXXXXXXXX</Caption>
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
            onChange={(e) =>
              updateNotification("dailyReminderEnabled", e.target.checked)
            }
            className="h-4 w-4 accent-primary"
          />
        </label>
        <label className="flex items-center justify-between py-2 border-b border-border cursor-pointer">
          <span className="text-sm text-foreground">Missed-task reminder</span>
          <input
            type="checkbox"
            checked={notificationSettings.missedTaskReminderEnabled}
            onChange={(e) =>
              updateNotification(
                "missedTaskReminderEnabled",
                e.target.checked,
              )
            }
            className="h-4 w-4 accent-primary"
          />
        </label>
        <label className="flex items-center justify-between py-2 border-b border-border cursor-pointer">
          <span className="text-sm text-foreground">Revision review</span>
          <input
            type="checkbox"
            checked={notificationSettings.revisionReminderEnabled}
            onChange={(e) =>
              updateNotification(
                "revisionReminderEnabled",
                e.target.checked,
              )
            }
            className="h-4 w-4 accent-primary"
          />
        </label>
        <label className="flex items-center justify-between py-2 border-b border-border cursor-pointer">
          <span className="text-sm text-foreground">Weekly summary</span>
          <input
            type="checkbox"
            checked={notificationSettings.weeklySummaryEnabled}
            onChange={(e) =>
              updateNotification("weeklySummaryEnabled", e.target.checked)
            }
            className="h-4 w-4 accent-primary"
          />
        </label>
        {notificationSettings.weeklySummaryEnabled && (
          <div className="flex items-center justify-between py-2 border-b border-border pl-4">
            <span className="text-sm text-graphite-muted">Summary day</span>
            <select
              value={notificationSettings.weeklySummaryDay}
              onChange={(e) =>
                updateNotification(
                  "weeklySummaryDay",
                  Number(e.target.value),
                )
              }
              className="input w-32"
            >
              {[
                "Sunday",
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
              ].map((day, index) => (
                <option key={day} value={index}>
                  {day}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="space-y-3 border-t border-border pt-4">
        <Caption className="font-semibold uppercase tracking-wide">
          Scheduled Times
        </Caption>
        {notificationSettings.reminderSchedule?.map((entry, index) => (
          <div
            key={entry.key}
            className="flex items-center justify-between py-2 border-b border-border last:border-b-0"
          >
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={entry.enabled}
                onChange={(e) =>
                  updateSchedule(index, { enabled: e.target.checked })
                }
                className="h-4 w-4 accent-primary"
              />
              <span className="text-sm text-foreground">
                {scheduleLabel[entry.key] ?? entry.key}
              </span>
            </label>
            <Input
              type="time"
              value={entry.time}
              onChange={(e) =>
                updateSchedule(index, { time: e.target.value })
              }
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
          <span className="text-sm text-foreground">
            Max notifications per day
          </span>
          <Input
            type="number"
            min={1}
            max={20}
            value={notificationSettings.maxDailyNotifications}
            onChange={(e) =>
              updateNotification(
                "maxDailyNotifications",
                Math.max(1, Math.min(20, Number(e.target.value) || 1)),
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
            onChange={(e) =>
              updateNotification("excludeCompletedTasks", e.target.checked)
            }
            className="h-4 w-4 accent-primary"
          />
        </label>
      </div>

      <div className="mt-8 pt-6 border-t border-border flex justify-end gap-3">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
        >
          Cancel
        </button>
        <PrimaryButton type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </PrimaryButton>
      </div>
    </form>
  );
}