import { hydrate } from "@/web/store/action";
import { createReducer } from "@reduxjs/toolkit";
import { removeStoreCaption } from "../captioner/actions";
import {
  assignReviewer,
  assignReviewerManager,
  loadProfile,
  loadUserCaptions,
  setListedCaptions,
  setProfile,
  updateProfile,
} from "./actions";
import { ProfileState } from "./types";

const initialState: ProfileState = {
  currentCaptionPage: 1,
  captioner: null,
  captions: [],
  hasMore: false,
};

export const profileReducer = createReducer<ProfileState>(
  initialState,
  (builder) => {
    loadProfile.augmentReducer(builder);
    loadUserCaptions.augmentReducer(builder);
    updateProfile.augmentReducer(builder);
    assignReviewer.augmentReducer(builder);
    assignReviewerManager.augmentReducer(builder);
    return builder
      .addCase(setProfile, (state, action) => {
        const { captioner, captions } = action.payload;
        return {
          ...state,
          captions: captions || [],
          captioner,
        };
      })
      .addCase(setListedCaptions, (state, action) => {
        const { captions, pageNumber, hasMore } = action.payload;
        return {
          ...state,
          captions,
          currentCaptionPage: pageNumber,
          hasMore,
        };
      })
      .addCase(removeStoreCaption, (state, action) => {
        const captionId = action.payload;
        return {
          ...state,
          captions: state.captions
            ? state.captions.filter((sub) => sub.id !== captionId)
            : [],
        };
      })
      .addCase(hydrate, (state, action) => {
        return {
          ...state,
          ...action.payload.profile,
        };
      });
  }
);
