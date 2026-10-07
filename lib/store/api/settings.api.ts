import { baseApi } from "./base-api";
import type {
  SettingsResponse,
  SaveSettingsRequest,
  SaveSettingsResponse,
} from "./types/api-types";

interface NotificationPreferences {
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
}

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSettings: builder.query<SettingsResponse, void>({
      query: () => "settings",
      providesTags: ["Settings"],
    }),

    saveSettings: builder.mutation<SaveSettingsResponse, SaveSettingsRequest>({
      query: (body) => ({
        url: "settings",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Settings", "Users"],
    }),

    saveNotificationSettings: builder.mutation<void, NotificationPreferences>({
      query: (body) => ({
        url: "settings/notifications",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Settings"],
    }),

    dismissOnboarding: builder.mutation<void, void>({
      query: () => ({
        url: "settings/dismiss-onboarding",
        method: "POST",
      }),
      invalidatesTags: ["Settings"],
    }),
  }),
});

export const {
  useGetSettingsQuery,
  useSaveSettingsMutation,
  useSaveNotificationSettingsMutation,
  useDismissOnboardingMutation,
} = settingsApi;
