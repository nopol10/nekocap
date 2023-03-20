import { PageType, VideoSource } from "@/common/feature/video/types";
import type { Dimension } from "@/common/types";
import { waitForElement } from "@/common/utils";
import { Processor, retrieveVideoDimensions } from "./processor";

const PART_SEPARATOR = "/";
const videoMatchingRegex =
  /(http:|https:)\/\/(?:www\.)?(wetv\.vip)(?:.*)\/play\/([A-Za-z0-9._%]*)(-.*)?\/([A-Za-z0-9._%]*)(-.*)?(&\S+)?/;
/**
 * Processor for WeTV
 */
export const WetvProcessor: Processor = {
  type: VideoSource.Wetv,
  name: "WeTV",
  urlRegex: /wetv\.vip/,
  videoSelector: ".player video",
  videoPageUISelector: ".player--playback",
  updateTitleOnSubmission: true,
  titleSelector: async () => {
    const mainTitle = (document.querySelector(".title--main") as HTMLElement)
      ?.innerText;
    const episodeElement = document.querySelector(
      ".play-video__item--selected"
    );
    if (!episodeElement) {
      return mainTitle;
    }
    return `${mainTitle} - ${(episodeElement as HTMLElement).innerText}`;
  },
  editorVideoPlayerStyles: `
  #player-wrapper {
    height: 100%;
  }
  div[data-role="wetv-ctrlbar"] {
    display: none;
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
    if (!matches) {
      return "";
    }
    return matches[3] + PART_SEPARATOR + matches[5];
  },
  generateVideoLink: (videoId: string) => {
    const finalId = videoId.split(PART_SEPARATOR).join("?p=");
    return `https://wetv.vip/play/${finalId}`;
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
