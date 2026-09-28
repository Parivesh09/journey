import { NotificationPreferences } from "./notification";

export interface User {
  id: string;
  name: string | null;
  email: string;
  timezone: string;
  dailyStudyTargetMinutes: number;
  theme: string;
  onboardingDismissedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionPayload {
  userId: string;
  expiresAt: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  timezone?: string;
}

export interface SessionResponse {
  authenticated: boolean;
  user?: User;
  notificationPreferences?: NotificationPreferences;
}

export interface AuthUser extends Pick<
  User,
  | "id"
  | "name"
  | "email"
  | "timezone"
  | "dailyStudyTargetMinutes"
  | "theme"
  | "onboardingDismissedAt"
> {}
