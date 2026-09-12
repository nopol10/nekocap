import { EDITOR_PORTAL_ELEMENT_ID } from "@/common/constants";
import { PageType, VideoSource } from "@/common/feature/video/types";
import type { Dimension } from "@/common/types";
import { waitForElement } from "@/common/utils";
import { Processor, retrieveVideoDimensions } from "./processor";

const videoMatchingRegex =
  /(http:|https:|)\/\/(?:www.)?(nicovideo.jp)\/((watch)\/([A-Za-z0-9._%-]*))(&\S+)?/;
/**
 * Processor for NicoNico
 */
export const NicoNicoProcessor: Processor = {
  type: VideoSource.NicoNico,
  name: "Niconico",
  urlRegex: /nicovideo\.jp/,
  videoSelector: '[data-name="video-content"]',
  // Not [data-name="content"] (the video's own box): it clips overflow, so a
  // menu inserted after it gets cut off. This is the unclipped player wrapper.
  videoPageUISelector: ".PlayerPresenter",
  titleSelector: async () => {
    const backupTitle = await waitForElement(`head title`);
    const actualTitle = document.querySelector<HTMLElement>(
      '[data-name="content"] h1',
    );
    if (actualTitle && actualTitle.innerText) {
      return actualTitle.innerText;
    }
    return (backupTitle as HTMLElement).innerText.replace(
      /\s*-\s*ニコニコ動画\s*$/,
      "",
    );
  },
  editorVideoPlayerStyles: `
  `,
  globalStyles: `
    div.CommonHeader {
      z-index: 4999;
    }

    #${EDITOR_PORTAL_ELEMENT_ID} svg {
      vertical-align: baseline;
    }

    /**
     * The video element has z-index: 1, so without this the captions render
     * underneath it and never appear.
     */
    .nekocap-cap-container {
      z-index: 2;
    }
  `,
  supportAutoCaptions: () => false,
  getVideoId: () => {
    const matches = globalThis.location.href.match(videoMatchingRegex);
    if (!matches) {
      return "";
    }
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
