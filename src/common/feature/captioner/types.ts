import { OffsetRequest, PagedType, ServerResponse } from "@/common/types";
import { CaptionListFields } from "../video/types";

// For all captioner (logged in user) related data
export type CaptionerState = {
  captions: CaptionListFields[];
  currentCaptionPage: number;
  captioner?: CaptionerFields;
  privateProfile?: CaptionerPrivateFields;
  hasMore: boolean;
};

export type PrivateCaptionerData = {
  captions?: CaptionListFields[];
  captioner?: CaptionerFields;
  privateProfile?: CaptionerPrivateFields;
};

export type LoadPrivateCaptionerDataRequestParams = {
  withCaptions?: boolean;
};

export type UpdateCaptionerProfileParams = {
  name: string;
  email?: string;
  donationLink?: string;
  profileMessage?: string;
  languageCodes: string[];
  userId?: string; // Target captioner's user id. If not specified, will update the requester's profile
};

export type LoadPrivateCaptionerDataResponse = ServerResponse &
  PrivateCaptionerData;

export type CaptionsResponse = ServerResponse & {
  captions: CaptionListFields[];
  hasMore: boolean;
};

export type CaptionsPagedRequest = PagedType & {
  captionerId: string;
  tags?: string[];
};

export type CaptionsPagedResult = PagedType & {
  captions: CaptionListFields[];
  hasMore: boolean;
};

export type CaptionsRequest = OffsetRequest & {
  captionerId: string;
  tags?: string[];
};

export type RoleRequest = {
  targetUserId: string;
};

export type VerifyRequest = RoleRequest;
export type BanRequest = VerifyRequest;

//#region Backend schema
export type CaptionerFields = {
  userId: string;
  name: string;
  nameTag: number;
  recs: number;
  languageCodes: string[];
  verified: boolean;
  banned: boolean;
  lastSubmissionTime: number; // Unix timestamp in milliseconds of the last caption submission
  profileMessage: string;
  donationLink: string;
  captionCount: number;
  isReviewer: boolean;
  isReviewerManager: boolean;
  isAdmin: boolean;
  captionTags?: string[];
};

export type CaptionerPrivateFields = {
  email?: string; // Email was stored during early development, now removed as it is not really necessary
  isReviewer: boolean;
  isReviewerManager: boolean;
  isAdmin: boolean;
};

export type CaptionLikesFields = {
  userId: string;
  likes: string[];
  dislikes: string[];
};

//#endregion
