import { PageType, VideoSource } from "@/common/feature/video/types";
import type { Dimension } from "@/common/types";
import { waitForElement } from "@/common/utils";
import { Processor, retrieveVideoDimensions } from "./processor";

const LEMINO_VIDEO_URL_REGEX =
  /(?:https?:\/\/)(?:lemino\.)?docomo\.ne\.jp\/(?:.*)\?(?:.*)crid=(.*)/;

export const LeminoProcessor: Processor = {
  type: VideoSource.Lemino,
  name: "Lemino",
  urlRegex: /lemino\.docomo\.ne\.jp/,
  videoSelector: "video:not([title])",
  videoPageUISelector: "body > *:first-child",
  titleSelector: 'div[class*="ContentsDetailPlayerIntro__TitleStyle"]',
  editorVideoPlayerStyles: `
    margin-left: auto;
    margin-right: auto;
  `,
  globalStyles: `
    .nekocap-cap-container {
      z-index: 1000;
      width: 100%;
    }
    .nekocap-menu-container--floating {
      z-index: 11000;
    }
    .libassjs-canvas-parent {
      z-index: 100;
    }
  `,
  canWatchInNekoCapSite: false,
  disableEditor: true,
  getCaptionContainerElement: () => {
    /**
     * Setting it to the 3rd parent of the video as we are forcing relative position on the caption container.
     * Need to look into whether that is still necessary in future
     */
    return (
      (document.querySelector(LeminoProcessor.videoSelector as string)
        ?.parentElement?.parentElement?.parentElement as HTMLElement) ||
      undefined
    );
  },
  observer: {
    shouldObserveMenuPlaceability: true,
    shouldObserveVideoMetaUpdate: false,
    refreshTabDataAfterElementUpdate: false,
    menuElementSelector: "#vod_modal",
  },
  inlineMenu: {
    insertPosition: "after",
    isFloating: true,
  },
  supportAutoCaptions: () => false,
  getVideoId: () => {
    const id = new URL(globalThis.location.href)?.searchParams.get("crid");
    return id || "";
  },
  generateVideoLink: (videoId: string) => {
    return `https://lemino.docomo.ne.jp/?crid=${videoId}`;
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
    if (url.match(LEMINO_VIDEO_URL_REGEX)) {
      return PageType.Video;
    }
    return PageType.SearchResults;
  },
  waitUntilPageIsReady: async () => {
    await waitForElement(LeminoProcessor.videoSelector as string);
    /**
     * This is to prevent Lemino's video's event listener (added to window) from preventing text from being entered
     * into any of our input fields.
     */
    window.addEventListener(
      "keydown",
      (e) => {
        if (e.target instanceof HTMLInputElement) {
          e.stopImmediatePropagation();
        }
      },
      true,
    );
    return Promise.resolve();
  },
};
