import { Middleware } from "@reduxjs/toolkit";
import type { RootState, AppDispatch } from "../index";
import type { AnyAction } from "redux";

const TIMER_STATE_KEY = "globalTaskTimer";

export function loadTimerState() {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(TIMER_STATE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
}

export function persistTimerState(): Middleware {
  return (store) => (next) => (action: AnyAction) => {
    const result = next(action);
    
    if (action.type?.startsWith("timer/")) {
      const state = store.getState() as RootState;
      const timerState = state.timer;
      
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(TIMER_STATE_KEY, JSON.stringify(timerState));
        } catch {}
      }
    }
    
    return result;
  };
}

export const persistTimerOnTick = () => {
  if (typeof window === "undefined") return;
  
  let tickTimer: NodeJS.Timeout | null = null;
  
  return {
    start: () => {
      if (tickTimer) clearInterval(tickTimer);
      tickTimer = setInterval(() => {
        // No-op, persistence is handled by middleware
      }, 250);
    },
    stop: () => {
      if (tickTimer) {
        clearInterval(tickTimer);
        tickTimer = null;
      }
    },
  };
};
