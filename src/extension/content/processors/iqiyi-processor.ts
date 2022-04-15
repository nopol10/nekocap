import { PageType, VideoSource } from "@/common/feature/video/types";
import type { Dimension } from "@/common/types";
import { Processor, retrieveVideoDimensions } from "./processor";

const videoMatchingRegex = /(http:|https:)\/\/(?:www\.)?(iq\.com)\/play\/([A-Za-z0-9._%-]*)([&\S]+)?/;
/**
 * Processor for iQiyi
 */
export const iQiyiProcessor: Processor = {
  type: VideoSource.iQiyi,
  name: "iQiyi",
  urlRegex: /iq\.com/,
  videoSelector: ".main-content video",
  videoPageUISelector: ".intl-play-area-inner",
  updateTitleOnSubmission: true,
  titleSelector: async () => {
    const mainTitle = (document.querySelector(
      ".intl-album-title-word-wrap > span:first-child"
    ) as HTMLElement)?.innerText;
    const episodeElement = document.querySelector(".v-li.drama.selected");
    if (!episodeElement) {
      return mainTitle;
    }
    return `${mainTitle} - ${(episodeElement as HTMLElement).innerText}`;
  },
  editorVideoPlayerStyles: `
  .iqp-player iqpdiv {
    display: none;
  }
  `,
  globalStyles: ``,
  supportAutoCaptions: () => false,
  getVideoId: () => {
    const matches = window.location.href.match(videoMatchingRegex);
    return matches[3].split("-").slice(-1)[0];
  },
  generateVideoLink: (videoId: string) => {
    return `https://www.iq.com/play/${videoId}`;
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
