import { PageType, VideoSource } from "@/common/feature/video/types";
import type { Dimension } from "@/common/types";
import { delay } from "@/common/utils";
import { Processor, retrieveVideoDimensions } from "./processor";

const videoMatchingRegex =
  /(http:|https:|)\/\/(?:www.)?(vimeo.com)\/([A-Za-z0-9._%-]*)(&\S+)?/;
/**
 * Processor for Vimeo
 */
export const VimeoProcessor: Processor = {
  type: VideoSource.Vimeo,
  name: "Vimeo",
  canWatchInNekoCapSite: true,
  urlRegex: /vimeo\.com/,
  videoSelector: ".player .vp-video-wrapper video",
  videoPageUISelector: "div[data-testid='action-bar']",
  titleSelector: "main h1",
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
  globalStyles: `
    .vp-telecine {
      height: 100%;
    }
  `,
  supportAutoCaptions: () => false,
  preOpenEditorAction: async () => {
    // This is to initialize the video or it will be blank
    const playButton = document.querySelector("button[class*=PlayButton]") as
      | HTMLElement
      | undefined;
    playButton?.click();
    await delay(200);
    playButton?.click();
  },
  getVideoId: () => {
    const matches = globalThis.location.href.match(videoMatchingRegex);
    if (!matches) {
      return "";
    }
    return matches[3];
  },
  generateVideoLink: (videoId: string) => {
    return `https://vimeo.com/${videoId}`;
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
    if (url.match(videoMatchingRegex)) {
      return PageType.Video;
    }
    return PageType.SearchResults;
  },
};
