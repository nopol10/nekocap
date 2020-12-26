import { fork, takeLatest, put, call, select } from "redux-saga/effects";
import {
  PayloadAction,
  isAllOf,
  AnyAction,
  PayloadActionCreator,
} from "@reduxjs/toolkit";
import {
  SetCaption,
  SubmitCaption,
  CaptionContainer,
  SetShowEditorIfPossible,
  CaptionRendererType,
} from "@/common/feature/video/types";

import { getStringByteLength } from "@/common/utils";
import { safe } from "@/common/redux-utils";
import {
  addCaptionToTrackRelative,
  addCaptionToTrackTime,
  addTrack,
  changeCaptionTrackId,
  clearHistory,
  createNewCaption,
  deleteCaption,
  exportCaption,
  generateCaptionAndShowEditor,
  loadLocallySavedCaption,
  modifyCaption,
  modifyCaptionEndTime,
  modifyCaptionEndTimeMs,
  modifyCaptionGlobalSettings,
  modifyCaptionStartTime,
  modifyCaptionStartTimeMs,
  modifyCaptionText,
  modifyCaptionTime,
  modifyCaptionTrackSettings,
  modifyCaptionWithMultipleActions,
  redoEditorAction,
  redoEditorTriggerAction,
  removeTrack,
  saveLocalCaption,
  setEditorCaptionAfterEdit,
  setEditorShortcuts,
  setLoadedCaptionLanguage,
  setShowEditor,
  submitCaption,
  undoEditorAction,
  undoEditorTriggerAction,
  UpdateCaption,
  updateEditorCaption,
  updateKeyboardShortcutType,
  updateShowEditor,
} from "@/common/feature/caption-editor/actions";
import { ThunkedPayloadAction } from "@/common/store/action";
import {
  canEditorRedoSelector,
  canEditorUndoSelector,
  currentShortcutTypeSelector,
  tabEditorDataSelector,
  tabEditorRawDataSelector,
} from "@/common/feature/caption-editor/selectors";
import {
  CaptionEditorLocalSave,
  CaptionEditorStorage,
  CreateNewCaption,
  ExportCaption,
  ExportCaptionResult,
  GenerateCaption,
  SaveLocalCaption,
  SHORTCUT_TYPES,
  TabEditorData,
  TabRawCaptionData,
} from "@/common/feature/caption-editor/types";
import {
  CaptionFileFormat,
  ChromeMessageType,
  TabbedType,
  UploadResponse,
} from "@/common/types";
import { loadCaptions, setRenderer } from "@/common/feature/video/actions";
import { BUILT_IN_SHORTCUTS } from "@/common/feature/caption-editor/shortcut-constants";
import { EDITOR_CUTOFF_BYTES } from "@/common/feature/caption-editor/constants";
import { chromeProm } from "@/common/chrome-utils";
import { isInExtension } from "@/common/client-utils";
import { parseCaption, stringifyCaption } from "@/common/caption-parsers";
import { convertToCaptionContainer } from "@/common/feature/video/utils";
import { compressToBase64 as lzCompress } from "lz-string";
import { CaptionDataContainer } from "@/common/caption-parsers/types";
import { CaptionMutators } from "@/content/feature/editor/utils";
import { SUPPORTED_EXPORT_FORMATS } from "./constants";

const isActionType = <T>(
  action: AnyAction,
  creator: PayloadActionCreator<T>
): action is PayloadAction<T> => {
  return action.type === creator.type;
};

