import { PageType, VideoSource } from "@/common/feature/video/types";
import type { Dimension } from "@/common/types";
import { truncate } from "lodash";
import { Processor, retrieveVideoDimensions } from "./processor";

const PART_SEPARATOR = "/";
const videoMatchingRegex = /(http:|https:)\/\/(?:www\.)?(tiktok\.com)\/@((?:.*))\/video\/([A-Za-z0-9._%]*)(&\S+)?/;
/**
 * Processor for TikTok
 */
export const TikTokProcessor: Processor = {
  type: VideoSource.TikTok,
  name: "TikTok",
  urlRegex: /tiktok\.com/,
  videoSelector: `*[data-e2e="browse-video"] video`,
  videoPageUISelector: `*[data-e2e="browse-music"]`,
  updateTitleOnSubmission: true,
  titleSelector: async () => {
    const mainTitle =
      (document.querySelector(`*[data-e2e="browse-video-desc"]`) as HTMLElement)
        ?.innerText || "Unknown title";
    return truncate(mainTitle, { length: 80 });
  },
  editorVideoPlayerStyles: ``,
  globalStyles: `
    *[data-e2e="browse-video"] {
      position: absolute !important;
    }
  `,
  disableAdvancedCaptions: true,
  observer: {
    shouldObserveMenuPlaceability: true,
    shouldObserveVideoMetaUpdate: false,
    refreshTabDataAfterElementUpdate: false,
    menuElementSelector: `*[data-e2e="browse-video-desc"]`,
  },
  supportAutoCaptions: () => false,
  getVideoId: () => {
    const matches = window.location.href.match(videoMatchingRegex);
    return matches[3] + PART_SEPARATOR + matches[4];
  },
  generateVideoLink: (videoId: string) => {
    const userId = videoId.split(PART_SEPARATOR)[0];
    const finalId = videoId.split(PART_SEPARATOR)[1];
    return `https://www.tiktok.com/@${userId}/video/${finalId}`;
  },
  generateThumbnailLink: async function (videoId: string) {
    return "";
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
    if (url.match(videoMatchingRegex)) {
      return PageType.Video;
    }
    return PageType.SearchResults;
  },
};
