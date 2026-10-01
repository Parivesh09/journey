import { configureStore, type Middleware } from "@reduxjs/toolkit";
import apiSlice from "./api";
import timerReducer from "./store/slices/timer.slice";

// Middleware to automatically tick the timer when running
const timerMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);
  
  // If the action changes the status to running, start ticking
  if (
    typeof action === "object" &&
    action !== null &&
    "type" in action &&
    (action.type === "timer/startTask" || action.type === "timer/resumeTask")
  ) {
    // Store the interval ID on the store so we can clean it up later
    // @ts-expect-error: store.timerInterval is added dynamically
    if (!store.timerInterval) {
      // @ts-expect-error: store.timerInterval is added dynamically
      store.timerInterval = setInterval(() => {
        store.dispatch({ type: "timer/tick", payload: { now: Date.now() } });
      }, 250);
    }
  }
  
  // If the action changes the status to something other than running, stop ticking
  if (
    typeof action === "object" &&
    action !== null &&
    "type" in action &&
    (
      action.type === "timer/pauseTask" ||
      action.type === "timer/restartTask" ||
      action.type === "timer/completeTask" ||
      action.type === "timer/clearTask"
    )
  ) {
    // @ts-expect-error: store.timerInterval is added dynamically
    if (store.timerInterval) {
      // @ts-expect-error: store.timerInterval is added dynamically
      clearInterval(store.timerInterval);
      // @ts-expect-error: store.timerInterval is added dynamically
      store.timerInterval = null;
    }
  }
  
  return result;
};

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    timer: timerReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware, timerMiddleware),
  devTools: true,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;