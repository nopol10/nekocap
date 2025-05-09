import { PageType, VideoSource } from "@/common/feature/video/types";
import type { Dimension } from "@/common/types";
import { waitForElement } from "@/common/utils";
import { Processor, retrieveVideoDimensions } from "./processor";

const videoMatchingRegex =
  /(http:|https:|)\/\/(?:www.)?(dailymotion.com)\/video\/([A-Za-z0-9._%-]*)(&\S+)?/;
const inPageIframeRegex =
  /(http:|https:|)\/\/(?:geo.)?(dailymotion.com)\/player.*/;

export const DailymotionProcessor: Processor = {
  type: VideoSource.Dailymotion,
  name: "Dailymotion",
  canWatchInNekoCapSite: true,
  urlRegex: /dailymotion\.com/,
  videoIsInIframe: true,
  disableEditor: true,
  videoSelector: async function () {
    if (this.getPageType(location.href) === PageType.VideoIframe) {
      return await waitForElement("#video", document.body);
    }
    const videoIframe = await waitForElement("#player-wrapper iframe");
    return videoIframe as unknown as HTMLVideoElement;
  },
  getCaptionContainerElement: () => {
    return globalThis.videoElement?.parentElement?.parentElement;
  },
  videoPageUISelector: "#root",
  titleSelector: "*[class*=VideoInfoTitle__titleContainer]",
  globalStyles: `
  .libassjs-canvas-parent {
    pointer-events: none;
    & canvas {
      width: 100% !important;
      z-index: 10000 !important;
    }
  }
  #nekocap-menu-container img {
    filter: contrast(0);
  }
  #nekocap-menu-container {
    position: fixed;
    bottom: 64px;
    right: 64px;
  }
  `,
  editorVideoPlayerStyles: ``,
  observer: {
    shouldObserveMenuPlaceability: false,
    shouldObserveVideoMetaUpdate: true,
    refreshTabDataAfterElementUpdate: true,
    menuElementSelector: `*[class*=VideoInfoDescription__descriptionText]`,
  },
  inlineMenu: {
    insertPosition: "after",
  },
  waitUntilPageIsReady: async () => {
    await waitForElement("*[class*=VideoInfoDescription__descriptionText]");
  },
  supportAutoCaptions: () => false,
  getVideoId: () => {
    const matches = globalThis.location.href.match(videoMatchingRegex);
    if (!matches) {
      return "";
    }
    return matches[3];
  },
  generateVideoLink: (videoId: string) => {
    return `https://www.dailymotion.com/video/${videoId}`;
  },
  generateThumbnailLink: async function (videoId: string) {
    try {
      const response = await fetch(
        `https://www.noembed.com/embed?url=${this.generateVideoLink(videoId)}`,
      );
      const data = await response.json();
      return data.thumbnail_url || "";
    } catch (e) {
      return "";
    }
  },
  retrieveVideoDimensions: async function (
    videoId: string,
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
    if (url.match(inPageIframeRegex)) {
      return PageType.VideoIframe;
    }
    if (url.match(videoMatchingRegex)) {
      return PageType.Video;
    }
    return PageType.SearchResults;
  },
};
