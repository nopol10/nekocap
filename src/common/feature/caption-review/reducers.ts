import { createReducer } from "@reduxjs/toolkit";
import {
  loadCaptionForReview,
  rejectCaption,
  setReviewData,
  setCaptionForReview,
  setCaptionerForReview,
  verifyCaption,
} from "./actions";
import { CaptionReviewState } from "./types";

const initialState: CaptionReviewState = {
  caption: null,
  reviewHistory: [],
};

export const captionReviewReducer = createReducer<CaptionReviewState>(
  initialState,
  (builder) => {
    loadCaptionForReview.augmentReducer(builder);
    rejectCaption.augmentReducer(builder);
    verifyCaption.augmentReducer(builder);
    return builder
      .addCase(setCaptionForReview, (state, action) => {
        return {
          ...state,
          caption: action.payload,
        };
      })
      .addCase(setCaptionerForReview, (state, action) => {
        return {
          ...state,
          captioner: action.payload,
        };
      })
      .addCase(setReviewData, (state, action) => {
        const {
          caption,
          videoName,
          captioner,
          rejected,
          verified,
          reviewHistory,
        } = action.payload;
        return {
          ...state,
          caption,
          captioner,
          videoName,
          rejected,
          verified,
          reviewHistory,
        };
      });
  }
);
