import {
  LoadCaptionsResult,
  LoadSingleCaptionResult,
  VideoSource,
} from "@/common/feature/video/types";

export interface ThirdPartyDatabase {
  name: string;
  loadCaptions: (
    videoId: string,
    videoSource: VideoSource
  ) => Promise<LoadCaptionsResult[]>;
  loadCaption: (captionId: string) => Promise<LoadSingleCaptionResult>;
}
