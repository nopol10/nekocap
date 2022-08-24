import type { RcFile } from "antd/lib/upload";
import { CaptionFileFormat, Dimension, TabbedType } from "@/common/types";
import type { CaptionDataContainer } from "@/common/caption-parsers/types";
import { SHORTCUT_TYPES } from "../caption-editor/types";
import type { KeySequence } from "react-hotkeys-ce";

export type RequestFreshTabData = TabbedType & {
  newVideoId?: string; // id of the video on the new page
  newVideoSource?: VideoSource;
  newCaptionId?: string; // will be present if a caption should be automatically loaded
  newPageType: PageType;
  currentUrl: string;
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
  BilibiliBangumi = 5,
  Netflix = 6,
  AmazonPrime = 7,
  Twitter = 8,
  Wetv = 9,
  TikTok = 10,
  iQiyi = 11,
  NogiDoga = 12,
  Abema = 13,
  Dailymotion = 14,
  BilibiliTV = 15,
}

export type CaptionContainer = {
  id?: string; // Server id
  videoId: string;
  videoSource: VideoSource;
  creator?: string; // Creator ID
  creatorName?: string; // Creator Name
  loadedByUser: boolean; // Whether the caption is loaded by the current user of the extension
  data: CaptionDataContainer;
  languageCode?: string;
  translatedTitle?: string;
  originalTitle?: string;
  likes?: number;
  dislikes?: number;
  userLike?: boolean;
  userDislike?: boolean;
  tags?: string[];
  modifiedTime?: number; // This is used to trigger a refresh when loading raw captions consecutively since they are not stored in the redux store
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
  VideoIframe,
}

export type VideoPlayerPreferences = {
  fontSizeMultiplier: number;
};

export type TabVideoData = {
  caption?: CaptionContainer;
  showCaption: boolean;
  showEditorIfPossible: boolean;
  serverCaptionList?: LoadCaptionsResult[];
  renderer: CaptionRendererType;
  pageType: PageType;
  videoDimensions?: Dimension;
  menuHidden: boolean;
  isLoadingRawCaption: boolean;
  rawLoadPercentage?: number;
  currentUrl?: string;
  preferences: VideoPlayerPreferences;
};

export type VideoState = {
  fontList: { [name: string]: string };
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
  captionerId: string;
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
  currentUrl: string;
};

export type SetCaption = TabbedType & {
  caption?: CaptionContainer;
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

export type SetVideoDimensions = TabbedType & {
  dimensions: Dimension;
};

export type SetPlayerFontSizeMultiplier = TabbedType & {
  multiplier: number;
};

export type SubmitCaption = TabbedType & {
  languageCode: string;
  translatedTitle: string;
  hasAudioDescription: boolean;
  privacy: CaptionPrivacy;
  video: VideoMeta;
};

export type UpdateUploadedCaption = TabbedType & {
  file: RcFile;
  type: string;
  content: string;
  captionId: string;
  hasAudioDescription?: boolean;
  translatedTitle?: string;
  selectedTags?: string[];
  privacy: CaptionPrivacy;
};

export type LoadServerCaption = TabbedType & {
  captionId: string;
};

export type SubmitCaptionRequest = {
  caption: CaptionContainer;
  rawCaption?: RawCaptionData;
  hasAudioDescription: boolean;
  video: VideoMeta;
  privacy: CaptionPrivacy;
};

// Request for updating a caption
// Only non-null values will be updated
export type UpdateCaptionRequest = {
  captionId: string;
  captionData?: CaptionDataContainer;
  rawCaption?: RawCaptionData;
  hasAudioDescription?: boolean;
  translatedTitle?: string;
  selectedTags?: string[];
  privacy: CaptionPrivacy;
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

export enum CaptionPrivacy {
  Public = 0,
  Unlisted = 1,
}

export type CaptionFields = {
  language: string;
  videoId: string;
  videoSource: string;
  translatedTitle?: string;
  originalTitle?: string;
  data: string;
  creatorId: string;
  verified: boolean;
  likes: number;
  dislikes: number;
  tags: string[];
  views?: number;
  privacy?: CaptionPrivacy;
};

export type CaptionListFields = CaptionFields & {
  id: string;
  creatorName: string;
  videoName: string;
  videoLanguage: string;
  createdDate: number;
  updatedDate: number;
  verified: boolean;
  views: number;
  rejected?: boolean;
  thumbnailUrl?: string;
  privacy?: number;
};

export type LoadCaptionListResult = {
  captions: CaptionListFields[];
  hasMore: boolean;
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

// Renderer types
export type IFrameProps = {
  width: number;
  height: number;
  getCurrentTime: () => number; // Get the current video's time in seconds
};

export type SetFontList = {
  list: { [name: string]: string };
};

export type SetIsLoadingRawCaption = TabbedType & {
  loading: boolean;
  percentage?: number;
};

export type CaptionTag = {
  name: string;
  color: string;
};
