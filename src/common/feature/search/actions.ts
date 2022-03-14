import { createAction } from "@reduxjs/toolkit";
import { createSignalActionInState } from "@/common/store/action";
import { searchActionTypes } from "./action-types";
import {
  LoadSearchResultVideoCaptions,
  SearchParams,
  SetSearchResultVideoCaptions,
  SetVideoSearchResults,
} from "./types";

const csa = createSignalActionInState("search");

export const search = csa<SearchParams, SetVideoSearchResults>(
  searchActionTypes.search
);

export const loadSearchResultVideoCaptions = csa<LoadSearchResultVideoCaptions>(
  searchActionTypes.loadSearchResultVideoCaptions
);

export const searchFromBasicBar = createAction<string>(
  searchActionTypes.searchFromBasicBar
);

export const setSearchResults = createAction<SetVideoSearchResults>(
  searchActionTypes.setSearchResults
);

export const setSearchNoMoreResults = createAction(
  searchActionTypes.setSearchNoMoreResults
);

export const setSearchResultVideoCaptions = createAction<
  SetSearchResultVideoCaptions
>(searchActionTypes.setSearchResultVideoCaptions);
