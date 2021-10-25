import { VIDEO_ELEMENT_CONTAINER_ID } from "@/common/constants";
import { PageType } from "@/common/feature/video/types";
import { getVideoElement, getVideoTitle } from "./processors/processor";

export const refreshVideoMeta = async () => {
  const pageType = window.selectedProcessor.getPageType(window.location.href);
  window.pageType = pageType;
  window.videoId = "";

  if (pageType === PageType.Video) {
    window.videoElement = await getVideoElement(window.selectedProcessor);
    /**
     * The captionContainerElement might not be correct when using the video's parent
     * as some sites shift the elements around before the video ends up in its final position.
     * Thus we need to update the container element later as a precaution
     */
    window.captionContainerElement = window.videoElement.parentElement;

    window.videoName = await getVideoTitle(window.selectedProcessor);
    const videoId = window.selectedProcessor.getVideoId();
    const videoSource = window.selectedProcessor.type;
    window.videoId = videoId;
    window.videoSource = videoSource;

    const extensionContainer = document.getElementById(
      VIDEO_ELEMENT_CONTAINER_ID
    );
    return extensionContainer;
  }
  return;
};
