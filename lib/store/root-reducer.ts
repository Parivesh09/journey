import { combineReducers } from "@reduxjs/toolkit";
import timerReducer from "./slices/timer.slice";
import uiReducer from "./slices/ui.slice";

const rootReducer = combineReducers({
  timer: timerReducer,
  ui: uiReducer,
});

export default rootReducer;
