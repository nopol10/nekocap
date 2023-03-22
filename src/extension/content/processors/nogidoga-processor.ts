import { PageType, VideoSource } from "@/common/feature/video/types";
import type { Dimension } from "@/common/types";
import { Processor, retrieveVideoDimensions } from "./processor";

const videoMatchingRegex =
  /(http:|https:)\/\/(?:www\.)?(nogidoga\.com)\/episode\/([A-Za-z0-9._%-]*)([&\S]+)?/;
/**
 * Processor for NogiDoga
 */
export const NogiDogaProcessor: Processor = {
  type: VideoSource.NogiDoga,
  name: "NogiDoga",
  urlRegex: /nogidoga\.com/,
  videoSelector: ".VideoPlayer__Video",
  videoPageUISelector: ".EpisodePage__MainVisual",
  updateTitleOnSubmission: true,
  titleSelector: `.EpisodePage__Title`,
  editorVideoPlayerStyles: `
  .VideoPlayer__LeftControls,
  .VideoPlayer__QualitySetting,
  .VideoPlayer__Option,
  .VideoPlayer__Seek,
  .VideoPlayer__Controller {
    display: none;
  }
  `,
  globalStyles: ``,
  supportAutoCaptions: () => false,
  getVideoId: () => {
    const matches = window.location.href.match(videoMatchingRegex);
    if (!matches) {
      return "";
    }
    return matches[3];
  },
  generateVideoLink: (videoId: string) => {
    return `https://nogidoga.com/episode/${videoId}`;
  },
  generateThumbnailLink: async function () {
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
