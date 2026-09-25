import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

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
    getDailyTasks: builder.query<
      { tab: string; routines: any; connected: any },
      string
    >({
      query: (tab) => `tasks?tab=${tab}`,
      providesTags: ["Tasks"],
    }),

    createTask: builder.mutation<
      { task: any },
      { title: string; priority?: string; isPersonalDaily?: boolean }
    >({
      query: (body) => ({
        url: "tasks",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Tasks"],
    }),

    toggleTaskCompleteToday: builder.mutation<
      { task: any; doneToday: boolean },
      string
    >({
      query: (id) => `tasks/${id}/complete-today`,
      invalidatesTags: ["Tasks"],
    }),

    updateTask: builder.mutation<
      { task: any },
      { id: string; title?: string; description?: string; status?: string; priority?: string; categoryId?: string; estimatedMinutes?: number; plannedMinutes?: number; dueDate?: string; dailySlot?: string; completed?: boolean }
    >({
      query: ({ id, ...body }) => ({
        url: `tasks/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Tasks"],
    }),

    deleteTask: builder.mutation<
      { deleted: boolean; id: string },
      string
    >({
      query: (id) => ({
        url: `tasks/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Tasks"],
    }),

    // Roadmaps API
    getRoadmaps: builder.query<{ roadmaps: any }, void>({
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
    getDailyRoadmaps: builder.query<{ linkedRoadmaps: any }, void>({
      query: () => "daily-roadmaps",
      providesTags: ["DailyRoadmaps"],
    }),

    linkRoadmap: builder.mutation<
      { message: string; linked: boolean; userDailyRoadmap: any },
      string
    >({
      query: (roadmapId) => ({
        url: "daily-roadmaps",
        method: "POST",
        body: { roadmapId },
      }),
      invalidatesTags: ["DailyRoadmaps"],
    }),

    unlinkRoadmap: builder.mutation<
      { message: string; linked: boolean },
      string
    >({
      query: (roadmapId) => ({
        url: "daily-roadmaps",
        method: "DELETE",
        params: { roadmapId },
      }),
      invalidatesTags: ["DailyRoadmaps"],
    }),

    // Milestones API
    getMilestones: builder.query<
      { data: any; pinnedTaskIds: string[] },
      string
    >({
      query: (roadmapId) => `milestones?roadmapId=${roadmapId}`,
      providesTags: ["Milestones"],
    }),

    completeMilestone: builder.mutation<
      void,
      { milestoneId: string; roadmapId: string }
    >({
      query: ({ milestoneId, roadmapId }) => ({
        url: `milestones/${milestoneId}/complete`,
        method: "POST",
        body: { roadmapId },
      }),
      invalidatesTags: ["Milestones"],
    }),

    // Daily Pins API
    getDailyPins: builder.query<{ pins: any }, void>({
      query: () => "daily-pins",
      providesTags: ["DailyPins"],
    }),

    pinTask: builder.mutation<
      { pin: any },
      { taskId: string }
    >({
      query: (taskId) => ({
        url: "daily-pins",
        method: "POST",
        body: { taskId },
      }),
      invalidatesTags: ["DailyPins"],
    }),

    unpinTask: builder.mutation<
      void,
      { pinId: string }
    >({
      query: (pinId) => ({
        url: `daily-pins/${pinId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["DailyPins"],
    }),

    // Settings API
    getSettings: builder.query<
      { user: any; notifications: any },
      void
    >({
      query: () => "settings",
      providesTags: ["Settings"],
    }),

    saveSettings: builder.mutation<
      { user: any },
      { name?: string; email?: string; timezone?: string; dailyStudyTargetMinutes?: number; theme?: string; currentPassword?: string; newPassword?: string }
    >({
      query: (body) => ({
        url: "settings",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Settings"],
    }),

    saveNotificationSettings: builder.mutation<
      void,
      any
    >({
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
    createStudySession: builder.mutation<
      void,
      { minutes: number }
    >({
      query: (minutes) => ({
        url: "study-sessions",
        method: "POST",
        body: { minutes },
      }),
      invalidatesTags: ["StudySessions"],
    }),

    getSession: builder.query<any, void>({
      query: () => "auth/session",
      providesTags: ["Auth"],
    }),

    login: builder.mutation<{ user?: any }, { email: string; password: string }>({
      query: (body) => ({
        url: "auth/login",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),

    signup: builder.mutation<{ user?: any }, { name: string; email: string; password: string; timezone?: string }>({
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
    getPendingNotifications: builder.query<
      { reminders: any[] },
      void
    >({
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