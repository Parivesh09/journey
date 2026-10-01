"use client";

import { SectionHead } from "@/app/components/ui";
import { type UserSettings } from "@/app/settings/settings-defaults";
import { SettingsMessages } from "@/app/settings/settings-messages";

export function AppearanceSection({
  onSubmit,
  user,
  setUser,
  message,
  error,
}: {
  onSubmit: (event?: React.FormEvent) => void;
  user: UserSettings | null;
  setUser: React.Dispatch<React.SetStateAction<UserSettings | null>>;
  message: string;
  error: string;
}) {
  return (
    <form onSubmit={onSubmit}>
      <SettingsMessages message={message} error={error} />

      <SectionHead
        index="01"
        title="Appearance"
        instruction="Choose your preferred color theme"
      />
      <div className="mt-6 space-y-6">
        <div>
          <label className="text-sm font-medium text-foreground">
            Theme
          </label>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <label
              className={`relative cursor-pointer p-4 rounded-xl border-2 transition-colors ${
                user?.theme === "dark"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <input
                type="radio"
                name="theme"
                value="dark"
                checked={user?.theme === "dark"}
                onChange={(e) => {
                  user && setUser({ ...user, theme: e.target.value });
                  try {
                    localStorage.setItem("theme", e.target.value);
                  } catch (e) {}
                }}
                className="sr-only"
              />
              <div className="flex flex-col items-center gap-2">
                <div className="w-full h-20 rounded-lg bg-background border border-border relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5" />
                  <div className="relative flex items-center justify-center h-full">
                    <span className="text-xs font-medium text-primary">
                      Dark
                    </span>
                  </div>
                </div>
                <span className="text-sm font-medium text-foreground">
                  Dark
                </span>
                <span className="text-xs text-graphite-muted">Default</span>
              </div>
            </label>
            <label
              className={`relative cursor-pointer p-4 rounded-xl border-2 transition-colors ${
                user?.theme === "light"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <input
                type="radio"
                name="theme"
                value="light"
                checked={user?.theme === "light"}
                onChange={(e) => {
                  user && setUser({ ...user, theme: e.target.value });
                  try {
                    localStorage.setItem("theme", e.target.value);
                  } catch (e) {}
                }}
                className="sr-only"
              />
              <div className="flex flex-col items-center gap-2">
                <div className="w-full h-20 rounded-lg bg-background border border-border relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-accent/5" />
                  <div className="relative flex items-center justify-center h-full">
                    <span className="text-xs font-medium text-accent">
                      Light
                    </span>
                  </div>
                </div>
                <span className="text-sm font-medium text-foreground">
                  Light
                </span>
              </div>
            </label>
          </div>
        </div>
      </div>
    </form>
  );
}