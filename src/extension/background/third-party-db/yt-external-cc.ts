import type {
  LoadCaptionsResult,
  LoadSingleCaptionResult,
} from "@/common/feature/video/types";
import { VideoSource } from "@/common/feature/video/types";
import type { ThirdPartyDatabase } from "./third-party-database";

export const YoutubeExternalCC: ThirdPartyDatabase = {
  name: "YouTube External CC",
  loadCaptions: async function (
    videoId: string,
    videoSource: VideoSource
  ): Promise<LoadCaptionsResult[]> {
    return [];
  },

  loadCaption: async (captionId: string): Promise<LoadSingleCaptionResult> => {
    return null;
  },
};
