import { hydrate } from "@/web/store/action";
import { createReducer } from "@reduxjs/toolkit";
import {
  loadAllCaptions,
  loadLatestCaptions,
  loadLatestUserLanguageCaptions,
  loadPopularCaptions,
  setBrowseResults,
  setLatestCaptions,
  setLatestUserLanguageCaptions,
  setPopularCaptions,
} from "./actions";

import { PublicDashboardState } from "./types";

const initialState: PublicDashboardState = {
  latestCaptions: [],
  latestUserLanguageCaptions: [],
  popularCaptions: [],
  // Browse related fields
  browseResults: [],
  currentResultPage: 1,
  totalResults: 0,
  hasMoreResults: false,
};

export const publicDashboardReducer = createReducer<PublicDashboardState>(
  initialState,
  (builder) => {
    loadLatestCaptions.augmentReducer(builder);
    loadLatestUserLanguageCaptions.augmentReducer(builder);
    loadPopularCaptions.augmentReducer(builder);
    loadAllCaptions.augmentReducer(builder);
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
      })
      .addCase(setBrowseResults, (state, action) => {
        const {
          captions,
          currentResultPage,
          append,
          hasMoreResults,
        } = action.payload;
        return {
          ...state,
          browseResults: append
            ? [...state.browseResults, ...captions]
            : captions,
          hasMoreResults,
          currentResultPage,
        };
      })
      .addCase(hydrate, (state, action) => {
        return {
          ...state,
          ...action.payload.publicDashboard,
        };
      });
  }
);
