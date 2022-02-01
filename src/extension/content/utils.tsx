import {
  IN_PAGE_MENU_CONTAINER_ID,
  VIDEO_ELEMENT_CONTAINER_ID,
} from "@/common/constants";
import { PageType } from "@/common/feature/video/types";
import { getVideoElement, getVideoTitle } from "./processors/processor";

export const refreshVideoMeta = async () => {
  const pageType = globalThis.selectedProcessor.getPageType(
    globalThis.location.href
  );
  globalThis.pageType = pageType;
  globalThis.videoId = "";

  if (pageType === PageType.Video) {
    globalThis.videoElement = await getVideoElement(
      globalThis.selectedProcessor
    );
    /**
     * The captionContainerElement might not be correct when using the video's parent
     * as some sites shift the elements around before the video ends up in its final position.
     * Thus we need to update the container element later as a precaution
     */
    globalThis.captionContainerElement = globalThis.videoElement.parentElement;

    globalThis.videoName = await getVideoTitle(globalThis.selectedProcessor);
    const videoId = globalThis.selectedProcessor.getVideoId();
    const videoSource = globalThis.selectedProcessor.type;
    globalThis.videoId = videoId;
    globalThis.videoSource = videoSource;

    const extensionContainer = document.getElementById(
      VIDEO_ELEMENT_CONTAINER_ID
    );
    return extensionContainer;
  }
  return;
};

export const createInpageMenuPortalElement = () => {
  if (document.getElementById(IN_PAGE_MENU_CONTAINER_ID)) {
    return;
  }
  const videoUIRootStyle = `
    display: none;
  `;

  const videoUIElement = document.createElement("div");
  videoUIElement.id = IN_PAGE_MENU_CONTAINER_ID;
  videoUIElement.style.cssText = videoUIRootStyle;
  document.body.appendChild(videoUIElement);
};
