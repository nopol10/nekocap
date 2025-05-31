import { PageType, VideoSource } from "@/common/feature/video/types";
import type { Dimension } from "@/common/types";
import { Processor, retrieveVideoDimensions } from "./processor";

const INSTAGRAM_URL_REGEX =
  /(?:https?:\/\/)(?:www\.)?instagram\.com\/p\/([A-Za-z0-9_-]+)/;

/**
 * Processor for Instagram
 */
export const InstagramProcessor: Processor = {
  type: VideoSource.Instagram,
  name: "Instagram",
  urlRegex: /instagram\.com/,
  videoSelector: "main video",
  videoPageUISelector: "body > *:first-child", // Just need this to be somewhere in the body
  titleSelector: () => Promise.resolve(""), // Instagram videos have no title
  editorVideoPlayerStyles: `
    width: unset;
    margin-left: auto;
    margin-right: auto;
  `,
  inlineMenu: {
    insertPosition: "after",
    isFloating: true,
  },
  supportAutoCaptions: () => false,
  getVideoId: () => {
    const matches = globalThis.location.href.match(INSTAGRAM_URL_REGEX);
    if (!matches) {
      return "";
    }
    return matches[1];
  },
  generateVideoLink: (videoId: string) => {
    return `https://instagram.com/p/${videoId}`;
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
    if (url.match(INSTAGRAM_URL_REGEX)) {
      return PageType.Video;
    }
    return PageType.SearchResults;
  },
};
