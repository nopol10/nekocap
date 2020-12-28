import type { RcFile } from "antd/lib/upload";
import { CaptionFileFormat, ServerResponse, TabbedType } from "@/common/types";
import type { CaptionDataContainer } from "@/common/caption-parsers/types";
import { SHORTCUT_TYPES } from "../caption-editor/types";
import type { KeySequence } from "react-hotkeys-ce";

export type RequestFreshTabData = TabbedType & {
  newVideoId?: string; // id of the video on the new page
  newVideoSource?: VideoSource;
  newPageType: PageType;
};

/**
 * Specify the values explicitly so shifting them around won't
 * destroy the entire system
 */
export enum VideoSource {
  Youtube = 0,
  TVer = 1,
  Vimeo = 2,
  NicoNico = 3,
  Bilibili = 4,
}

export type CaptionContainer = {
  id?: string; // Server id
  videoId: string;
  videoSource: VideoSource;
  creator?: string; // Creator ID
  loadedByUser: boolean; // Whether the caption is loaded by the current user of the extension
  data: CaptionDataContainer;
  languageCode?: string;
  translatedTitle?: string;
  likes?: number;
  dislikes?: number;
  userLike?: boolean;
  userDislike?: boolean;
  tags?: string[];
};

/**
 * Type of the originally loaded caption file (for those loaded from a file)
 */
export type RawCaptionData = {
  type: keyof typeof CaptionFileFormat;
  data: string;
};

export enum PageType {
  SearchResults,
  Video,
}

export type TabVideoData = {
  caption?: CaptionContainer;
  rawCaption?: RawCaptionData;
  showCaption: boolean;
  showEditorIfPossible: boolean;
  serverCaptionList?: LoadCaptionsResult[];
  renderer: CaptionRendererType;
  pageType: PageType;
  menuHidden: boolean;
};

export type VideoState = {
  tabData: {
    [tabId: number]: TabVideoData;
  };
};

export type VideoMeta = {
  id: string;
  source: VideoSource;
  name: string;
  languageCode?: string;
  creatorId?: string;
};

export type UpdateLoadedCaptionFromFile = {
  tabId: number;
  file: RcFile;
  type: string;
  content: string;
  videoId: string;
  videoSource: VideoSource;
};

export type LoadCaptions = TabbedType & {
  videoId: string;
  videoSource: VideoSource;
};

export type LoadCaptionsResult = {
  id: string;
  captionerName: string;
  languageCode: string;
  verified: boolean;
  likes: number;
  dislikes: number;
  tags: string[];
};

export type LoadSingleCaption = {
  caption: CaptionContainer;
  rawCaption?: string;
  userLike?: boolean;
  userDislike?: boolean;
};

export type LoadSingleCaptionResult = LoadSingleCaption;

export type SetContentPageType = TabbedType & {
  pageType: PageType;
};

export type SetCaption = TabbedType & {
  caption?: CaptionContainer;
  rawCaption?: RawCaptionData;
};

export type SetRawCaption = TabbedType & {
  rawCaption?: RawCaptionData;
};

export type SetCaptionLanguage = TabbedType & {
  languageCode: string;
};

export type SetShowCaption = TabbedType & {
  show: boolean;
};

export type SetShowEditorIfPossible = TabbedType & {
  show: boolean;
};

export type SetEditorShortcuts = {
  shortcutType: keyof typeof SHORTCUT_TYPES;
  shortcuts: { [id: string]: KeySequence };
};

export type SetServerCaptions = TabbedType & {
  captions: LoadCaptionsResult[];
};

export type SetRenderer = TabbedType & {
  renderer: CaptionRendererType;
};

export type SetMenuHidden = TabbedType & {
  hidden: boolean;
};

export type SubmitCaption = TabbedType & {
  languageCode: string;
  translatedTitle: string;
  hasAudioDescription: boolean;
  video: VideoMeta;
};

export type LoadServerCaption = TabbedType & {
  captionId: string;
};

export type SubmitCaptionRequest = {
  caption: CaptionContainer;
  rawCaption?: RawCaptionData;
  hasAudioDescription: boolean;
  video: VideoMeta;
};

export type VideoCaptionData = {
  [languageCode: string]: number; // Map of language code to the number of captions in it
};

/**
 * Renderer
 */
export enum CaptionRendererType {
  Default,
  AdvancedOctopus,
}

export type CaptionFields = {
  language: string;
  videoId: string;
  videoSource: string;
  data: string;
  creatorId: string;
  verified: boolean;
  likes: number;
  dislikes: number;
  tags: string[];
};

export type CaptionListFields = CaptionFields & {
  id: string;
  creatorName: string;
  videoName: string;
  videoLanguage: string;
  createdDate: number;
  updatedDate: number;
  verified: boolean;
  rejected?: boolean;
  thumbnailUrl?: string;
};

export type VideoFields = {
  name: string;
  language: string;
  source: string;
  sourceId: string;
  sourceCreatorId: string;
  captions: VideoCaptionData;
  captionCount: number;
  thumbnailUrl?: string;
};
