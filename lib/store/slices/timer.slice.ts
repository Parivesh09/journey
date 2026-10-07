import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";

export type TimerStatus = "idle" | "running" | "paused" | "completed_pending" | "completed";

export interface ActiveTask {
  id: string;
  title: string;
  description?: string | null;
  plannedSeconds: number;
  kind: "routine" | "task" | "connected" | "roadmap";
  isDailyTask: boolean;
  roadmapId?: string | null;
  phaseTitle?: string | null;
  topicTitle?: string | null;
  milestoneTitle?: string | null;
}

export interface TimerState {
  activeTask: ActiveTask | null;
  status: TimerStatus;
  startedAt: number | null;
  pausedAt: number | null;
  elapsedMs: number;
  remainingMs: number;
  originalDurationMs: number;
}

const initialState: TimerState = {
  activeTask: null,
  status: "idle",
  startedAt: null,
  pausedAt: null,
  elapsedMs: 0,
  remainingMs: 0,
  originalDurationMs: 0,
};

export const hydrateTimerState = createAsyncThunk(
  "timer/hydrate",
  async (_, { dispatch }) => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem("globalTaskTimer");
      if (!stored) return;
      const parsed: TimerState = JSON.parse(stored);
      dispatch(timerSlice.actions.hydrate(parsed));
    } catch {}
  }
);

const timerSlice = createSlice({
  name: "timer",
  initialState,
  reducers: {
    hydrate: (_, action: PayloadAction<TimerState>) => action.payload,
    
    start: (state, action: PayloadAction<ActiveTask>) => {
      const task = action.payload;
      const durationMs = task.plannedSeconds * 1000;
      state.activeTask = task;
      state.status = "running";
      state.startedAt = Date.now();
      state.pausedAt = null;
      state.elapsedMs = 0;
      state.remainingMs = durationMs;
      state.originalDurationMs = durationMs;
      if (typeof window !== "undefined") {
        localStorage.setItem("globalTaskTimer", JSON.stringify(state));
      }
    },

    pause: (state) => {
      if (state.status !== "running" || !state.startedAt) return;
      const now = Date.now();
      const elapsed = now - state.startedAt;
      state.status = "paused";
      state.pausedAt = now;
      state.elapsedMs = elapsed;
      state.remainingMs = Math.max(0, state.originalDurationMs - elapsed);
      if (typeof window !== "undefined") {
        localStorage.setItem("globalTaskTimer", JSON.stringify(state));
      }
    },

    resume: (state) => {
      if (state.status !== "paused") return;
      const now = Date.now();
      state.status = "running";
      state.startedAt = now - state.elapsedMs;
      state.pausedAt = null;
      if (typeof window !== "undefined") {
        localStorage.setItem("globalTaskTimer", JSON.stringify(state));
      }
    },

    restart: (state) => {
      if (!state.activeTask) return;
      state.status = "idle";
      state.startedAt = null;
      state.pausedAt = null;
      state.elapsedMs = 0;
      state.remainingMs = state.originalDurationMs;
      if (typeof window !== "undefined") {
        localStorage.setItem("globalTaskTimer", JSON.stringify(state));
      }
    },

    complete: (state) => {
      state.status = "completed_pending";
      state.remainingMs = 0;
      if (typeof window !== "undefined") {
        localStorage.setItem("globalTaskTimer", JSON.stringify(state));
      }
    },

    clear: () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("globalTaskTimer");
      }
      return initialState;
    },

    tick: (state, action: PayloadAction<{ now: number }>) => {
      if (state.status !== "running" || !state.startedAt) return;
      const elapsed = action.payload.now - state.startedAt;
      const remaining = Math.max(0, state.originalDurationMs - elapsed);
      if (remaining === 0) {
        state.status = "completed_pending";
        state.remainingMs = 0;
        if (typeof window !== "undefined") {
          localStorage.setItem("globalTaskTimer", JSON.stringify(state));
        }
        return;
      }
      state.elapsedMs = elapsed;
      state.remainingMs = remaining;
    },
  },
});

export const {
  start,
  pause,
  resume,
  restart,
  complete,
  clear,
  tick,
  hydrate,
} = timerSlice.actions;

export default timerSlice.reducer;

export const selectTimerState = (state: { timer: TimerState }) => state.timer;
export const selectActiveTask = (state: { timer: TimerState }) => state.timer.activeTask;
export const selectTimerStatus = (state: { timer: TimerState }) => state.timer.status;
export const selectCanStartTask = (state: { timer: TimerState }, taskId: string) => {
  return !state.timer.activeTask || state.timer.activeTask.id === taskId;
};
export const selectIsTaskActive = (state: { timer: TimerState }, taskId: string) => {
  return state.timer.activeTask?.id === taskId && state.timer.status !== "idle";
};
