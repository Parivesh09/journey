import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  DailyFeed,
  RoadmapsResponse,
  DailyRoadmapsResponse,
  LinkRoadmapResponse,
  UnlinkRoadmapResponse,
  MilestonesResponse,
  DailyPinsResponse,
  PinTaskResponse,
  SettingsResponse,
  SaveSettingsResponse,
  SessionResponse,
  PendingNotificationsResponse,
  Task,
} from "@/lib/types";

const baseUrl = typeof window !== "undefined" ? "/api" : undefined;

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers) => {
      // Session cookie is sent automatically by the browser
      // Add any custom headers here if needed
      return headers;
    },
  }),
  tagTypes: [
    "Tasks",
    "Roadmaps",
    "Milestones",
    "DailyPins",
    "DailyRoadmaps",
    "Settings",
    "StudySessions",
    "Auth",
    "Notifications",
  ],
  endpoints: (builder) => ({
    // Tasks API
    getDailyTasks: builder.query<DailyFeed, string>({
      query: (tab) => `tasks?tab=${tab}`,
      providesTags: ["Tasks"],
    }),

    createTask: builder.mutation<{ task: Task }, { title: string; priority?: string; isPersonalDaily?: boolean }>({
      query: (body) => ({
        url: "tasks",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Tasks"],
    }),

    toggleTaskCompleteToday: builder.mutation<{ task: Task; doneToday: boolean }, string>({
      query: (id) => `tasks/${id}/complete-today`,
      invalidatesTags: ["Tasks"],
    }),

    updateTask: builder.mutation<
      { task: Task },
      {
        id: string;
        title?: string;
        description?: string;
        status?: string;
        priority?: string;
        categoryId?: string;
        estimatedMinutes?: number;
        plannedMinutes?: number;
        dueDate?: string;
        dailySlot?: string;
        completed?: boolean;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `tasks/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Tasks"],
    }),

    deleteTask: builder.mutation<{ deleted: boolean; id: string }, string>({
      query: (id) => ({
        url: `tasks/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Tasks"],
    }),

    // Roadmaps API
    getRoadmaps: builder.query<RoadmapsResponse, void>({
      query: () => "roadmaps",
      providesTags: ["Roadmaps"],
    }),

    activateRoadmap: builder.mutation<
      { activated: boolean; roadmapId: string; categories: number; tasksCreated: number; tasksSkipped: number },
      string
    >({
      query: (roadmapId) => ({
        url: "roadmaps",
        method: "POST",
        body: { roadmapId },
      }),
      invalidatesTags: ["Roadmaps"],
    }),

    // Daily Roadmaps API
    getDailyRoadmaps: builder.query<DailyRoadmapsResponse, void>({
      query: () => "daily-roadmaps",
      providesTags: ["DailyRoadmaps"],
    }),

    linkRoadmap: builder.mutation<LinkRoadmapResponse, string>({
      query: (roadmapId) => ({
        url: "daily-roadmaps",
        method: "POST",
        body: { roadmapId },
      }),
      invalidatesTags: ["DailyRoadmaps"],
    }),

    unlinkRoadmap: builder.mutation<UnlinkRoadmapResponse, string>({
      query: (roadmapId) => ({
        url: "daily-roadmaps",
        method: "DELETE",
        params: { roadmapId },
      }),
      invalidatesTags: ["DailyRoadmaps"],
    }),

    // Milestones API
    getMilestones: builder.query<MilestonesResponse, string>({
      query: (roadmapId) => `milestones?roadmapId=${roadmapId}`,
      providesTags: ["Milestones"],
    }),

    completeMilestone: builder.mutation<void, { milestoneId: string; roadmapId: string }>({
      query: ({ milestoneId, roadmapId }) => ({
        url: `milestones/${milestoneId}/complete`,
        method: "POST",
        body: { roadmapId },
      }),
      invalidatesTags: ["Milestones"],
    }),

    // Daily Pins API
    getDailyPins: builder.query<DailyPinsResponse, void>({
      query: () => "daily-pins",
      providesTags: ["DailyPins"],
    }),

    pinTask: builder.mutation<PinTaskResponse, { taskId: string }>({
      query: (taskId) => ({
        url: "daily-pins",
        method: "POST",
        body: { taskId },
      }),
      invalidatesTags: ["DailyPins"],
    }),

    unpinTask: builder.mutation<void, { pinId: string }>({
      query: (pinId) => ({
        url: `daily-pins/${pinId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["DailyPins"],
    }),

    // Settings API
    getSettings: builder.query<SettingsResponse, void>({
      query: () => "settings",
      providesTags: ["Settings"],
    }),

    saveSettings: builder.mutation<
      SaveSettingsResponse,
      { name?: string; email?: string; timezone?: string; dailyStudyTargetMinutes?: number; theme?: string; currentPassword?: string; newPassword?: string }
    >({
      query: (body) => ({
        url: "settings",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Settings"],
    }),

    saveNotificationSettings: builder.mutation<void, SettingsResponse["notifications"]>({
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

    // Study Sessions API
    createStudySession: builder.mutation<void, { minutes: number }>({
      query: (minutes) => ({
        url: "study-sessions",
        method: "POST",
        body: { minutes },
      }),
      invalidatesTags: ["StudySessions"],
    }),

    getSession: builder.query<SessionResponse, void>({
      query: () => "auth/session",
      providesTags: ["Auth"],
    }),

    login: builder.mutation<{ user: SessionResponse["user"] }, { email: string; password: string }>({
      query: (body) => ({
        url: "auth/login",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),

    signup: builder.mutation<{ user: SessionResponse["user"] }, { name: string; email: string; password: string; timezone?: string }>({
      query: (body) => ({
        url: "auth/signup",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),

    logout: builder.mutation<{ success: boolean }, void>({
      query: () => ({
        url: "auth/logout",
        method: "POST",
      }),
      invalidatesTags: ["Auth"],
    }),

    // Notifications API
    getPendingNotifications: builder.query<PendingNotificationsResponse, void>({
      query: () => "notifications/pending",
      providesTags: ["Notifications"],
    }),
  }),
});

export const {
  useGetDailyTasksQuery,
  useCreateTaskMutation,
  useToggleTaskCompleteTodayMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useGetRoadmapsQuery,
  useActivateRoadmapMutation,
  useGetDailyRoadmapsQuery,
  useLinkRoadmapMutation,
  useUnlinkRoadmapMutation,
  useGetMilestonesQuery,
  useCompleteMilestoneMutation,
  useGetDailyPinsQuery,
  usePinTaskMutation,
  useUnpinTaskMutation,
  useGetSettingsQuery,
  useSaveSettingsMutation,
  useSaveNotificationSettingsMutation,
  useDismissOnboardingMutation,
  useCreateStudySessionMutation,
  useGetSessionQuery,
  useGetPendingNotificationsQuery,
  useLoginMutation,
  useSignupMutation,
  useLogoutMutation,
} = apiSlice;

export default apiSlice;