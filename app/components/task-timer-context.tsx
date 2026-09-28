"use client";

import { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from "react";

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

type TimerAction =
  | { type: "START"; task: ActiveTask }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "RESTART" }
  | { type: "COMPLETE" }
  | { type: "CLEAR" }
  | { type: "TICK"; now: number }
  | { type: "HYDRATE"; state: TimerState };

const initialState: TimerState = {
  activeTask: null,
  status: "idle",
  startedAt: null,
  pausedAt: null,
  elapsedMs: 0,
  remainingMs: 0,
  originalDurationMs: 0,
};

function timerReducer(state: TimerState, action: TimerAction): TimerState {
  switch (action.type) {
    case "START": {
      const durationMs = action.task.plannedSeconds * 1000;
      return {
        ...state,
        activeTask: action.task,
        status: "running",
        startedAt: Date.now(),
        pausedAt: null,
        elapsedMs: 0,
        remainingMs: durationMs,
        originalDurationMs: durationMs,
      };
    }
    case "PAUSE": {
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
    }
    case "RESUME": {
      if (state.status !== "paused") return state;
      const now = Date.now();
      return {
        ...state,
        status: "running",
        startedAt: now - state.elapsedMs,
        pausedAt: null,
      };
    }
    case "RESTART": {
      if (!state.activeTask) return state;
      return {
        ...state,
        status: "idle",
        startedAt: null,
        pausedAt: null,
        elapsedMs: 0,
        remainingMs: state.originalDurationMs,
      };
    }
    case "COMPLETE": {
      return {
        ...state,
        status: "completed_pending",
        remainingMs: 0,
      };
    }
    case "CLEAR": {
      return initialState;
    }
    case "TICK": {
      if (state.status !== "running" || !state.startedAt) return state;
      const elapsed = action.now - state.startedAt;
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
    }
    case "HYDRATE": {
      return action.state;
    }
    default:
      return state;
  }
}

interface TimerContextValue {
  state: TimerState;
  startTask: (task: ActiveTask) => void;
  pauseTask: () => void;
  resumeTask: () => void;
  restartTask: () => void;
  completeTask: () => void;
  clearTask: () => void;
  canStartTask: (taskId: string) => boolean;
  isTaskActive: (taskId: string) => boolean;
}

const TimerContext = createContext<TimerContextValue | null>(null);

export function TaskTimerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(timerReducer, initialState, (saved) => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("globalTaskTimer");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.activeTask && parsed.status === "running" && parsed.startedAt) {
            const now = Date.now();
            const elapsed = parsed.elapsedMs + (now - parsed.startedAt);
            const remaining = Math.max(0, parsed.originalDurationMs - elapsed);
            if (remaining === 0) {
              return {
                ...parsed,
                status: "completed_pending",
                remainingMs: 0,
                startedAt: null,
              };
            }
            return {
              ...parsed,
              startedAt: now,
              elapsedMs: elapsed,
              remainingMs: remaining,
            };
          }
          if (parsed.status === "paused" && parsed.pausedAt) {
            return {
              ...parsed,
              remainingMs: Math.max(0, parsed.originalDurationMs - parsed.elapsedMs),
            };
          }
          return parsed;
        }
      } catch {}
    }
    return initialState;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("globalTaskTimer");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        dispatch({ type: "HYDRATE", state: parsed });
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("globalTaskTimer", JSON.stringify(state));
    }
  }, [state]);

  useEffect(() => {
    if (state.status !== "running") return;
    const interval = setInterval(() => {
      dispatch({ type: "TICK", now: Date.now() });
    }, 200);
    return () => clearInterval(interval);
  }, [state.status]);

  const startTask = useCallback((task: ActiveTask) => {
    dispatch({ type: "START", task });
  }, []);

  const pauseTask = useCallback(() => {
    dispatch({ type: "PAUSE" });
  }, []);

  const resumeTask = useCallback(() => {
    dispatch({ type: "RESUME" });
  }, []);

  const restartTask = useCallback(() => {
    dispatch({ type: "RESTART" });
  }, []);

  const completeTask = useCallback(() => {
    dispatch({ type: "COMPLETE" });
  }, []);

  const clearTask = useCallback(() => {
    dispatch({ type: "CLEAR" });
  }, []);

  const canStartTask = useCallback((taskId: string) => {
    return !state.activeTask || state.activeTask.id === taskId;
  }, [state.activeTask]);

  const isTaskActive = useCallback((taskId: string) => {
    return state.activeTask?.id === taskId && state.status !== "idle";
  }, [state.activeTask, state.status]);

  return (
    <TimerContext.Provider
      value={{
        state,
        startTask,
        pauseTask,
        resumeTask,
        restartTask,
        completeTask,
        clearTask,
        canStartTask,
        isTaskActive,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTaskTimer() {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error("useTaskTimer must be used within a TaskTimerProvider");
  }
  return context;
}