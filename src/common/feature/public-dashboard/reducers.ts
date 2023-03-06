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
          pageSize,
          append,
          hasMoreResults,
          totalResults,
        } = action.payload;
        let newCaptions = captions;
        if (append) {
          // Append/splice the new captions to the existing ones
          newCaptions = [...state.browseResults];
          newCaptions.splice(
            pageSize * Math.max(0, currentResultPage - 1),
            pageSize,
            ...captions
          );
        }
        return {
          ...state,
          browseResults: newCaptions,
          hasMoreResults,
          currentResultPage,
          totalResults,
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
