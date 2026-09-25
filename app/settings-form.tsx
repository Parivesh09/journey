"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { SectionHead, PrimaryButton, FormGroup, Loader } from "@/app/components/ui";
import { useGetSettingsQuery, useSaveSettingsMutation } from "@/lib/api";
import type { ApiError } from "@/lib/types";

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
  const router = useRouter();
  const { data, isLoading, error: queryError } = useGetSettingsQuery();
  const [saveSettings, { isLoading: saving }] = useSaveSettingsMutation();

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState<UserSettings | null>(null);
  const [password, setPassword] = useState({ current: "", next: "" });

  if (data?.user && !user) {
    setUser(data.user);
  }

  async function saveAccount(event?: FormEvent) {
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

  if (isLoading) {
    return <Loader label="Loading settings" />;
  }

  if (queryError || !user) {
    return (
      <div className="rounded border border-stamp-red/30 bg-stamp-red/5 px-4 py-3 text-[0.85rem] text-stamp-red">
        Unable to load settings.
      </div>
    );
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
          <PrimaryButton type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Account"}
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
}