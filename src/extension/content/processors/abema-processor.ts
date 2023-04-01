import { PageType, VideoSource } from "@/common/feature/video/types";
import type { Dimension } from "@/common/types";
import { Processor, retrieveVideoDimensions } from "./processor";

const ABEMA_URL_REGEX =
  /(http:|https:|)\/\/(abema.tv)\/((video)\/(episode)\/([A-Za-z0-9._%-]*))(&\S+)?/;
/**
 * Processor for Abema
 */
export const AbemaProcessor: Processor = {
  type: VideoSource.Abema,
  name: "Abema",
  urlRegex: /abema\.tv/,
  videoSelector: `div[class$="__video"] video:first-of-type`,
  videoPageUISelector: ".com-vod-VODRecommendedContentsContainerView__player",
  titleSelector: async () => {
    const titleElement = document.querySelector(
      ".com-video-EpisodeTitleBlock h1"
    ) as HTMLElement;
    if (!titleElement) {
      return "";
    }
    return titleElement.innerText.replace("\n", "");
  },
  globalStyles: `
  .libassjs-canvas-parent, .nekocap-cap-container {
    z-index: 1000;
  }
    
  `,
  editorVideoPlayerStyles: `
  `,
  supportAutoCaptions: () => false,
  getVideoId: () => {
    const matches = globalThis.location.href.match(ABEMA_URL_REGEX);
    if (!matches) {
      return "";
    }
    return matches[3];
  },
  generateVideoLink: (videoId: string) => {
    return `https://abema.tv/${videoId}`;
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
    if (url.match(ABEMA_URL_REGEX)) {
      return PageType.Video;
    }
    return PageType.SearchResults;
  },
};
