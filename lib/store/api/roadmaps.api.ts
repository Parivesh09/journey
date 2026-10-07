import { baseApi } from "./base-api";
import type {
  RoadmapsResponse,
  ActivateRoadmapResponse,
  DailyRoadmapsResponse,
  LinkRoadmapResponse,
  UnlinkRoadmapResponse,
  MilestoneResponse,
} from "./types/api-types";

export const roadmapsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRoadmaps: builder.query<RoadmapsResponse, void>({
      query: () => "roadmaps",
      providesTags: (result) =>
        result
          ? [
              ...result.roadmaps.map(({ id }) => ({ type: "Roadmaps" as const, id })),
              { type: "Roadmaps", id: "LIST" },
            ]
          : [{ type: "Roadmaps", id: "LIST" }],
    }),

    activateRoadmap: builder.mutation<ActivateRoadmapResponse, string>({
      query: (roadmapId) => ({
        url: "roadmaps",
        method: "POST",
        body: { roadmapId },
      }),
      invalidatesTags: [{ type: "Roadmaps", id: "LIST" }, { type: "Tasks", id: "LIST" }],
    }),

    getDailyRoadmaps: builder.query<DailyRoadmapsResponse, void>({
      query: () => "daily-roadmaps",
      providesTags: (result) =>
        result
          ? [
              ...result.linkedRoadmaps.map(({ id }) => ({ type: "DailyRoadmaps" as const, id })),
              { type: "DailyRoadmaps", id: "LIST" },
            ]
          : [{ type: "DailyRoadmaps", id: "LIST" }],
    }),

    linkRoadmap: builder.mutation<LinkRoadmapResponse, string>({
      query: (roadmapId) => ({
        url: "daily-roadmaps",
        method: "POST",
        body: { roadmapId },
      }),
      invalidatesTags: [{ type: "DailyRoadmaps", id: "LIST" }],
    }),

    unlinkRoadmap: builder.mutation<UnlinkRoadmapResponse, string>({
      query: (roadmapId) => ({
        url: "daily-roadmaps",
        method: "DELETE",
        params: { roadmapId },
      }),
      invalidatesTags: [{ type: "DailyRoadmaps", id: "LIST" }],
    }),

    getMilestones: builder.query<MilestoneResponse, string>({
      query: (roadmapId) => `milestones?roadmapId=${roadmapId}`,
      providesTags: (result, error, roadmapId) => [{ type: "Milestones", id: roadmapId }],
    }),

    completeMilestone: builder.mutation<void, { milestoneId: string; roadmapId: string }>({
      query: ({ milestoneId, roadmapId }) => ({
        url: `milestones/${milestoneId}/complete`,
        method: "POST",
        body: { roadmapId },
      }),
      invalidatesTags: (result, error, { roadmapId }) => [{ type: "Milestones", id: roadmapId }],
    }),
  }),
});

export const {
  useGetRoadmapsQuery,
  useActivateRoadmapMutation,
  useGetDailyRoadmapsQuery,
  useLinkRoadmapMutation,
  useUnlinkRoadmapMutation,
  useGetMilestonesQuery,
  useCompleteMilestoneMutation,
} = roadmapsApi;
