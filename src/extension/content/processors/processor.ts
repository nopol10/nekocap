import { CaptionDataContainer } from "@/common/caption-parsers/types";
import { AutoCaptionLanguage } from "@/common/feature/caption-editor/types";
import { PageType, VideoSource } from "@/common/feature/video/types";
import type { Dimension } from "@/common/types";
import { waitForElement } from "@/common/utils";

export const getUIElement = async (
  processor: Processor
): Promise<HTMLElement | undefined> => {
  if (typeof processor.videoPageUISelector === "string") {
    return waitForElement(processor.videoPageUISelector);
  }
  return processor.videoPageUISelector();
};

export const getVideoElement = async (
  processor: Processor
): Promise<HTMLVideoElement> => {
  if (typeof processor.videoSelector === "string") {
    return waitForElement(processor.videoSelector);
  }
  return processor.videoSelector();
};

export const getVideoTitle = async (processor: Processor): Promise<string> => {
  if (typeof processor.titleSelector === "string") {
    return (await waitForElement(processor.titleSelector)).innerText;
  }
  return processor.titleSelector();
};

export const isInaccurateTitle = (
  title: string,
  processor: Processor
): boolean => {
  if (!processor.inaccurateTitles) {
    return false;
  }
  return processor.inaccurateTitles.includes(title.toLowerCase());
};

export const retrieveVideoDimensions = async (
  videoId: string,
  processor: Processor,
  oEmbedUrl = "https://www.noembed.com/embed?url="
): Promise<Dimension> => {
  try {
    const link: string = processor.generateVideoLink(videoId);
    const response = await fetch(`${oEmbedUrl}${link}`);
    const data = await response.json();
    // Set default dimensions so that server -> client hydration does not break when undefined values are given
    return { width: data.width || 16, height: data.height || 9 };
  } catch (e) {
    return { width: 16, height: 9 };
  }
};

export interface Processor {
  type: VideoSource;
  name: string;
  canWatchInNekoCapSite?: boolean;
  urlRegex: RegExp;
  videoSelector: string | (() => Promise<HTMLVideoElement>);
  videoPageUISelector: string | (() => Promise<HTMLElement | undefined>);
  // Used to identify when an inaccurate title was detected. For sites where the title is not always retrievable
  // at any time. If any of the titles in this list are found, the title should be updated to the correct one.
  inaccurateTitles?: [string];
  titleSelector: string | (() => Promise<string>);
  /**
   * Styles to be applied on the video player when it is moved inside the editor
   */
  editorVideoPlayerStyles: string;
  globalStyles?: string;
  darkModeSelector?: string;
  observer?: {
    // This observes whether the menu can be added to the page
    shouldObserveMenuPlaceability: boolean;
    // This is the element that will be observed to decide when to add the menu
    menuElementSelector?: string;
    shouldObserveVideoMetaUpdate: boolean;
    // This is the element that will be observed for changes to trigger updates to the video's meta data
    videoMetaElementSelector?: string;
    refreshTabDataAfterElementUpdate: boolean;
  };
  disableEditor?: boolean;
  disableAdvancedCaptions?: boolean;
  updateTitleOnSubmission?: boolean;
  videoIsInIframe?: boolean;
  inlineMenu?: {
    insertPosition: "before" | "after";
  };
  supportAutoCaptions: (videoId: string) => boolean;
  getAutoCaptionList?: (videoId: string) => Promise<AutoCaptionLanguage[]>;
  getAutoCaption?: (
    videoId: string,
    autoCaptionId: string
  ) => Promise<CaptionDataContainer>;
  getVideoId: () => string;
  generateVideoLink: (videoId: string) => string;
  /**
   * Do not call generateThumbnailLink in the UI as it might perform fetch requests
   */
  generateThumbnailLink: (videoId: string) => Promise<string>;
  retrieveVideoDimensions: (videoId: string) => Promise<Dimension>;
  onEditorOpen: () => void;
  onEditorClose: () => void;
  getPageType: (url: string) => PageType;
  waitUntilPageIsReady?: () => Promise<void>;
}
