import { baseApi } from "./base-api";
import type {
  CreateStudySessionRequest,
  PendingNotificationsResponse,
} from "./types/api-types";

export const studyApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createStudySession: builder.mutation<void, CreateStudySessionRequest>({
      query: (minutes) => ({
        url: "study-sessions",
        method: "POST",
        body: { minutes },
      }),
      invalidatesTags: ["StudySessions"],
    }),

    getPendingNotifications: builder.query<PendingNotificationsResponse, void>({
      query: () => "notifications/pending",
      providesTags: ["Notifications"],
    }),
  }),
});

export const {
  useCreateStudySessionMutation,
  useGetPendingNotificationsQuery,
} = studyApi;
