import { hydrate } from "@/web/store/action";
import { createReducer } from "@reduxjs/toolkit";
import { search, setSearchResults } from "./actions";
import { SearchState } from "./types";

const initialState: SearchState = {
  currentResultPage: 1,
  totalResults: 0,
  hasMoreResults: false,
  captions: [],
  videos: [],
};

export const searchReducer = createReducer<SearchState>(
  initialState,
  (builder) => {
    search.augmentReducer(builder);
    return builder
      .addCase(setSearchResults, (state, action) => {
        const { videos, currentResultPage, append, hasMoreResults } =
          action.payload;
        return {
          ...state,
          videos: append ? [...state.videos, ...videos] : videos,
          hasMoreResults,
          currentResultPage,
        };
      })
      .addCase(hydrate, (state, action) => {
        return {
          ...state,
          ...action.payload.search,
        };
      });
  }
);
