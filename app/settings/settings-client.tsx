"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader, Sheet, PageHeader } from "@/app/components/ui";
import { AIProviderSettings } from "@/app/components/ai-provider-settings";
import {
  useGetSettingsQuery,
  useSaveSettingsMutation,
  useSaveNotificationSettingsMutation,
} from "@/lib/api";
import type { ApiError } from "@/lib/types";
import {
  defaultNotificationSettings,
  type NotificationSettings,
  type SettingsTab,
  type UserSettings,
} from "@/app/settings/settings-defaults";
import { SettingsTabNav } from "@/app/settings/settings-tab-nav";
import { AccountSection } from "@/app/settings/settings-account-section";
import { AppearanceSection } from "@/app/settings/settings-appearance-section";
import { NotificationsSection } from "@/app/settings/settings-notifications-section";

export default function SettingsClient() {
  const router = useRouter();
  const { data, isLoading, error: queryError } = useGetSettingsQuery();
  const [saveSettings, { isLoading: saving }] = useSaveSettingsMutation();
  const [saveNotificationSettings] = useSaveNotificationSettingsMutation();

  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<SettingsTab>(
    searchParams.get("tab") === "configuration" ? "configuration" : "account",
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState<UserSettings | null>(null);
  const [password, setPassword] = useState({ current: "", next: "" });
  const [notificationSettings, setNotificationSettings] = useState(
    defaultNotificationSettings,
  );

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
      const message =
        reason && typeof reason === "object" && "data" in reason
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
    } catch (reason: unknown) {
      const error = reason as { data?: { error?: string } } | undefined;
      setError(
        typeof error?.data?.error === "string"
          ? error.data.error
          : "Failed to save notification settings",
      );
      return false;
    }
  };

  const updateNotification = <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K],
  ) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateSchedule = (
    index: number,
    patch: Partial<{ time: string; enabled: boolean }>,
  ) => {
    setNotificationSettings((prev) => ({
      ...prev,
      reminderSchedule: prev.reminderSchedule.map((entry, i) =>
        i === index ? { ...entry, ...patch } : entry,
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
    <Sheet>
      <PageHeader
        title="Settings"
        subtitle="Manage your account, preferences, and notifications"
      />

      <SettingsTabNav activeTab={activeTab} onSelectTab={setActiveTab} />

      {activeTab === "account" && (
        <AccountSection
          onSubmit={saveAccount}
          user={user}
          setUser={setUser}
          password={password}
          setPassword={setPassword}
          message={message}
          error={error}
          saving={saving}
        />
      )}

      {activeTab === "appearance" && (
        <AppearanceSection
          onSubmit={saveAccount}
          user={user}
          setUser={setUser}
          message={message}
          error={error}
        />
      )}

      {activeTab === "notifications" && (
        <NotificationsSection
          onSubmit={async (e) => {
            e.preventDefault();
            await saveNotificationSettingsHandler();
          }}
          notificationSettings={notificationSettings}
          updateNotification={updateNotification}
          updateSchedule={updateSchedule}
          message={message}
          error={error}
          saving={saving}
          onCancel={() => {
            setMessage("");
            setError("");
          }}
        />
      )}
      {activeTab === "configuration" && <AIProviderSettings />}
    </Sheet>
  );
}