import { baseApi } from "./base-api";
import type {
  SessionResponse,
  AuthLoginRequest,
  AuthSignupRequest,
  AuthResponse,
} from "./types/api-types";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSession: builder.query<SessionResponse, void>({
      query: () => "auth/session",
      providesTags: ["Auth"],
    }),

    login: builder.mutation<AuthResponse, AuthLoginRequest>({
      query: (body) => ({
        url: "auth/login",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth", "Users"],
    }),

    signup: builder.mutation<AuthResponse, AuthSignupRequest>({
      query: (body) => ({
        url: "auth/signup",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth", "Users"],
    }),

    logout: builder.mutation<{ success: boolean }, void>({
      query: () => ({
        url: "auth/logout",
        method: "POST",
      }),
      invalidatesTags: ["Auth", "Users"],
    }),
  }),
});

export const {
  useGetSessionQuery,
  useLoginMutation,
  useSignupMutation,
  useLogoutMutation,
} = authApi;
