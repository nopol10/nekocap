import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { GlobalStats, StatsState } from "./types";
import { hydrate } from "@/web/store/action";

const initialState: StatsState = {
  globalStats: {
    totalCaptions: 0,
    totalCaptionsPerLanguage: [],
    topCaptionsAllTime: [],
    topCaptionsUploadedThisMonth: [],
    totalViews: 0,
    totalViewsPerLanguage: [],
  },
};

const statsSlice = createSlice({
  initialState,
  name: "stats",
  reducers: {
    setGlobalStats(state, action: PayloadAction<GlobalStats>) {
      state.globalStats = action.payload;
    },
  },
  extraReducers(builder) {
    builder.addCase(hydrate, (state, action) => {
      return {
        ...state,
        ...action.payload.stats,
      };
    });
  },
});

export const statsReducer = statsSlice.reducer;

export const statsActions = statsSlice.actions;
