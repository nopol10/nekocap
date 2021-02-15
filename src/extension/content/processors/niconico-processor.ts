import { EDITOR_PORTAL_ELEMENT_ID } from "@/common/constants";
import { PageType, VideoSource } from "@/common/feature/video/types";
import type { Dimension } from "@/common/types";
import { Processor, retrieveVideoDimensions } from "./processor";

const videoMatchingRegex = /(http:|https:|)\/\/(?:www.)?(nicovideo.jp)\/((watch)\/([A-Za-z0-9._%-]*))(&\S+)?/;
/**
 * Processor for NicoNico
 */
export const NicoNicoProcessor: Processor = {
  type: VideoSource.NicoNico,
  name: "Niconico",
  urlRegex: /nicovideo\.jp/,
  videoSelector: "#MainVideoPlayer video",
  captionContainerSelector: "#VideoPlayer",
  videoPageUISelector: ".MainContainer",
  titleSelector: ".VideoTitle",
  editorVideoPlayerStyles: `
  `,
  globalStyles: `
    div.CommonHeader {
      z-index: 4999;
    }

    #${EDITOR_PORTAL_ELEMENT_ID} svg {
      vertical-align: baseline;
    }
  `,
  supportAutoCaptions: () => false,
  getVideoId: () => {
    const matches = window.location.href.match(videoMatchingRegex);
    return matches[5];
  },
  generateVideoLink: (videoId: string) => {
    return `https://www.nicovideo.jp/watch/${videoId}`;
  },
  generateThumbnailLink: async (videoId: string) => {
    // TODO make it work
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
    if (url.match(videoMatchingRegex)) {
      return PageType.Video;
    }
    return PageType.SearchResults;
  },
};
