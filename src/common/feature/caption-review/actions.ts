import { createAction } from "@reduxjs/toolkit";
import { createSignalActionInState } from "@/common/store/action";
import { CaptionerFields } from "../captioner/types";
import { CaptionContainer } from "../video/types";
import { captionReviewActionTypes } from "./action-types";
import { LoadCaptionForReviewResult, ReasonedCaptionAction } from "./types";

const csa = createSignalActionInState("profile");

export const loadCaptionForReview = csa<string, LoadCaptionForReviewResult>(
  captionReviewActionTypes.loadCaptionForReview
);

export const rejectCaption = csa<ReasonedCaptionAction>(
  captionReviewActionTypes.rejectCaption
);

export const verifyCaption = csa<ReasonedCaptionAction>(
  captionReviewActionTypes.verifyCaption
);

export const setCaptionForReview = createAction<CaptionContainer>(
  captionReviewActionTypes.setCaptionForReview
);

export const setCaptionerForReview = createAction<CaptionerFields>(
  captionReviewActionTypes.setCaptionerForReview
);

export const setReviewData = createAction<LoadCaptionForReviewResult>(
  captionReviewActionTypes.setReviewData
);