const generateNewCaptionData = (
  action: PayloadAction<any>,
  caption: CaptionContainer
) => {
  let error: string = "";
  let newCaptionData: CaptionDataContainer;
  if (isActionType(action, modifyCaption)) {
    const { captionId, newCaption, trackId } = action.payload;
    const result = CaptionMutators.modifyCaption(
      caption.data,
      trackId,
      captionId,
      newCaption
    );
    error = result.error;
    newCaptionData = result.caption;
  } else if (isActionType(action, modifyCaptionTrackSettings)) {
    const { settings, trackId } = action.payload;
    const result = CaptionMutators.modifyCaptionTrackSettings(
      caption.data,
      trackId,
      settings
    );
    error = result.error;
    newCaptionData = result.caption;
  } else if (isActionType(action, modifyCaptionGlobalSettings)) {
    const { settings } = action.payload;
    const result = CaptionMutators.modifyCaptionGlobalSettings(
      caption.data,
      settings
    );
    error = result.error;
    newCaptionData = result.caption;
  } else if (isActionType(action, modifyCaptionStartTimeMs)) {
    const { captionId, newTime, trackId } = action.payload;
    const result = CaptionMutators.modifyCaptionStartTimeMs(
      caption.data,
      trackId,
      captionId,
      newTime
    );
    error = result.error;
    newCaptionData = result.caption;
  } else if (isActionType(action, modifyCaptionEndTimeMs)) {
    const { captionId, newTime, trackId } = action.payload;
    const result = CaptionMutators.modifyCaptionEndTimeMs(
      caption.data,
      trackId,
      captionId,
      newTime
    );
    error = result.error;
    newCaptionData = result.caption;
  } else if (isActionType(action, modifyCaptionStartTime)) {
    const { captionId, newFormattedTime, trackId } = action.payload;
    const result = CaptionMutators.modifyCaptionStartTime(
      caption.data,
      trackId,
      captionId,
      newFormattedTime
    );
    error = result.error;
    newCaptionData = result.caption;
  } else if (isActionType(action, modifyCaptionEndTime)) {
    const { captionId, newFormattedTime, trackId } = action.payload;
    const result = CaptionMutators.modifyCaptionEndTime(
      caption.data,
      trackId,
      captionId,
      newFormattedTime
    );
    error = result.error;
    newCaptionData = result.caption;
  } else if (isActionType(action, modifyCaptionText)) {
    const { captionId, text, trackId } = action.payload;
    const result = CaptionMutators.modifyCaptionText(
      caption.data,
      trackId,
      captionId,
      text
    );
    error = result.error;
    newCaptionData = result.caption;
  } else if (isActionType(action, modifyCaptionTime)) {
    const { captionId, startMs, endMs, trackId } = action.payload;
    const result = CaptionMutators.modifyCaptionTime(
      caption.data,
      trackId,
      captionId,
      startMs,
      endMs
    );
    error = result.error;
    newCaptionData = result.caption;
  } else if (isActionType(action, changeCaptionTrackId)) {
    const { captionId, trackId, finalTrackId, startMs, endMs } = action.payload;
    const result = CaptionMutators.changeCaptionTrackId(
      caption.data,
      trackId,
      captionId,
      startMs,
      endMs,
      finalTrackId
    );
    error = result.error;
    newCaptionData = result.caption;
  } else if (isActionType(action, deleteCaption)) {
    const { captionId, trackId } = action.payload;
    const result = CaptionMutators.deleteCaption(
      caption.data,
      trackId,
      captionId
    );
    error = result.error;
    newCaptionData = result.caption;
  } else if (isActionType(action, addCaptionToTrackRelative)) {
    const { captionId, trackId } = action.payload;
    const result = CaptionMutators.addCaptionToTrackRelative(
      caption,
      trackId,
      captionId
    );
    error = result.error;
    newCaptionData = result.caption;
  } else if (isActionType(action, addCaptionToTrackTime)) {
    const { timeMs, newCue, trackId } = action.payload;
    const result = CaptionMutators.addCaptionToTrackTime(
      caption.data,
      trackId,
      timeMs,
      newCue
    );
    error = result.error;
    newCaptionData = result.caption;
  } else if (isActionType(action, removeTrack)) {
    const { trackId } = action.payload;
    const result = CaptionMutators.removeTrack(caption.data, trackId);
    error = result.error;
    newCaptionData = result.caption;
  } else if (isActionType(action, addTrack)) {
    const result = CaptionMutators.addTrack(caption.data);
    error = result.error;
    newCaptionData = result.caption;
  }
  return { error, newCaptionData };
};

function* updateEditorCaptionSaga({
  payload,
  meta,
}: ThunkedPayloadAction<UpdateCaption>) {
  const { action, tabId } = payload;
  const tabEditorData: TabEditorData = yield select(
    tabEditorDataSelector(tabId)
  );
  const { caption } = tabEditorData;
  const actions = isActionType(action, modifyCaptionWithMultipleActions)
    ? action.payload.actions
    : [action];
  let updatedCaption = { ...caption };
  for (let i = 0; i < actions.length; i++) {
    const { error, newCaptionData } = generateNewCaptionData(
      actions[i],
      updatedCaption
    );
    updatedCaption.data = newCaptionData;
    if (error || !newCaptionData) {
      // TODO send error message to content script
      return;
    }
  }

  yield put({
    ...setEditorCaptionAfterEdit({ caption: updatedCaption, tabId }),
    meta,
  });
}

function* undoEditorTriggerSaga({ payload }: PayloadAction<TabbedType>) {
  const canUndo: boolean = yield select(canEditorUndoSelector(payload.tabId));
  if (!canUndo) {
    return;
  }
  yield put(undoEditorAction(payload.tabId));
}

