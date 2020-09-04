import { PageType, VideoSource } from "@/common/feature/video/types";
import type { Processor } from "./processor";

const videoMatchingRegex = /(http:|https:|)\/\/(?:www.)?(vimeo.com)\/([A-Za-z0-9._%-]*)(\&\S+)?/;
/**
 * Processor for Vimeo
 */
export const VimeoProcessor: Processor = {
  type: VideoSource.Vimeo,
  name: "Vimeo",
  urlRegex: /vimeo\.com/,
  videoSelector: ".vp-video-wrapper video",
  captionContainerSelector: ".vp-telecine",
  videoPageUISelector: "main h1",
  titleSelector: "main h1 > span:first-child",
  editorVideoPlayerStyles: `
  .vp-telecine {
    height: 100%;
  }
  video {
    width: 100%;
    height: auto !important;
    transform: translateY(-50%);
    top: 50% !important;
    left: 0 !important;
    position: absolute;
  }
  `,
  getVideoId: () => {
    const matches = window.location.href.match(videoMatchingRegex);
    return matches[3];
  },
  generateVideoLink: (videoId: string) => {
    return `https://vimeo.com/${videoId}`;
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
  clearHotkeys: () => {},
  restoreHotkeys: () => {},
  getPageType: (url: string) => {
    if (url.match(videoMatchingRegex)) {
      return PageType.Video;
    }
    return PageType.SearchResults;
  },
};
