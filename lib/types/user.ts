export interface UserSettings {
  id: string;
  name: string | null;
  email: string;
  timezone: string;
  dailyStudyTargetMinutes: number;
  theme: string;
  onboardingDismissedAt: Date | null;
}

export interface UserProfile extends UserSettings {
  createdAt: Date;
  updatedAt: Date;
}

export type Theme = "light" | "dark";

export const THEMES: Theme[] = ["light", "dark"];

export interface TimezoneOption {
  value: string;
  label: string;
}