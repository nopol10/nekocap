import { PageType, VideoSource } from "@/common/feature/video/types";
import type { Dimension } from "@/common/types";
import { waitForElement } from "@/common/utils";
import { Processor, retrieveVideoDimensions } from "./processor";

/**
 * Processor for Netflix
 */
export const NetflixProcessor: Processor = {
  type: VideoSource.Netflix,
  name: "Netflix",
  urlRegex: /netflix\.com/,
  videoSelector: ".watch-video video",
  captionContainerSelector: ".player-timedtext",
  videoPageUISelector: async () => {
    const controlsWrapper = await waitForElement(
      `.watch-video--bottom-controls-container button[data-uia="control-audio-subtitle"]`
    );
    if (controlsWrapper.parentElement?.parentElement) {
      return controlsWrapper.parentElement.parentElement as HTMLElement;
    }
    return controlsWrapper;
  },
  inaccurateTitles: ["netflix"],
  titleSelector: async () => {
    const backupTitle = await waitForElement(`head title`);
    const actualTitle = document.querySelector('div[data-uia="video-title"]');
    if (actualTitle) {
      return Array.from(actualTitle.children)
        .map((child) => {
          return child.textContent;
        })
        .join(" ");
    }
    return (backupTitle as HTMLElement).innerText;
  },
  editorVideoPlayerStyles: `
  video {
    width: 100% !important;
    height: auto !important;
    left: 0 !important;
  }
  `,
  observer: {
    shouldObserveMenuPlaceability: true,
    shouldObserveVideoMetaUpdate: false,
    refreshTabDataAfterElementUpdate: false,
    menuElementSelector: `.watch-video--bottom-controls-container`,
  },
  disableEditor: true,
  inlineMenu: {
    insertPosition: "before",
  },
  darkModeSelector: ".netflix-sans-font-loaded", // Netflix is always in dark mode without 3rd party modifications
  supportAutoCaptions: () => false,
  getVideoId: () => {
    const matches = window.location.href.match(
      /(http:|https:)\/\/(?:www\.)(netflix.com)\/((watch)\/([A-Za-z0-9._%-]*))(&\S+)?/
    );
    return matches[5];
  },
  generateVideoLink: (videoId: string) => {
    return `https://www.netflix.com/watch/${videoId}`;
  },
  generateThumbnailLink: async (videoId: string) => {
    return ``;
  },
  retrieveVideoDimensions: async function (
    videoId: string
  ): Promise<Dimension> {
    return await retrieveVideoDimensions(videoId, this);
  },
  onEditorOpen: () => {
    /* no content */
  },
  onEditorClose: () => {
    /* no content */
  },
  getPageType: (url: string) => {
    if (
      url.match(
        /(http:|https:)\/\/(?:www\.)(netflix.com)\/((watch)\/([A-Za-z0-9._%-]*))(&\S+)?/
      )
    ) {
      return PageType.Video;
    }
    return PageType.SearchResults;
  },
};
