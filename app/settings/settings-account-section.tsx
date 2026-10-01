"use client";

import {
  Caption,
  Card,
  FormGroup,
  Input,
  Label,
  PrimaryButton,
  SectionHead,
} from "@/app/components/ui";
import { type UserSettings } from "@/app/settings/settings-defaults";
import { SettingsMessages } from "@/app/settings/settings-messages";

export function AccountSection({
  onSubmit,
  user,
  setUser,
  password,
  setPassword,
  message,
  error,
  saving,
}: {
  onSubmit: (event?: React.FormEvent) => void;
  user: UserSettings | null;
  setUser: React.Dispatch<React.SetStateAction<UserSettings | null>>;
  password: { current: string; next: string };
  setPassword: React.Dispatch<
    React.SetStateAction<{ current: string; next: string }>
  >;
  message: string;
  error: string;
  saving: boolean;
}) {
  return (
    <form onSubmit={onSubmit}>
      <SettingsMessages message={message} error={error} />

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
  );
}