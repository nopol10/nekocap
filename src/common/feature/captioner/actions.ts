import { createAction } from "@reduxjs/toolkit";
import { createSignalActionInState } from "@/common/store/action";
import { captionerActionTypes } from "./action-types";
import {
  LoadPrivateCaptionerDataRequestParams,
  PrivateCaptionerData,
  CaptionsPagedRequest,
  CaptionsPagedResult,
  UpdateCaptionerProfileParams,
} from "./types";

const csa = createSignalActionInState("captioner");

export const loadUserCaptions = csa<CaptionsPagedRequest, CaptionsPagedResult>(
  captionerActionTypes.loadUserCaptions
);

export const loadPrivateCaptionerData = csa<
  LoadPrivateCaptionerDataRequestParams,
  PrivateCaptionerData
>(captionerActionTypes.loadPrivateCaptionerData);

export const updateCaptionerProfile = csa<
  UpdateCaptionerProfileParams,
  PrivateCaptionerData
>(captionerActionTypes.updateCaptionerProfile);

export const deleteServerCaption = csa<string>(
  captionerActionTypes.deleteServerCaption
);

export const setCaptionerPrivateData = createAction<
  Required<PrivateCaptionerData>
>(captionerActionTypes.setCaptionerPrivateData);

export const setListedCaptions = createAction<CaptionsPagedResult>(
  captionerActionTypes.setListedCaptions
);

export const removeStoreCaption = createAction<string>(
  captionerActionTypes.removeStoreCaption
);
