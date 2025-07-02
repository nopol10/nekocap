import { PageType, VideoSource } from "@/common/feature/video/types";
import type { Dimension } from "@/common/types";
import { Processor, retrieveVideoDimensions } from "./processor";

const ONED_VIDEO_URL_REGEX =
  /(?:https?:\/\/)(?:.*)?\.?oned\.net\/video\/([a-zA-Z0-9]*)\??(?:.*)/;

export const OneDProcessor: Processor = {
  type: VideoSource.OneD,
  name: "OneD",
  urlRegex: /oned\.net/,
  videoSelector: "video",
  videoPageUISelector: "body > *:first-child",
  titleSelector: ".About-description",
  editorVideoPlayerStyles: `
    video-js {
      width: 100%;
      height: 100%;
    }
  `,
  globalStyles: ``,
  canWatchInNekoCapSite: false,
  disableEditor: false,
  inlineMenu: {
    insertPosition: "after",
    isFloating: true,
  },
  supportAutoCaptions: () => false,
  getVideoId: () => {
    const matches = globalThis.location.href.match(ONED_VIDEO_URL_REGEX);
    if (!matches) {
      return "";
    }
    return matches[1];
  },
  generateVideoLink: (videoId: string) => {
    return `https://www.oned.net/video/${videoId}`;
  },
  generateThumbnailLink: async (_: string) => {
    return ``;
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
    if (url.match(ONED_VIDEO_URL_REGEX)) {
      return PageType.Video;
    }
    return PageType.SearchResults;
  },
};
