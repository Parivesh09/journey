import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./root-reducer";
import { baseApi } from "./api/base-api";
import type { TimerState, UIState } from "./slices";

export type RootState = {
  api: ReturnType<typeof baseApi.reducer>,
  timer: TimerState;
  ui: UIState;
};

export type AppDispatch = typeof store.dispatch;
