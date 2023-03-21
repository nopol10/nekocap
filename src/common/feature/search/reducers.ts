import { hydrate } from "@/web/store/action";
import { createReducer } from "@reduxjs/toolkit";
import {
  loadSearchResultVideoCaptions,
  search,
  setNoMoreSearchResults,
  setSearchResults,
  setSearchResultVideoCaptions,
} from "./actions";
import { SearchState } from "./types";

const initialState: SearchState = {
  currentResultPage: 1,
  totalResults: 0,
  searchString: null,
  videoLanguageCode: null,
  captionLanguageCode: null,
  hasMoreResults: false,
  captions: [],
  videos: [],
};

export const searchReducer = createReducer<SearchState>(
  initialState,
  (builder) => {
    search.augmentReducer(builder);
    loadSearchResultVideoCaptions.augmentReducer(builder);
    return builder
      .addCase(setSearchResults, (state, action) => {
        const {
          searchString,
          videoLanguageCode,
          captionLanguageCode,
          videos,
          currentResultPage,
          append,
          hasMoreResults,
        } = action.payload;
        return {
          ...state,
          searchString,
          videoLanguageCode: videoLanguageCode || null,
          captionLanguageCode: captionLanguageCode || null,
          videos: append ? [...state.videos, ...videos] : videos,
          hasMoreResults,
          currentResultPage,
        };
      })
      .addCase(setNoMoreSearchResults, (state) => {
        return {
          ...state,
          hasMoreResults: false,
        };
      })
      .addCase(setSearchResultVideoCaptions, (state, action) => {
        const sortedCaptions = [...action.payload.captions];
        sortedCaptions.sort((a, b) => {
          return a.languageCode.localeCompare(b.languageCode);
        });
        return {
          ...state,
          captions: sortedCaptions,
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
