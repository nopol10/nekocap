import { PageType, VideoSource } from "@/common/feature/video/types";
import type { Dimension } from "@/common/types";
import { Processor, retrieveVideoDimensions } from "./processor";

const TVER_URL_REGEX =
  /(http:|https:|)\/\/(tver.jp)\/((episodes?|corner|feature)\/([A-Za-z0-9._%-]*))(&\S+)?/;
/**
 * Processor for TVer.jp
 * Ads do not seem to play in the same player as the main video
 */
export const TVerProcessor: Processor = {
  type: VideoSource.TVer,
  name: "TVer",
  urlRegex: /tver\.jp/,
  videoSelector: "video.vjs-tech",
  videoPageUISelector: "div[class^=episode-info_flex]",
  titleSelector: "*[class^=titles_seriesTitle]",
  editorVideoPlayerStyles: `
  #playerWrapper {
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
  img[class^="tver-"] {
    display: none !important;
  }
  `,
  supportAutoCaptions: () => false,
  getVideoId: () => {
    const matches = window.location.href.match(TVER_URL_REGEX);
    if (!matches) {
      return "";
    }
    return matches[3];
  },
  generateVideoLink: (videoId: string) => {
    return `https://tver.jp/${videoId}`;
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
    if (url.match(TVER_URL_REGEX)) {
      return PageType.Video;
    }
    return PageType.SearchResults;
  },
};
