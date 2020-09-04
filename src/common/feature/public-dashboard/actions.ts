import { createAction } from "@reduxjs/toolkit";
import { createSignalActionInState } from "@/common/store/action";
import { CaptionListFields } from "../video/types";
import { publicDashboardActionTypes } from "./action-types";

const csa = createSignalActionInState("publicDashboard");

export const loadLatestCaptions = csa<void, CaptionListFields[]>(
  publicDashboardActionTypes.loadLatestCaptions
);

export const loadLatestUserLanguageCaptions = csa<string, CaptionListFields[]>(
  publicDashboardActionTypes.loadLatestUserLanguageCaptions
);

export const loadPopularCaptions = csa<void, CaptionListFields[]>(
  publicDashboardActionTypes.loadPopularCaptions
);

export const setLatestCaptions = createAction<CaptionListFields[]>(
  publicDashboardActionTypes.setLatestCaptions
);

export const setLatestUserLanguageCaptions = createAction<CaptionListFields[]>(
  publicDashboardActionTypes.setLatestUserLanguageCaptions
);

export const setPopularCaptions = createAction<CaptionListFields[]>(
  publicDashboardActionTypes.setPopularCaptions
);
