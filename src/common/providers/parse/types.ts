import type {
  CaptionerFields,
  CaptionerPrivateFields,
  CaptionLikesFields,
} from "@/common/feature/captioner/types";
import { PublicProfileData } from "@/common/feature/profile/types";
import type { CaptionFields, VideoFields } from "@/common/feature/video/types";
import type { ServerResponse } from "@/common/types";

export type CaptionSchema = Parse.Object & CaptionFields;
export type VideoSchema = Parse.Object & VideoFields;

export type CaptionerSchema = Parse.Object & CaptionerFields;
export type CaptionerPrivateSchema = Parse.Object & CaptionerPrivateFields;
export type CaptionLikesSchema = Parse.Object & CaptionLikesFields;

export type ServerSingleCaption = {
  caption: CaptionSchema;
  rawCaption?: string;
  rawCaptionUrl?: string;
  userLike?: boolean;
  userDislike?: boolean;
};

export type LoadSingleCaptionResponse = ServerResponse & ServerSingleCaption;

export type VideoSearchResponse = ServerResponse & {
  videos: VideoSchema[];
  hasMoreResults: boolean;
};

export type LoadCaptionForReviewResponse = ServerResponse & {
  caption: CaptionSchema;
  captioner: CaptionerFields;
  videoName: string;
};

export type PublicProfileResponse = PublicProfileData & ServerResponse;
