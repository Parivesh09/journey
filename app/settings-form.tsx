"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SectionHead, PrimaryButton, FormGroup, Loader } from "@/app/components/ui";

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
    <div className="flex items-center justify-between py-3 border-b border-hairline last:border-b-0">
      <span className="text-[0.875rem] text-graphite">{label}</span>
      <div className="flex items-center gap-3">
        {children}
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          className="h-4 w-4 accent-amber-ink"
        />
      </div>
    </div>
  );
}

export default function SettingsForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState<UserSettings | null>(null);
  const [password, setPassword] = useState({ current: "", next: "" });

  const load = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/settings", { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load settings");
      const data = (await response.json()) as {
        user: UserSettings;
        notifications:
          | (Partial<{
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
            }> & {
              reminderSchedule?: unknown;
            })
          | null;
      };
      setUser(data.user);
      // We're not using notifications in the settings form anymore
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
          notifications:
            | (Partial<{
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
              }> & {
                reminderSchedule?: unknown;
              })
            | null;
        };
        if (cancelled) return;
        setUser(data.user);
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
      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
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

  if (loading) {
    return <Loader label="Loading settings" />;
  }

  return (
    <div className="space-y-10">
      {message && (
        <div className="rounded border border-valid-green/30 bg-valid-green/5 px-4 py-3 text-[0.85rem] text-valid-green">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded border border-stamp-red/30 bg-stamp-red/5 px-4 py-3 text-[0.85rem] text-stamp-red">
          {error}
        </div>
      )}

      <form onSubmit={saveAccount}>
        <SectionHead
          index="01"
          title="Account"
          instruction="Your identity, sign-in email, and password"
        />
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <FormGroup label="Name">
            <input
              value={user?.name ?? ""}
              onChange={(event) =>
                user && setUser({ ...user, name: event.target.value })
              }
              className="field border-b-2"
            />
          </FormGroup>
          <FormGroup label="Email">
            <input
              type="email"
              value={user?.email ?? ""}
              onChange={(event) =>
                user && setUser({ ...user, email: event.target.value })
              }
              className="field border-b-2"
            />
          </FormGroup>
        </div>
        
        <div className="mt-6 border border-hairline rounded p-4">
          <p className="text-[0.7rem] uppercase tracking-wide text-graphite-muted font-semibold">
            Change Password
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <input
              type="password"
              placeholder="Current password"
              value={password.current}
              onChange={(event) =>
                setPassword((current) => ({
                  ...current,
                  current: event.target.value,
                }))
              }
              className="field border-b-2"
            />
            <input
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
              className="field border-b-2"
            />
          </div>
          <p className="mt-2 text-[0.75rem] text-graphite-muted">
            Leave both fields empty to keep your current password.
          </p>
        </div>

        <div className="mt-6">
          <PrimaryButton type="submit" disabled={saving === "account"}>
            {saving === "account" ? "Saving..." : "Save Account"}
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
}