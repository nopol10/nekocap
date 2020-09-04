import { createReducer } from "@reduxjs/toolkit";
import {
  loadLatestCaptions,
  loadLatestUserLanguageCaptions,
  loadPopularCaptions,
  setLatestCaptions,
  setLatestUserLanguageCaptions,
  setPopularCaptions,
} from "./actions";

import { PublicDashboardState } from "./types";

const initialState: PublicDashboardState = {
  latestCaptions: [],
  latestUserLanguageCaptions: [],
  popularCaptions: [],
};

export const publicDashboardReducer = createReducer<PublicDashboardState>(
  initialState,
  (builder) => {
    loadLatestCaptions.augmentReducer(builder);
    loadLatestUserLanguageCaptions.augmentReducer(builder);
    loadPopularCaptions.augmentReducer(builder);
    return builder
      .addCase(setLatestCaptions, (state, action) => {
        const captions = action.payload;
        return {
          ...state,
          latestCaptions: captions,
        };
      })
      .addCase(setLatestUserLanguageCaptions, (state, action) => {
        const captions = action.payload;
        return {
          ...state,
          latestUserLanguageCaptions: captions,
        };
      })
      .addCase(setPopularCaptions, (state, action) => {
        const captions = action.payload;
        return {
          ...state,
          popularCaptions: captions,
        };
      });
  }
);
