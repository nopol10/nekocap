import {
  CaptionSettings,
  NekoCaption,
  TrackSettings,
} from "@/common/caption-parsers/types";
import {
  createSignalActionInState,
  createThunkedActionCreator,
} from "@/common/store/action";
import {
  Action,
  AnyAction,
  createAction,
  PayloadAction,
} from "@reduxjs/toolkit";

import { TabbedType } from "../../types";
import {
  SetEditorShortcuts,
  SetShowEditorIfPossible,
  SetCaption,
  SetCaptionLanguage,
  SubmitCaption,
  SetRawCaption,
  VideoSource,
} from "../video/types";
import { captionEditorActionTypes } from "./action-types";
import {
  AutoCaptionLanguage,
  CreateNewCaption,
  ExportCaption,
  ExportCaptionResult,
  GenerateCaption,
  SaveLocalCaption,
  SHORTCUT_TYPES,
} from "./types";

export type CaptionAction = {
  error?: string;
};

export type UpdateCaption<
  T extends CaptionAction = CaptionAction
> = TabbedType & {
  action: PayloadAction<T>;
};

export type ModifyCaptionWithMultipleActions = CaptionAction & {
  actions: PayloadAction<any>[];
};

export type ModifyCaption = CaptionAction & {
  trackId: number;
  captionId: number;
  newCaption: NekoCaption;
};

export type ModifyCaptionTrackSettings = CaptionAction & {
  trackId: number;
  settings: TrackSettings;
};

export type ModifyCaptionGlobalSettings = CaptionAction & {
  settings: CaptionSettings;
};

export type ModifyCaptionStartTimeMs = CaptionAction & {
  trackId: number;
  captionId: number;
  newTime: number;
};

export type ModifyCaptionEndTimeMs = ModifyCaptionStartTimeMs;

export type ModifyCaptionStartTime = CaptionAction & {
  trackId: number;
  captionId: number;
  newFormattedTime: string;
};

export type ModifyCaptionText = CaptionAction & {
  trackId: number;
  captionId: number;
  text: string;
};

export type ModifyCaptionTime = CaptionAction & {
  trackId: number;
  captionId: number;
  startMs: number;
  endMs: number;
};

export type ChangeCaptionTrackId = CaptionAction & {
  trackId: number;
  captionId: number;
  startMs: number;
  endMs: number;
  finalTrackId: number;
};

export type DeleteCaption = CaptionAction & {
  trackId: number;
  captionId: number;
};

export type AddCaptionToTrackRelative = CaptionAction & {
  trackId: number;
  captionId: number;
};

export type AddCaptionToTrackTime = CaptionAction & {
  trackId: number;
  timeMs: number;
  newCue?: NekoCaption;
  skipValidityChecks?: boolean;
};

export type RemoveTrack = CaptionAction & {
  trackId: number;
};

export type ModifyCaptionEndTime = ModifyCaptionStartTime;

export type FetchAutoCaptions = TabbedType & {
  videoId: string;
  videoSource: VideoSource;
};

export type LoadAutoCaption = TabbedType & {
  videoId: string;
  videoSource: VideoSource;
  captionId: string;
};

export type SetAutoCaptionList = TabbedType & {
  captions: AutoCaptionLanguage[];
};

const csa = createSignalActionInState("captionEditor", true);

export const createNewCaption = csa<CreateNewCaption>(
  captionEditorActionTypes.createNewCaption
);

export const loadLocallySavedCaption = csa<CreateNewCaption>(
  captionEditorActionTypes.loadLocallySavedCaption
);

export const submitCaption = csa<SubmitCaption>(
  captionEditorActionTypes.submitCaption
);

export const fetchAutoCaptions = csa<FetchAutoCaptions>(
  captionEditorActionTypes.fetchAutoCaptions
);

export const loadAutoCaption = csa<LoadAutoCaption>(
  captionEditorActionTypes.loadAutoCaption
);

export const updateShowEditor = createAction<SetShowEditorIfPossible>(
  captionEditorActionTypes.updateShowEditor
);

/**
 * Generate caption from the loaded raw caption and display
 * the editor after that
 */
export const generateCaptionAndShowEditor = createAction<GenerateCaption>(
  captionEditorActionTypes.generateCaptionAndShowEditor
);

export const saveLocalCaption = csa<SaveLocalCaption>(
  captionEditorActionTypes.saveLocalCaption
);

export const exportCaption = csa<ExportCaption>(
  captionEditorActionTypes.exportCaption
);

