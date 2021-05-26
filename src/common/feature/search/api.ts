import { Locator } from "@/common/locator/locator";
import { getLimitOffsetFromPagination } from "@/common/utils";
import { VideoFields } from "../video/types";
import { videoSourceToProcessorMap } from "../video/utils";

export async function searchCaptionsApi(title: string, pageSize, pageNumber) {
  return Locator.provider().search({
    title,
    ...getLimitOffsetFromPagination(pageSize, pageNumber),
  });
}

export async function populateVideoDetails(
  videos: VideoFields[]
): Promise<VideoFields[]> {
  const updatedCaptions = await Promise.all(
    videos.map(async (video) => {
      const processor = videoSourceToProcessorMap[parseInt(video.source)];
      if (!processor) {
        return video;
      }
      const thumbnailUrl = await processor.generateThumbnailLink(
        video.sourceId
      );
      return {
        ...video,
        thumbnailUrl,
      };
    })
  );
  return updatedCaptions;
}
