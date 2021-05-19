import { hydrate } from "@/web/store/action";
import { createReducer } from "@reduxjs/toolkit";
import {
  deleteServerCaption,
  loadPrivateCaptionerData,
  loadUserCaptions,
  removeStoreCaption,
  setListedCaptions,
  setCaptionerPrivateData,
  updateCaptionerProfile,
} from "./actions";
import { CaptionerState } from "./types";

const initialState: CaptionerState = {
  currentCaptionPage: 1,
  captions: [],
};

export const captionerReducer = createReducer<CaptionerState>(
  initialState,
  (builder) => {
    loadPrivateCaptionerData.augmentReducer(builder);
    updateCaptionerProfile.augmentReducer(builder);
    loadUserCaptions.augmentReducer(builder);
    deleteServerCaption.augmentReducer(builder);
    return builder
      .addCase(setCaptionerPrivateData, (state, action) => {
        const { captions, privateProfile, captioner } = action.payload;
        return {
          ...state,
          captions,
          privateProfile,
          captioner,
        };
      })
      .addCase(setListedCaptions, (state, action) => {
        const { captions, pageNumber } = action.payload;
        return {
          ...state,
          captions,
          currentCaptionPage: pageNumber,
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
          ...action.payload.captioner,
        };
      });
  }
);
