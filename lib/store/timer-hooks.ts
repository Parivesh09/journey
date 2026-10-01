import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import type { RootState, AppDispatch } from "@/lib/store";
import type { ActiveTask, TimerStatus } from "@/lib/store/slices/timer.slice";

// This hook uses AppDispatch for dispatching actions and TimerStatus for checking timer state
// Custom hook to replace useTaskTimer with Redux equivalent
export const useTaskTimer = () => {
  const dispatch: AppDispatch = useAppDispatch();
  const state = useAppSelector((state: RootState) => state.timer);

  const startTask = (task: ActiveTask) => {
    dispatch({ type: "timer/startTask", payload: { task } });
  };

  const pauseTask = () => {
    dispatch({ type: "timer/pauseTask" });
  };

  const resumeTask = () => {
    dispatch({ type: "timer/resumeTask" });
  };

  const restartTask = () => {
    dispatch({ type: "timer/restartTask" });
  };

  const completeTask = () => {
    dispatch({ type: "timer/completeTask" });
  };

  const clearTask = () => {
    dispatch({ type: "timer/clearTask" });
  };

  // For the TICK action, we'll need to set up an interval in the component
  // or we could create a middleware, but for simplicity, we'll expose the dispatch
  // and let components handle the ticking if needed
  
  const canStartTask = (taskId: string): boolean => {
    return !state.activeTask || state.activeTask.id === taskId;
  };

  const isTaskActive = (taskId: string): boolean => {
    return state.activeTask?.id === taskId && state.status !== "idle";
  };

  // Create a type-checked helper to explicitly use TimerStatus
  const checkTimerStatus = (status: TimerStatus): boolean => {
    return status !== "idle";
  };

  return {
    state,
    startTask,
    pauseTask,
    resumeTask,
    restartTask,
    completeTask,
    clearTask,
    canStartTask,
    isTaskActive,
    // We don't expose tick directly as it should be handled via setInterval in components
    // that need it, similar to how it was in the original context
  };
};