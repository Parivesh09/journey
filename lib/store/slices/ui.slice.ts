import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface UIState {
  sidebarOpen: boolean;
  activeModal: string | null;
  modalData: Record<string, unknown>;
  toastQueue: Array<{
    id: string;
    type: "success" | "error" | "info" | "warning";
    message: string;
    title?: string;
  }>;
}

const initialState: UIState = {
  sidebarOpen: false,
  activeModal: null,
  modalData: {},
  toastQueue: [],
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    openModal: (state, action: PayloadAction<{ modalId: string; data?: Record<string, unknown> }>) => {
      state.activeModal = action.payload.modalId;
      state.modalData = action.payload.data || {};
    },
    closeModal: (state) => {
      state.activeModal = null;
      state.modalData = {};
    },
    setModalData: (state, action: PayloadAction<Record<string, unknown>>) => {
      state.modalData = action.payload;
    },
    addToast: (state, action: PayloadAction<{ id: string; type: "success" | "error" | "info" | "warning"; message: string; title?: string }>) => {
      state.toastQueue.push(action.payload);
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toastQueue = state.toastQueue.filter((toast) => toast.id !== action.payload);
    },
    clearToasts: (state) => {
      state.toastQueue = [];
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  openModal,
  closeModal,
  setModalData,
  addToast,
  removeToast,
  clearToasts,
} = uiSlice.actions;

export default uiSlice.reducer;

export const selectSidebarOpen = (state: { ui: UIState }) => state.ui.sidebarOpen;
export const selectActiveModal = (state: { ui: UIState }) => state.ui.activeModal;
export const selectModalData = (state: { ui: UIState }) => state.ui.modalData;
export const selectToasts = (state: { ui: UIState }) => state.ui.toastQueue;
