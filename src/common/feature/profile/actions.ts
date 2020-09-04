import { createAction } from "@reduxjs/toolkit";
import { createSignalActionInState } from "@/common/store/action";
import {
  PrivateCaptionerData,
  CaptionsPagedRequest,
  CaptionsPagedResult,
} from "../captioner/types";
import { profileActionTypes } from "./action-types";
import {
  EditProfileFields,
  LoadProfileParams,
  PublicProfileData,
} from "./types";

const csa = createSignalActionInState("profile");

export const loadUserCaptions = csa<CaptionsPagedRequest, CaptionsPagedResult>(
  profileActionTypes.loadUserCaptions
);

export const loadProfile = csa<LoadProfileParams, PublicProfileData>(
  profileActionTypes.loadProfile
);

export const updateProfile = csa<EditProfileFields, PrivateCaptionerData>(
  profileActionTypes.updateProfile
);

export const assignReviewerManager = csa<string>(
  profileActionTypes.assignReviewerManager
);

export const assignReviewer = csa<string>(profileActionTypes.assignReviewer);

export const verifyCaptioner = csa<string>(profileActionTypes.verifyCaptioner);
export const banCaptioner = csa<string>(profileActionTypes.banCaptioner);

export const setProfile = createAction<PublicProfileData>(
  profileActionTypes.setProfile
);

export const setListedCaptions = createAction<CaptionsPagedResult>(
  profileActionTypes.setListedCaptions
);
