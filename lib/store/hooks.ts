import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from ".";
import { TimerState } from "./slices/timer.slice";
import { UIState } from "./slices/ui.slice";

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = <TSelected>(selector: (state: RootState) => TSelected) =>
  useSelector(selector);

// Timer hooks
export const useTimerState = () => useAppSelector((state) => state.timer as TimerState);
export const useActiveTask = () => useAppSelector((state) => state.timer.activeTask);
export const useTimerStatus = () => useAppSelector((state) => state.timer.status);

// UI hooks
export const useSidebarOpen = () => useAppSelector((state) => state.ui.sidebarOpen);
export const useActiveModal = () => useAppSelector((state) => state.ui.activeModal);
export const useModalData = () => useAppSelector((state) => state.ui.modalData);
export const useToasts = () => useAppSelector((state) => state.ui.toastQueue);
