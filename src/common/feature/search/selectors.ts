import { RootState } from "@/common/store/types";

export const searchSelector = (state: RootState) => state.search;
export const searchVideoCaptionResultsSelector = (state: RootState) =>
  state.search.captions;