function* redoEditorTriggerSaga({ payload }: PayloadAction<TabbedType>) {
  const canRedo: boolean = yield select(canEditorRedoSelector(payload.tabId));
  if (!canRedo) {
    return;
  }
  yield put(redoEditorAction(payload.tabId));
}

function* updateKeyboardShortcutTypeSaga({
  payload: shortcutType,
  meta,
}: ThunkedPayloadAction<keyof typeof SHORTCUT_TYPES>) {
  const shortcuts = BUILT_IN_SHORTCUTS[shortcutType];
  if (!shortcuts) {
    return;
  }
  yield put({ meta, ...setEditorShortcuts({ shortcutType, shortcuts }) });
}

function* saveLocalCaptionSaga({
  payload,
}: ThunkedPayloadAction<SaveLocalCaption>) {
  if (!isInExtension()) {
    return;
  }
  const { tabId, videoId, videoSource } = payload;
  const tabData: TabEditorData = yield select(tabEditorDataSelector(tabId));
  if (!tabData) {
    return;
  }
  const { caption } = tabData;
  let result:
    | { editor: CaptionEditorStorage }
    | undefined = yield call(chromeProm.storage.local.get, ["editor"]);

  if (!result || !result.editor) {
    const shortcutType = yield select(currentShortcutTypeSelector);
    result = {
      editor: { saves: [], shortcutType },
    };
  }

  const { saves = [] } = result.editor;
  // Replace any existing save with the matching id and source
  let replacedExisting = false;
  const newSaves: CaptionEditorLocalSave[] = saves.map((save) => {
    if (save.videoId === videoId && save.videoSource === videoSource) {
      replacedExisting = true;
      return {
        ...save,
        caption,
      };
    }
    return save;
  });
  if (!replacedExisting) {
    newSaves.push({
      caption,
      videoId,
      videoSource,
    });
  }
  result.editor.saves = newSaves;

  yield call(chromeProm.storage.local.setByAppending, ["editor"], result);
  yield put(saveLocalCaption.success());
}

function* loadLocallySavedCaptionSaga({
  payload,
}: ThunkedPayloadAction<CreateNewCaption>) {
  const result:
    | { editor: CaptionEditorStorage }
    | undefined = yield call(chromeProm.storage.local.get, ["editor"]);
  if (!result || !result.editor) {
    throw new Error("No save found");
  }
  const { tabId, videoId, videoSource } = payload;

  const { saves = [] } = result.editor;
  const save: CaptionEditorLocalSave = saves.find((save) => {
    return save.videoId === videoId && save.videoSource === videoSource;
  });

  if (!save) {
    throw new Error("No save found");
  }

  // Batch the next few actions to prevent unnecessary rerenders
  // ts-ignored as there are no types in redux-batch for saga's put effect
  // @ts-ignore
  yield put([
    clearHistory(tabId),
    setEditorCaptionAfterEdit({ caption: save.caption, tabId }),
    setShowEditor({ show: true, tabId }),
  ]);
  yield put(loadLocallySavedCaption.success());
}

const sendSaveFileMesssage = (tabId: number, data: ExportCaptionResult) => {
  chrome.tabs.sendMessage(tabId, {
    type: ChromeMessageType.SaveFile,
    payload: data,
  });
};

function* exportCaptionSaga({ payload }: ThunkedPayloadAction<ExportCaption>) {
  const { tabId, format } = payload;
  if (!SUPPORTED_EXPORT_FORMATS.includes(format)) {
    return;
  }

  const tabData: TabEditorData = yield select(tabEditorDataSelector(tabId));
  if (!tabData) {
    return;
  }
  const { caption } = tabData;
  const captionString = stringifyCaption(format, caption.data);
  const filename = `${caption.videoId}.${CaptionFileFormat[format]}`;
  const saveFileMessage: ExportCaptionResult = { captionString, filename };
  yield call(sendSaveFileMesssage, tabId, saveFileMessage);
  yield put(exportCaption.success());
}

