import type { KeySequence } from "react-hotkeys-ce";
import type { StateWithHistory } from "redux-undo";
import type {
  CaptionFileFormat,
  ServerResponse,
  TabbedType,
} from "../../types";
import type {
  CaptionContainer,
  RawCaptionData,
  VideoSource,
} from "../video/types";

export type AutoCaptionLanguage = {
  id: string;
  language: string;
  name: string;
  isAutomaticCaption: boolean;
};

export type GetAutoCaptionListResult = {
  captions: AutoCaptionLanguage[];
};

export type GetAutoCaptionListParams = {
  videoSource: VideoSource;
  videoId: string;
};

export type GetAutoCaptionListResponse = ServerResponse &
  GetAutoCaptionListResult;

export type TabEditorData = {
  caption?: CaptionContainer; // The caption loaded from the server
  showEditorIfPossible: boolean;
  autoCaptions?: AutoCaptionLanguage[];
};

export type CreateNewCaption = TabbedType & {
  videoId: string;
  videoSource: VideoSource;
};

export type GenerateCaption = CreateNewCaption;

export type SaveLocalCaption = TabbedType & {
  videoId: string;
  videoSource: VideoSource;
  mustHaveData?: boolean;
};

export type ExportCaption = TabbedType & {
  format: keyof typeof CaptionFileFormat;
};

export type ExportCaptionResult = {
  captionString: string;
  filename: string;
};

export const SHORTCUT_TYPES = {
  NekoCap: "NekoCap",
  Youtube: "Youtube",
  Aegisub: "Aegisub",
  Amara: "Amara",
};

/**
 * For storage of the originally loaded caption file (if present)
 */
export type TabRawCaptionData = {
  rawCaption?: RawCaptionData;
};

export type CaptionEditorState = {
  tabData: {
    [tabId: number]: StateWithHistory<TabEditorData>;
  };
  shortcutType: keyof typeof SHORTCUT_TYPES;
  keyboardShortcuts: {
    [id: string]: KeySequence;
  };
};

// TODO: make it customizable
export const EDITOR_KEYS = {
  PLAY_PAUSE: "PLAY_PAUSE",
  GO_TO_PREVIOUS_CAPTION: "GO_TO_PREVIOUS_CAPTION",
  GO_TO_NEXT_CAPTION: "GO_TO_NEXT_CAPTION",
  SEEK_NEXT_FRAME: "SEEK_NEXT_FRAME",
  SEEK_PREVIOUS_FRAME: "SEEK_PREVIOUS_FRAME",
  SEEK_BACK_500_MS: "SEEK_BACK_500_MS",
  SEEK_FORWARD_500_MS: "SEEK_FORWARD_500_MS",
  SEEK_BACK_5_SECONDS: "SEEK_BACK_5_SECONDS",
  SEEK_FORWARD_5_SECONDS: "SEEK_FORWARD_5_SECONDS",
  UNDO: "UNDO",
  REDO: "REDO",
  SET_START_TO_CURRENT_TIME: "SET_START_TO_CURRENT_TIME",
  SET_END_TO_CURRENT_TIME: "SET_END_TO_CURRENT_TIME",
  NEW_CAPTION: "NEW_CAPTION",
  SAVE: "SAVE",
};

export type EditorShortcuts = {
  [id in keyof typeof EDITOR_KEYS]: KeySequence;
};

export type EditorShortcutHandlers = Partial<
  {
    [id in keyof typeof EDITOR_KEYS]: (keyEvent: KeyboardEvent) => void;
  }
>;

export type ShortcutList = {
  [id in keyof typeof SHORTCUT_TYPES]: EditorShortcuts;
};

export enum CaptionModificationState {
  None,
  Global,
  Track,
  Caption,
}

export type CaptionEditorLocalSave = {
  videoSource: VideoSource;
  videoId: string;
  caption: CaptionContainer;
};

export type CaptionEditorStorage = {
  saves: CaptionEditorLocalSave[];
  shortcutType: keyof typeof SHORTCUT_TYPES;
};
