import { PageType, VideoSource } from "@/common/feature/video/types";
import type { Dimension } from "@/common/types";
import { Processor, retrieveVideoDimensions } from "./processor";

const UNEXT_URL_REGEX =
  /(?:https?:\/\/)(?:video\.)?unext\.jp\/play\/([/A-Za-z0-9_-]+)/;

/**
 * Processor for UNEXT
 */
export const UNEXTProcessor: Processor = {
  type: VideoSource.UNEXT,
  name: "UNEXT",
  urlRegex: /video\.unext\.jp/,
  videoSelector: "body video",
  videoPageUISelector: `*[class*="ResponsiveButtonContainer__Container"] *[class*="NextPlayableButton__Wrapper"]`, // Just need this to be somewhere in the body
  titleSelector: `*[class*="styles__TitleContainer"]`,
  editorVideoPlayerStyles: `
    width: unset;
    margin-left: auto;
    margin-right: auto;
  `,
  observer: {
    shouldObserveMenuPlaceability: true,
    shouldObserveVideoMetaUpdate: false,
    refreshTabDataAfterElementUpdate: false,
    menuElementSelector: `*[class*="ResponsiveButtonContainer__Container"] button[data-testid="player-next-episode"]`,
  },
  inlineMenu: {
    insertPosition: "after",
    isFloating: false,
  },
  supportAutoCaptions: () => false,
  getVideoId: () => {
    const matches = globalThis.location.href.match(UNEXT_URL_REGEX);
    if (!matches) {
      return "";
    }
    return matches[1];
  },
  generateVideoLink: (videoId: string) => {
    return `https://video.unext.jp/play/${videoId}`;
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
    if (url.match(UNEXT_URL_REGEX)) {
      return PageType.Video;
    }
    return PageType.SearchResults;
  },
};
