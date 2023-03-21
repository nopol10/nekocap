import { CaptionerFields } from "../captioner/types";
import { CaptionContainer } from "../video/types";

export type CaptionReviewState = {
  caption: CaptionContainer | null;
  captioner?: CaptionerFields;
  videoName?: string;
  verified?: boolean;
  rejected?: boolean;
  reviewHistory: ReviewActionDetails[];
};

export type ReasonedCaptionAction = {
  captionId: string;
  reason?: string;
};

export type LoadCaptionForReviewResult = {
  caption: CaptionContainer;
  captioner: CaptionerFields;
  videoName: string;
  verified: boolean;
  rejected: boolean;
  reviewHistory: ReviewActionDetails[];
};

export type ReviewStatus =
  | "rejected"
  | "unrejected"
  | "verified"
  | "unverified";

export type ReviewActionDetails = {
  reviewerId: string;
  reviewerName: string;
  newState: ReviewStatus;
  reason?: string;
  date: number;
};