/**
 * These are actions to help check for validity of an undo before the redux undo actions are fired
 */
export const undoEditorTriggerAction = createAction<TabbedType>(
  captionEditorActionTypes.undoTrigger
);

export const redoEditorTriggerAction = createAction<TabbedType>(
  captionEditorActionTypes.redoTrigger
);

export const updateKeyboardShortcutType = createThunkedActionCreator<
  keyof typeof SHORTCUT_TYPES
>(captionEditorActionTypes.updateKeyboardShortcutType);

/**
 * These will be used by Redux Undo
 */
export const undoEditorAction = (tabId: number) =>
  createAction<TabbedType>(`${captionEditorActionTypes.undo}_${tabId}`)({
    tabId,
  });

export const redoEditorAction = (tabId: number) =>
  createAction<TabbedType>(`${captionEditorActionTypes.redo}_${tabId}`)({
    tabId,
  });

export const clearHistory = (tabId: number) =>
  createAction<TabbedType>(
    `${captionEditorActionTypes.clearHistory}_${tabId}`
  )({ tabId });

export const setEditorCaption = createAction<SetCaption>(
  captionEditorActionTypes.setEditorCaption
);

export const setEditorRawCaption = createAction<SetRawCaption>(
  captionEditorActionTypes.setEditorRawCaption
);

export const setEditorCaptionAfterEdit = createAction<SetCaption>(
  captionEditorActionTypes.setEditorCaptionAfterEdit
);

export const setLoadedCaptionLanguage = createAction<SetCaptionLanguage>(
  captionEditorActionTypes.setCaptionLanguage
);

export const setShowEditor = createAction<SetShowEditorIfPossible>(
  captionEditorActionTypes.setShowEditor
);

export const setEditorShortcuts = createAction<SetEditorShortcuts>(
  captionEditorActionTypes.setEditorShortcuts
);

export const setAutoCaptionList = createAction<SetAutoCaptionList>(
  captionEditorActionTypes.setAutoCaptionList
);

//#region Caption modification actions

export const updateEditorCaption = createThunkedActionCreator<UpdateCaption>(
  captionEditorActionTypes.updateEditorCaption
);

export const modifyCaptionWithMultipleActions = createAction<
  ModifyCaptionWithMultipleActions
>(captionEditorActionTypes.modifyCaptionWithMultipleActions);

export const modifyCaption = createAction<ModifyCaption>(
  captionEditorActionTypes.modifyCaption
);

export const modifyCaptionTrackSettings = createAction<
  ModifyCaptionTrackSettings
>(captionEditorActionTypes.modifyCaptionTrackSettings);

export const modifyCaptionGlobalSettings = createAction<
  ModifyCaptionGlobalSettings
>(captionEditorActionTypes.modifyCaptionGlobalSettings);

export const modifyCaptionStartTimeMs = createAction<ModifyCaptionStartTimeMs>(
  captionEditorActionTypes.modifyCaptionStartTimeMs
);

export const modifyCaptionEndTimeMs = createAction<ModifyCaptionEndTimeMs>(
  captionEditorActionTypes.modifyCaptionEndTimeMs
);

export const modifyCaptionStartTime = createAction<ModifyCaptionStartTime>(
  captionEditorActionTypes.modifyCaptionStartTime
);

export const modifyCaptionEndTime = createAction<ModifyCaptionEndTime>(
  captionEditorActionTypes.modifyCaptionEndTime
);

export const modifyCaptionText = createAction<ModifyCaptionText>(
  captionEditorActionTypes.modifyCaptionText
);

export const modifyCaptionTime = createAction<ModifyCaptionTime>(
  captionEditorActionTypes.modifyCaptionTime
);

export const changeCaptionTrackId = createAction<ChangeCaptionTrackId>(
  captionEditorActionTypes.changeCaptionTrackId
);

export const deleteCaption = createAction<DeleteCaption>(
  captionEditorActionTypes.deleteCaption
);

export const addCaptionToTrackRelative = createAction<
  AddCaptionToTrackRelative
>(captionEditorActionTypes.addCaptionToTrackRelative);

export const addCaptionToTrackTime = createAction<AddCaptionToTrackTime>(
  captionEditorActionTypes.addCaptionToTrackTime
);

export const addTrack = createAction<CaptionAction>(
  captionEditorActionTypes.addTrack
);

export const removeTrack = createAction<RemoveTrack>(
  captionEditorActionTypes.removeTrack
);

//#endregion
