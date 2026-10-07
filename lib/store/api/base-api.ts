import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseUrl = typeof window !== "undefined" ? "/api" : undefined;

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl,
    credentials: "include",
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
    "Users",
  ],
  endpoints: () => ({}),
});

export { type ApiError } from "../types/api-types";
