import { PageType, VideoSource } from "@/common/feature/video/types";
import type { Dimension } from "@/common/types";
import { waitForElement } from "@/common/utils";
import { Processor, retrieveVideoDimensions } from "./processor";

const videoMatchingRegex =
  /(http:|https:|)\/\/(?:www.)?(dailymotion.com)\/video\/([A-Za-z0-9._%-]*)(&\S+)?/;
const inPageIframeRegex =
  /(http:|https:|)\/\/(?:www.)?(dailymotion.com)\/embed\?.*/;

export const DailymotionProcessor: Processor = {
  type: VideoSource.Dailymotion,
  name: "Dailymotion",
  canWatchInNekoCapSite: true,
  urlRegex: /dailymotion\.com/,
  videoIsInIframe: true,
  disableEditor: true,
  videoSelector: async function () {
    if (this.getPageType(location.href) === PageType.VideoIframe) {
      return await waitForElement("#dmp_Video", document.body);
    }
    const videoIframe = await waitForElement("#player-body");
    return videoIframe as unknown as HTMLVideoElement;
  },
  videoPageUISelector: "*[class*=NewVideoInfoActions__actionButton]",
  titleSelector: "*[class*=NewVideoInfoTitle__videoTitle]",
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
  `,
  editorVideoPlayerStyles: ``,
  observer: {
    shouldObserveMenuPlaceability: true,
    shouldObserveVideoMetaUpdate: true,
    refreshTabDataAfterElementUpdate: true,
    menuElementSelector: `*[class*=VideoListSectionTitle__sectionTitleWrapper]`,
  },
  inlineMenu: {
    insertPosition: "before",
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
        `https://www.noembed.com/embed?url=${this.generateVideoLink(videoId)}`
      );
      const data = await response.json();
      return data.thumbnail_url || "";
    } catch (e) {
      return "";
    }
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
    if (url.match(inPageIframeRegex)) {
      return PageType.VideoIframe;
    }
    if (url.match(videoMatchingRegex)) {
      return PageType.Video;
    }
    return PageType.SearchResults;
  },
};
