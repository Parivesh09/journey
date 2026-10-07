import { baseApi } from "./base-api";
import type {
  Task,
  RoutineTask,
  TaskQueryParams,
  CreateTaskInput,
  UpdateTaskInput,
  DailyFeed,
  DailyPinsResponse,
  PinTaskResponse,
} from "./types/api-types";

export const tasksApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDailyTasks: builder.query<DailyFeed, TaskQueryParams>({
      query: ({ tab, date }) => `tasks?tab=${tab}${date ? `&date=${date}` : ""}`,
      providesTags: (result) =>
        result
          ? [
              ...result.routines.map(({ id }) => ({ type: "Tasks" as const, id })),
              { type: "Tasks", id: "LIST" },
            ]
          : [{ type: "Tasks", id: "LIST" }],
    }),

    createTask: builder.mutation<Task, CreateTaskInput>({
      query: (body) => ({
        url: "tasks",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Tasks", id: "LIST" }],
    }),

    toggleTaskCompleteToday: builder.mutation<{ task: Task; doneToday: boolean }, string>({
      query: (id) => ({ url: `tasks/${id}/complete-today`, method: "POST" }),
      invalidatesTags: (result, error, id) => [{ type: "Tasks", id }, { type: "Tasks", id: "LIST" }],
    }),

    updateTask: builder.mutation<{ task: Task }, UpdateTaskInput>({
      query: ({ id, ...body }) => ({
        url: `tasks/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Tasks", id }, { type: "Tasks", id: "LIST" }],
    }),

    deleteTask: builder.mutation<{ deleted: boolean; id: string }, string>({
      query: (id) => ({
        url: `tasks/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [{ type: "Tasks", id }, { type: "Tasks", id: "LIST" }],
    }),

    getDailyPins: builder.query<DailyPinsResponse, void>({
      query: () => "daily-pins",
      providesTags: (result) =>
        result
          ? [
              ...result.pins.map(({ id }) => ({ type: "DailyPins" as const, id })),
              { type: "DailyPins", id: "LIST" },
            ]
          : [{ type: "DailyPins", id: "LIST" }],
    }),

    pinTask: builder.mutation<PinTaskResponse, { taskId: string }>({
      query: (taskId) => ({
        url: "daily-pins",
        method: "POST",
        body: { taskId },
      }),
      invalidatesTags: [{ type: "DailyPins", id: "LIST" }, { type: "Tasks", id: "LIST" }],
    }),

    unpinTask: builder.mutation<void, { pinId: string }>({
      query: ({ pinId }) => ({
        url: `daily-pins/${pinId}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "DailyPins", id: "LIST" }, { type: "Tasks", id: "LIST" }],
    }),
  }),
});

export const {
  useGetDailyTasksQuery,
  useCreateTaskMutation,
  useToggleTaskCompleteTodayMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useGetDailyPinsQuery,
  usePinTaskMutation,
  useUnpinTaskMutation,
} = tasksApi;
