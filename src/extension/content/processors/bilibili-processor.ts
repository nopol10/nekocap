import { PageType, VideoSource } from "@/common/feature/video/types";
import { waitForElement } from "@/common/utils";
import type { Processor } from "./processor";

const videoMatchingRegex = /(http:|https:|)\/\/(?:www.)?(bilibili.com)\/video\/([A-Za-z0-9._%-]*)(&\S+)?/;
/**
 * Processor for Bilibili
 */
export const BilibiliProcessor: Processor = {
  type: VideoSource.Bilibili,
  name: "bilibili",
  urlRegex: /bilibili\.com/,
  videoSelector: ".bilibili-player-video video",
  captionContainerSelector: ".bilibili-player-video",
  videoPageUISelector: ".player-wrap",
  titleSelector: ".video-title span",
  editorVideoPlayerStyles: `
  .bilibili-player-video {
    position: relative;
    width: 100%;
    height: 100%;

    video {
      position: relative;
      width: 100% !important;
      height: auto !important;
      transform: translateY(-50%);
      top: 50% !important;
      left: 0 !important;
    }
  }
  `,
  globalStyles: `
    .libassjs-canvas-parent {
      position: static !important;
    }
  `,
  supportAutoCaptions: () => false,
  getVideoId: () => {
    const matches = window.location.href.match(videoMatchingRegex);
    return matches[3];
  },
  generateVideoLink: (videoId: string) => {
    return `https://www.bilibili.com/video/${videoId}`;
  },
  generateThumbnailLink: async function (videoId: string) {
    return "";
  },
  onEditorOpen: () => {
    /* no content */
  },
  onEditorClose: () => {
    /* no content */
  },
  getPageType: (url: string) => {
    if (url.match(videoMatchingRegex)) {
      return PageType.Video;
    }
    return PageType.SearchResults;
  },
  waitUntilPageIsReady: async () => {
    // Bilibili refreshes the page content shortly after the initial load so any
    // ui elements added to the body will be removed. We have to wait for the load
    // to finish before adding stuff in
    await waitForElement(".bilibili-player-video-inputbar-wrap");
    return;
  },
};
