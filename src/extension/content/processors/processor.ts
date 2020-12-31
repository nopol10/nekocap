import { CaptionDataContainer } from "@/common/caption-parsers/types";
import { AutoCaptionLanguage } from "@/common/feature/caption-editor/types";
import { PageType, VideoSource } from "@/common/feature/video/types";
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

export interface Processor {
  type: VideoSource;
  name: string;
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
  titleSelector: string | (() => Promise<string>);
  /**
   * Styles to be applied on the video player when it is moved inside the editor
   */
  editorVideoPlayerStyles: string;
  globalStyles?: string;
  darkModeSelector?: string;
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
  onEditorOpen: () => void;
  onEditorClose: () => void;
  getPageType: (url: string) => PageType;
  waitUntilPageIsReady?: () => Promise<void>;
}