function* submitCaptionSaga({ payload }: ThunkedPayloadAction<SubmitCaption>) {
  const {
    tabId,
    languageCode,
    video,
    hasAudioDescription,
    translatedTitle,
  } = payload;
  const { caption }: TabEditorData = yield select(tabEditorDataSelector(tabId));
  if (!caption) {
    yield put(submitCaption.failure());
  }
  yield put(setLoadedCaptionLanguage({ tabId, languageCode }));
  let { caption: updatedCaption }: TabEditorData = yield select(
    tabEditorDataSelector(tabId)
  );
  updatedCaption = {
    ...updatedCaption,
    translatedTitle,
  };
  const { rawCaption }: TabRawCaptionData = yield select(
    tabEditorRawDataSelector(tabId)
  );
  // The raw caption will be compressed locally and decompressed on retrieval
  let processedRawCaption = { ...rawCaption };
  if (processedRawCaption.data) {
    processedRawCaption.data = lzCompress(rawCaption.data);
  }
  const response: UploadResponse = yield call(
    window.backendProvider.submitCaption,
    {
      caption: updatedCaption,
      rawCaption: processedRawCaption,
      video: video,
      hasAudioDescription,
    }
  );
  if (response.status === "error") {
    throw new Error(response.error);
  }
  // Retrieve the captions for this video to get the new caption
  yield put(
    loadCaptions.request({
      tabId,
      videoId: updatedCaption.videoId,
      videoSource: updatedCaption.videoSource,
    })
  );
}

function* createNewCaptionSaga({
  payload,
}: ThunkedPayloadAction<CreateNewCaption>) {
  const { tabId, videoId, videoSource } = payload;
  yield put(setShowEditor({ show: true, tabId }));
  yield put(clearHistory(tabId));
  const emptyCaptionContainer: CaptionContainer = {
    data: {
      settings: undefined,
      tracks: [
        {
          cues: [],
        },
      ],
    },
    loadedByUser: true,
    videoId,
    videoSource,
  };
  // Use setEditorCaptionAfterEdit to force one entry to be entered into the undo-redo state so that we can undo back to the original state
  yield put(
    setEditorCaptionAfterEdit({ caption: emptyCaptionContainer, tabId })
  );
}

function* updateShowEditorSaga({
  payload,
}: PayloadAction<SetShowEditorIfPossible>) {
  const { show, tabId } = payload;
  const rawData: TabRawCaptionData = yield select(
    tabEditorRawDataSelector(tabId)
  );
  if (rawData && rawData.rawCaption) {
    if (getStringByteLength(rawData.rawCaption.data) >= EDITOR_CUTOFF_BYTES) {
      return;
    }
  }
  yield put(setShowEditor(payload));
}

function* generateCaptionAndShowEditorSaga({
  payload,
}: PayloadAction<GenerateCaption>) {
  const { tabId, videoId, videoSource } = payload;
  const rawData: TabRawCaptionData = yield select(
    tabEditorRawDataSelector(tabId)
  );
  if (!rawData || !rawData.rawCaption) {
    return;
  }
  const parsedCaption = parseCaption(
    rawData.rawCaption.type,
    rawData.rawCaption.data
  );
  const caption: CaptionContainer = convertToCaptionContainer(
    parsedCaption,
    videoId,
    videoSource
  );
  // @ts-ignore
  yield put([
    setEditorCaptionAfterEdit({ caption, tabId }),
    setRenderer({ tabId, renderer: CaptionRendererType.Default }),
    setShowEditor({ tabId, show: true }),
  ]);
}

function* captionEditorSaga() {
  yield takeLatest(updateEditorCaption.type, safe(updateEditorCaptionSaga));

  yield takeLatest(undoEditorTriggerAction.type, safe(undoEditorTriggerSaga));

  yield takeLatest(redoEditorTriggerAction.type, safe(redoEditorTriggerSaga));

  yield takeLatest(
    updateKeyboardShortcutType.type,
    safe(updateKeyboardShortcutTypeSaga)
  );

  yield takeLatest(
    saveLocalCaption.REQUEST,
    saveLocalCaption.requestSaga(saveLocalCaptionSaga)
  );

  yield takeLatest(
    loadLocallySavedCaption.REQUEST,
    loadLocallySavedCaption.requestSaga(loadLocallySavedCaptionSaga)
  );

  yield takeLatest(
    exportCaption.REQUEST,
    exportCaption.requestSaga(exportCaptionSaga)
  );

  yield takeLatest(
    submitCaption.REQUEST,
    submitCaption.requestSaga(submitCaptionSaga)
  );

  yield takeLatest(
    createNewCaption.REQUEST,
    createNewCaption.requestSaga(createNewCaptionSaga)
  );
  yield takeLatest(updateShowEditor.type, safe(updateShowEditorSaga));
  yield takeLatest(
    generateCaptionAndShowEditor.type,
    safe(generateCaptionAndShowEditorSaga)
  );
}

export default [fork(captionEditorSaga)];
