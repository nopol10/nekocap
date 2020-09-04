import { createAction } from "@reduxjs/toolkit";
import { createSignalActionInState } from "@/common/store/action";
import { searchActionTypes } from "./action-types";
import { SearchParams, SetVideoSearchResults } from "./types";

const csa = createSignalActionInState("search");

export const search = csa<SearchParams, SetVideoSearchResults>(
  searchActionTypes.search
);

export const searchFromBasicBar = createAction<string>(
  searchActionTypes.searchFromBasicBar
);

export const setSearchResults = createAction<SetVideoSearchResults>(
  searchActionTypes.setSearchResults
);
