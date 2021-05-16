import { Locator } from "@/common/locator/locator";
import { CaptionsResponse } from "../captioner/types";
import { CaptionListFields } from "../video/types";
import { videoSourceToProcessorMap } from "../video/utils";

export const populateCaptionDetails = async (
  captions: CaptionListFields[]
): Promise<CaptionListFields[]> => {
  const updatedCaptions = await Promise.all(
    captions.map(async (caption) => {
      const processor =
        videoSourceToProcessorMap[parseInt(caption.videoSource)];
      if (!processor) {
        return caption;
      }
      const thumbnailUrl = await processor.generateThumbnailLink(
        caption.videoId
      );
      return {
        ...caption,
        thumbnailUrl,
      };
    })
  );
  return updatedCaptions;
};

export const loadLatestCaptionsApi = async () => {
  const {
    captions,
    status,
    error,
  }: CaptionsResponse = await Locator.provider().loadLatestCaptions();
  if (status !== "success") {
    throw new Error(error);
  }

  const captionsWithDetails = await populateCaptionDetails(captions);

  return captionsWithDetails;
};
