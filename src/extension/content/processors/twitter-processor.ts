import { PageType, VideoSource } from "@/common/feature/video/types";
import type { Dimension } from "@/common/types";
import { waitForElement } from "@/common/utils";
import { Processor, retrieveVideoDimensions } from "./processor";

const TWITTER_STATUS_REGEX = /(http:|https:)\/\/(twitter.com)\/.*\/status\/([A-Za-z0-9]*)(&\S+)?$/;

/**
 * Processor for Twitter
 */
export const TwitterProcessor: Processor = {
  type: VideoSource.Twitter,
  name: "Twitter",
  urlRegex: /twitter\.com/,
  videoSelector: async function () {
    const linkElement = await waitForElement(
      `a[href$="/status/${this.getVideoId()}"]`
    );
    console.log("Link element", linkElement);
    const videoParent =
      linkElement.parentElement?.parentElement?.parentElement?.parentElement;
    const video: HTMLVideoElement = await waitForElement("video", videoParent);
    console.log("Video element", video);
    return video;
  },
  captionContainerSelector: async function () {
    const video = await this.videoSelector();
    return video?.parentElement;
  },
  videoPageUISelector: async function () {
    const linkElement = await waitForElement(
      `a[href$="/status/${this.getVideoId()}"]`
    );
    return linkElement?.parentElement?.parentElement?.parentElement;
  },
  titleSelector: "title",
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
    const matches = window.location.href.match(TWITTER_STATUS_REGEX);
    return matches[3];
  },
  generateVideoLink: (videoId: string) => {
    return `https://twitter.com/i/web/status/${videoId}`;
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
    if (url.match(TWITTER_STATUS_REGEX)) {
      return PageType.Video;
    }
    return PageType.SearchResults;
  },
};
