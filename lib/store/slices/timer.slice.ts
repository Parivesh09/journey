import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

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

export const timerSlice = createSlice({
  name: "timer",
  initialState,
  reducers: {
    startTask: (state, action: PayloadAction<{ task: ActiveTask }>) => {
      const durationMs = action.payload.task.plannedSeconds * 1000;
      return {
        ...state,
        activeTask: action.payload.task,
        status: "running",
        startedAt: Date.now(),
        pausedAt: null,
        elapsedMs: 0,
        remainingMs: durationMs,
        originalDurationMs: durationMs,
      };
    },
    pauseTask: (state) => {
      if (state.status !== "running" || !state.startedAt) return state;
      const now = Date.now();
      const elapsed = now - state.startedAt;
      return {
        ...state,
        status: "paused",
        pausedAt: now,
        elapsedMs: elapsed,
        remainingMs: Math.max(0, state.originalDurationMs - elapsed),
      };
    },
    resumeTask: (state) => {
      if (state.status !== "paused") return state;
      const now = Date.now();
      return {
        ...state,
        status: "running",
        startedAt: now - state.elapsedMs,
        pausedAt: null,
      };
    },
    restartTask: (state) => {
      if (!state.activeTask) return state;
      return {
        ...state,
        status: "idle",
        startedAt: null,
        pausedAt: null,
        elapsedMs: 0,
        remainingMs: state.originalDurationMs,
      };
    },
    completeTask: (state) => {
      return {
        ...state,
        status: "completed_pending",
        remainingMs: 0,
      };
    },
    clearTask: () => {
      return initialState;
    },
    tick: (state, action: PayloadAction<{ now: number }>) => {
      if (state.status !== "running" || !state.startedAt) return state;
      const elapsed = action.payload.now - state.startedAt;
      const remaining = Math.max(0, state.originalDurationMs - elapsed);
      if (remaining === 0) {
        return {
          ...state,
          status: "completed_pending",
          remainingMs: 0,
        };
      }
      return {
        ...state,
        elapsedMs: elapsed,
        remainingMs: remaining,
      };
    },
    hydrate: (state, action: PayloadAction<{ state: TimerState }>) => {
      return action.payload.state;
    },
  },
});

export const {
  startTask,
  pauseTask,
  resumeTask,
  restartTask,
  completeTask,
  clearTask,
  tick,
  hydrate,
} = timerSlice.actions;

export default timerSlice.reducer;