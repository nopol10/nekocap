import { PageType, VideoSource } from "@/common/feature/video/types";
import type { Dimension } from "@/common/types";
import { Processor, retrieveVideoDimensions } from "./processor";

const TBS_FREE_URL_REGEX =
  /(http:|https:|)\/\/(cu.tbs.co.jp)\/((episode)\/([A-Za-z0-9._%-]*))(&\S+)?/;
/**
 * Processor for TBS Free
 */
export const TBSFreeProcessor: Processor = {
  type: VideoSource.TBSFree,
  name: "TBSFree",
  urlRegex: /cu\.tbs\.co\.jp/,
  videoSelector: "video.vjs-tech",
  videoPageUISelector: "*[class^=watch-info_meta] h3",
  titleSelector: "*[class^=watch-info_meta] h3",
  canWatchInNekoCapSite: false,
  darkModeSelector: `#appMountPoint`,
  editorVideoPlayerStyles: `
  .video-js {
    width: 100% !important;
    height: 100% !important;
  }

  video {
    width: 100% !important;
    height: auto !important;
    transform: translateY(-50%);
    top: 50% !important;
    left: 0 !important;
  }
  `,
  supportAutoCaptions: () => false,
  getVideoId: () => {
    const matches = globalThis.location.href.match(TBS_FREE_URL_REGEX);
    if (!matches) {
      return "";
    }
    return matches[5];
  },
  generateVideoLink: (videoId: string) => {
    return `https://cu.tbs.co.jp/episode/${videoId}`;
  },
  generateThumbnailLink: async (videoId: string) => {
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
    if (url.match(TBS_FREE_URL_REGEX)) {
      return PageType.Video;
    }
    return PageType.SearchResults;
  },
};
