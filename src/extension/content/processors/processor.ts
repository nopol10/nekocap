import { CaptionDataContainer } from "@/common/caption-parsers/types";
import { AutoCaptionLanguage } from "@/common/feature/caption-editor/types";
import { PageType, VideoSource } from "@/common/feature/video/types";
import type { Dimension } from "@/common/types";
import { waitForElement } from "@/common/utils";

export const getUIElement = async (
  processor: Processor
): Promise<HTMLElement> => {
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

export const getCaptionContainerElement = async (
  processor: Processor
): Promise<HTMLElement> => {
  if (typeof processor.captionContainerSelector === "string") {
    return waitForElement(processor.captionContainerSelector);
  }
  return processor.captionContainerSelector();
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
    return { width: data.width, height: data.height };
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
  videoPageUISelector: string | (() => Promise<HTMLElement>);
  /**
   * NO LONGER NECESSARY: This is no longer necessary and the video element's parent will be used and checks will be made
   * to update it when a caption is loaded/created to maintain its correct position.
   * The container for the caption. The parent needs to be the direct parent of the video element
   * so that the container sits beside the video element (as a sibling).
   */
  captionContainerSelector: string | (() => Promise<HTMLElement>);
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
    shouldObserve: boolean;
    refreshTabDataAfterElementUpdate: boolean;
    menuElementSelector?: string;
  };
  disableEditor?: boolean;
  updateTitleOnSubmission?: boolean;
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
