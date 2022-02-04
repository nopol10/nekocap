import { AnyAction, createReducer, PayloadAction } from "@reduxjs/toolkit";
import {
  fetchAutoCaptionList,
  setAutoCaptionList,
  setEditorCaption,
  setEditorCaptionAfterEdit,
  setEditorRawCaption,
  setEditorShortcuts,
  setLoadedCaptionLanguage,
  setShowEditor,
  submitCaption,
  updateUploadedCaption,
} from "@/common/feature/caption-editor/actions";
import {
  CaptionEditorState,
  SHORTCUT_TYPES,
  TabEditorData,
} from "@/common/feature/caption-editor/types";
import { clearTabData, unsetTabData } from "@/common/feature/video/actions";
import { BUILT_IN_SHORTCUTS } from "@/common/feature/caption-editor/shortcut-constants";
import undoable, { includeAction } from "redux-undo";
import { captionEditorActionTypes } from "@/common/feature/caption-editor/action-types";
import { SetCaption, SetRawCaption } from "@/common/feature/video/types";
import { TabbedType } from "@/common/types";
import { hydrate } from "@/web/store/action";
import { isInBackgroundScript } from "@/common/client-utils";

const defaultTabEditorData: TabEditorData = {
  showEditorIfPossible: false,
};

const setCaptionReducer = (
  state: TabEditorData,
  action: PayloadAction<SetCaption>
): TabEditorData => {
  const { payload } = action;
  const { caption } = payload;
  return {
    ...state,
    caption,
  };
};

const setRawCaptionReducer = (
  state: CaptionEditorState,
  action: PayloadAction<SetRawCaption>
): CaptionEditorState => {
  const { payload } = action;
  const { tabId, rawCaption } = payload;
  return {
    ...state,
  };
};

const captionEditorTabBuiltReducer = createReducer<TabEditorData>(
  defaultTabEditorData,
  (builder) => {
    return builder
      .addCase(setEditorCaption, setCaptionReducer)
      .addCase(setEditorCaptionAfterEdit, setCaptionReducer)
      .addCase(setAutoCaptionList, (state, action) => {
        const { payload } = action;
        const { captions } = payload;
        return {
          ...state,
          autoCaptions: captions,
        };
      })
      .addCase(setShowEditor, (state, action) => {
        const { payload } = action;
        const { show } = payload;
        return {
          ...state,
          showEditorIfPossible: show,
        };
      })
      .addCase(setLoadedCaptionLanguage, (state, action) => {
        const { payload } = action;
        const { languageCode } = payload;
        if (!state.caption) {
          return state;
        }
        return {
          ...state,
          caption: { ...state.caption, languageCode: languageCode },
        };
      });
  }
);

export const captionEditorBaseReducer = (tabId: number) =>
  undoable(captionEditorTabBuiltReducer, {
    limit: 40,
    undoType: `${captionEditorActionTypes.undo}_${tabId}`,
    redoType: `${captionEditorActionTypes.redo}_${tabId}`,
    clearHistoryType: `${captionEditorActionTypes.clearHistory}_${tabId}`,
    filter: includeAction(captionEditorActionTypes.setEditorCaptionAfterEdit),
  });

const isTabbedAction = (
  action: AnyAction
): action is PayloadAction<TabbedType> => {
  const isTabbed =
    "payload" in action &&
    typeof action.payload === "object" &&
    "tabId" in action.payload;
  const isClearAction =
    action.type === clearTabData.type || action.type === unsetTabData.type;
  return isTabbed && !isClearAction;
};

export const captionEditorReducer = createReducer<CaptionEditorState>(
  {
    tabData: {},
    shortcutType: "NekoCap",
    keyboardShortcuts: {
      ...BUILT_IN_SHORTCUTS[SHORTCUT_TYPES.NekoCap],
    },
  },
  (builder) => {
    submitCaption.augmentReducer(builder);
    updateUploadedCaption.augmentReducer(builder);
    fetchAutoCaptionList.augmentReducer(builder);
    return builder
      .addCase(setEditorShortcuts, (state, action) => {
        const { shortcutType, shortcuts } = action.payload;
        return {
          ...state,
          shortcutType,
          keyboardShortcuts: shortcuts,
        };
      })
      .addCase(clearTabData, (state, action) => {
        const { tabId } = action.payload;
        if (
          isInBackgroundScript() &&
          globalThis.backgroundEditorRawCaption &&
          !!globalThis.backgroundEditorRawCaption[tabId]
        ) {
          delete globalThis.backgroundEditorRawCaption[tabId];
        } else {
          globalThis.editorRawCaption = null;
        }
        return {
          ...state,
          tabData: {
            ...state.tabData,
            [tabId]: {
              present: { showEditorIfPossible: false, caption: undefined },
              future: [],
              past: [],
            },
          },
        };
      })
      .addCase(setEditorRawCaption, setRawCaptionReducer)
      .addCase(unsetTabData, (state, action) => {
        const { payload } = action;
        const { tabId } = payload;
        const newTabData = { ...state.tabData };
        delete newTabData[tabId];
        // @ts-ignore
        const newTabMeta = { ...state.tabMeta };
        delete newTabMeta[tabId];
        if (
          isInBackgroundScript() &&
          globalThis.backgroundEditorRawCaption &&
          !!globalThis.backgroundEditorRawCaption[tabId]
        ) {
          delete globalThis.backgroundEditorRawCaption[tabId];
        } else {
          globalThis.editorRawCaption = null;
        }
        return {
          ...state,
          tabData: newTabData,
          tabMeta: newTabMeta,
        };
      })
      .addCase(hydrate, (state, action) => {
        return {
          ...state,
          tabData: {
            ...state.tabData,
            ...action.payload.captionEditor.tabData,
          },
        };
      })
      .addMatcher(isTabbedAction, (state, action) => {
        const { tabId } = action.payload;
        const tabData = state.tabData[tabId];
        return {
          ...state,
          tabData: {
            ...state.tabData,
            [tabId]: captionEditorBaseReducer(tabId)(tabData, action),
          },
        };
      });
  }
);
