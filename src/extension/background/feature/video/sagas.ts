import {
  fork,
  takeLatest,
  call,
  put,
  select,
  takeEvery,
  take,
} from "redux-saga/effects";
import { message as notificationMessage } from "antd";
import {
  loadCaptions,
  setLoadedCaption,
  setShowCaption,
  setServerCaptions,
  loadServerCaption,
  dislikeCaption,
  likeCaption,
  requestFreshTabData,
  clearTabData,
  updateLoadedCaptionFromFile,
  updateRenderer,
  setRenderer,
  setContentPageType,
  closeTab,
  unsetTabData,
  closeMenuBar,
  setMenuHidden,
  openMenuBar,
  loadWebsiteViewerCaption,
  setVideoDimensions,
  setFontList,
  setIsLoadingRawCaption,
} from "@/common/feature/video/actions";
import { videoActionTypes } from "@/common/feature/video/action-types";
import { Action, PayloadAction } from "@reduxjs/toolkit";
import {
  LoadServerCaption,
  LoadSingleCaptionResult,
  LoadCaptions,
  LoadCaptionsResult,
  RequestFreshTabData,
  SetShowCaption,
  CaptionContainer,
  UpdateLoadedCaptionFromFile,
  RawCaptionData,
  SetRenderer,
  CaptionRendererType,
  PageType,
  TabVideoData,
  SetServerCaptions,
} from "@/common/feature/video/types";
import { videoSourceToProcessorMap } from "@/common/feature/video/utils";
import {
  CaptionFileFormat,
  ChromeMessageType,
  Dimension,
  NotificationMessage,
  TabbedType,
} from "@/common/types";
import {
  loadedCaptionSelector,
  tabVideoDataSelector,
} from "@/common/feature/video/selectors";
import { safe } from "@/common/redux-utils";
import {
  clearHistory,
  setEditorCaptionAfterEdit,
  setShowEditor,
} from "@/common/feature/caption-editor/actions";
import { decompressFromBase64 as lzDecompress } from "lz-string";
import { isAss } from "@/common/caption-utils";
import { Locator } from "@/common/locator/locator";
import { loadFontListApi } from "@/common/feature/video/api";
import { SUBSTATION_FONT_LIST } from "@/common/substation-fonts";
import {
  isFirefoxExtension,
  isInBackgroundScript,
  isInExtension,
} from "@/common/client-utils";
import { getCaptionContainersFromFile } from "../caption-editor/utils";
import { userExtensionPreferenceSelector } from "../user-extension-preference/selectors";
import {
  AutoloadMethod,
  UserExtensionPreferenceState,
} from "../user-extension-preference/types";

function sendInfoMessage(tabId: number, message: NotificationMessage) {
  if (isInExtension() && isInBackgroundScript()) {
    chrome.tabs.sendMessage(tabId, {
      type: ChromeMessageType.InfoMessage,
      payload: message,
    });
  } else {
    notificationMessage.info(message.message, message.duration || 4);
  }
}

function* updateLoadedCaptionFromFileSaga({
  payload,
}: PayloadAction<UpdateLoadedCaptionFromFile>) {
  const { content, videoId, videoSource, tabId, type } = payload;
  let defaultRenderer: CaptionRendererType = CaptionRendererType.Default;
  let fontList = SUBSTATION_FONT_LIST;
  const { rawCaptionData, captionData } = getCaptionContainersFromFile({
    content,
    type,
  });
  if (rawCaptionData && isAss(type)) {
    const processor = videoSourceToProcessorMap[videoSource];
    if (processor.disableAdvancedCaptions === true) {
      sendInfoMessage(tabId, {
        message: "Sorry, advanced captions are not supported for this website!",
        duration: 5,
      });
      return;
    }
    defaultRenderer = CaptionRendererType.AdvancedOctopus;
    yield put(setIsLoadingRawCaption({ loading: true, percentage: 0, tabId }));
    fontList = yield call(loadFontListApi);
    yield call(storeRawCaption, tabId, rawCaptionData, true);
    yield put(setShowEditor({ tabId, show: false }));
  } else {
    yield call(clearRawCaption, tabId, true);
  }

  const caption: CaptionContainer = {
    data: captionData,
    loadedByUser: true,
    videoId,
    videoSource,
    modifiedTime: Date.now(),
  };

  yield put([
    clearHistory(tabId),
    setFontList({ list: fontList }),
    // Use setEditorCaptionAfterEdit to force one entry to be entered into the undo-redo state so that we can undo back to the original state
    setRenderer({ tabId, renderer: defaultRenderer }),
    setEditorCaptionAfterEdit({ caption, tabId }),
  ]);
}

function* updateShowCaptionSaga({ payload }: PayloadAction<SetShowCaption>) {
  const { show, tabId } = payload;
  yield put(setShowCaption({ show, tabId }));
}

function* updateRendererSaga({ payload }: PayloadAction<SetRenderer>) {
  // TODO: check to make sure the renderer can be used
  yield put(setRenderer(payload));
}

function* closeMenuBarSaga({ payload }: PayloadAction<TabbedType>) {
  const { tabId } = payload;
  sendInfoMessage(tabId, {
    message:
      "You can open the menu again by clicking the NekoCap icon in the extensions toolbar",
    duration: 4,
  });

  yield put(setMenuHidden({ tabId, hidden: true }));
}

function* openMenuBarSaga({ payload }: PayloadAction<TabbedType>) {
  yield put(setMenuHidden({ tabId: payload.tabId, hidden: false }));
}

/**
 * Load the list of captions available for a video
 */
function* loadCaptionSaga({ payload }: PayloadAction<LoadCaptions>) {
  const { videoId, videoSource, tabId } = payload;
  const result: LoadCaptionsResult[] = yield call(
    [Locator.provider(), "loadCaptions"],
    {
      videoId,
      videoSource,
    }
  );
  if (
    isInBackgroundScript() &&
    chrome.browserAction &&
    chrome.browserAction.setBadgeText
  ) {
    chrome.browserAction.setBadgeText({
      text: result.length.toString(),
      tabId,
    });
  }
  yield put(setServerCaptions({ captions: result, tabId }));
}

/**
 * Saves the raw caption outside the store as they can be quite large
 * and cause state updates to lag
 * On the extension, sends it to the tab's content script
 * @param tabId The tab to send the caption to
 * @param rawCaption rawCaption data to send
 */
async function storeRawCaption(
  tabId: number,
  rawCaption: RawCaptionData,
  isEditor
): Promise<void> {
  if (isInBackgroundScript()) {
    if (isEditor) {
      if (!globalThis.backgroundEditorRawCaption) {
        globalThis.backgroundEditorRawCaption = {};
      }
      globalThis.backgroundEditorRawCaption[tabId] = rawCaption;
    } else {
      if (!globalThis.backgroundRawCaption) {
        globalThis.backgroundRawCaption = {};
      }
      globalThis.backgroundRawCaption[tabId] = rawCaption;
    }
    // In MV3, this can only run in the popup page. When that happens,
    // we need to send the raw caption to the content script
    await new Promise<void>((resolve) => {
      globalThis.chrome.tabs.sendMessage(
        tabId,
        {
          type: ChromeMessageType.RawCaption,
          payload: {
            isEditor,
            rawCaption,
          },
        },
        () => {
          resolve();
        }
      );
    });
  }
  if (isEditor) {
    globalThis.editorRawCaption = rawCaption;
  } else {
    globalThis.rawCaption = rawCaption;
  }
  return Promise.resolve();
}

async function clearRawCaption(tabId: number, isEditor): Promise<void> {
  if (isInBackgroundScript()) {
    if (isEditor) {
      if (!globalThis.backgroundEditorRawCaption) {
        globalThis.backgroundEditorRawCaption = {};
      }
      delete globalThis.backgroundEditorRawCaption[tabId];
    } else {
      if (!globalThis.backgroundRawCaption) {
        globalThis.backgroundRawCaption = {};
      }
      delete globalThis.backgroundRawCaption[tabId];
    }
    // In MV3, this can only run in the popup page. When that happens,
    // we need to send the raw caption to the content script
    await new Promise<void>((resolve) => {
      globalThis.chrome.tabs.sendMessage(
        tabId,
        {
          type: ChromeMessageType.RawCaption,
          payload: {
            isEditor,
            rawCaption: undefined,
          },
        },
        () => {
          resolve();
        }
      );
    });
  }
  if (isEditor) {
    globalThis.editorRawCaption = undefined;
  } else {
    globalThis.rawCaption = undefined;
  }
  return Promise.resolve();
}

/**
 * Load a single caption
 */
function* loadServerCaptionSaga({ payload }: PayloadAction<LoadServerCaption>) {
  const { tabId, captionId } = payload;
  yield put(setIsLoadingRawCaption({ loading: true, percentage: 0, tabId }));
  const response: LoadSingleCaptionResult = yield call(
    [Locator.provider(), "loadCaption"],
    {
      captionId,
    }
  );
  if (!response) {
    throw new Error("Could not load the caption.");
  }
  const { caption, rawCaption: rawCaptionString } = response;
  let fontList = SUBSTATION_FONT_LIST;
  let rawCaption: RawCaptionData;
  if (rawCaptionString) {
    rawCaption = JSON.parse(rawCaptionString);
    if (rawCaption && rawCaption.data) {
      if (rawCaption.data) {
        // Also load the font list when raw captions are required
        rawCaption.data = lzDecompress(rawCaption.data);
        fontList = yield call(loadFontListApi);
      }
    }
  } else {
    // Not a raw caption, hide the loader
    yield put(setIsLoadingRawCaption({ loading: false, tabId }));
  }

  let defaultRenderer: CaptionRendererType = CaptionRendererType.Default;
  if (
    rawCaption &&
    (rawCaption.type === CaptionFileFormat.ass ||
      rawCaption.type === CaptionFileFormat.ssa)
  ) {
    // The user has to manually initiate the conversion as a large ass will freeze the page
    // Other file formats don't support fancy effects so we'll allow them to be auto converted
    defaultRenderer = CaptionRendererType.AdvancedOctopus;
    yield put(setShowEditor({ tabId, show: false }));
    yield call(storeRawCaption, tabId, rawCaption, false);
  }

  yield put([
    clearHistory(tabId),
    setFontList({ list: fontList }),
    setLoadedCaption({ tabId, caption }),
    setRenderer({ tabId, renderer: defaultRenderer }),
    // We set the caption for the editor to this caption, but this does not make it editable.
    // Use setEditorCaptionAfterEdit to force one entry to be entered into the undo-redo state so that we can undo back to the original state
    setEditorCaptionAfterEdit({ tabId, caption }),
    loadServerCaption.success(),
  ]);
}

function* loadWebsiteViewerCaptionSaga(
  action: PayloadAction<LoadServerCaption>
) {
  const { tabId } = action.payload;
  yield call(loadServerCaptionSaga, action);
  const data: TabVideoData = yield select(tabVideoDataSelector(tabId));
  if (!data || !data.caption) {
    return;
  }
  const processor = videoSourceToProcessorMap[data.caption.videoSource];
  const dimensions: Dimension = yield call(
    [processor, "retrieveVideoDimensions"],
    data.caption.videoId
  );
  yield put(setVideoDimensions({ tabId, dimensions }));
}

function* likeCaptionSaga({ payload }: PayloadAction<TabbedType>) {
  const { tabId } = payload;
  const { id: captionId, userLike }: CaptionContainer = yield select(
    loadedCaptionSelector(tabId)
  );
  yield call([Locator.provider(), "likeCaption"], { captionId: captionId });

  yield put(loadServerCaption.request({ captionId, tabId }));

  yield put(likeCaption.success({ tabId }));
}

function* dislikeCaptionSaga({ payload }: PayloadAction<TabbedType>) {
  const { tabId } = payload;
  const { id: captionId, userDislike }: CaptionContainer = yield select(
    loadedCaptionSelector(tabId)
  );

  yield call([Locator.provider(), "dislikeCaption"], {
    captionId,
  });

  yield put(loadServerCaption.request({ captionId, tabId }));

  yield put(dislikeCaption.success({ tabId }));
}

function* requestFreshTabDataSaga({
  payload,
}: PayloadAction<RequestFreshTabData>) {
  const {
    tabId,
    newVideoId,
    newVideoSource,
    newPageType,
    newCaptionId,
    currentUrl,
  } = payload;

  // @ts-ignore
  yield put([clearHistory(tabId), clearTabData({ tabId })]);
  yield put(setContentPageType({ tabId, pageType: newPageType, currentUrl }));
  /**
   * This somehow forces the saga to wait for clearTabData to go through the reducer before continuing.
   * Prevents caption loading from finishing before clearTabData, which would erase loaded captions immediately
   */
  yield select(tabVideoDataSelector(tabId));
  if (newPageType !== PageType.Video) {
    return;
  }
  if (newVideoId) {
    yield put(
      loadCaptions.request({
        videoId: newVideoId,
        videoSource: newVideoSource,
        tabId,
      })
    );
  }
  const {
    autoloadMethod,
    preferredLanguage,
  }: UserExtensionPreferenceState = yield select(
    userExtensionPreferenceSelector
  );
  if (newCaptionId) {
    // Load the caption specified in the URL
    yield put(loadServerCaption.request({ captionId: newCaptionId, tabId }));
    return;
  }
  if (autoloadMethod === AutoloadMethod.NoAutoload) {
    return;
  }
  // Autoload caption
  const {
    payload: serverCaptionAction,
  }: PayloadAction<SetServerCaptions> = yield take(setServerCaptions);
  const serverCaptionList = serverCaptionAction.captions;
  if (serverCaptionList.length <= 0) {
    return;
  }
  const preferredLanguageCaption =
    serverCaptionList.find(({ languageCode }) => {
      return (
        languageCode === preferredLanguage ||
        languageCode.startsWith(preferredLanguage)
      );
    }) ||
    (autoloadMethod === AutoloadMethod.AutoloadPreferredOrFirst &&
      serverCaptionList[0]);

  if (preferredLanguageCaption) {
    yield put(
      loadServerCaption.request({
        captionId: preferredLanguageCaption.id,
        tabId,
      })
    );
  }

  yield;
}

function* closeTabSaga({ payload }: PayloadAction<TabbedType>) {
  const { tabId } = payload;

  yield put(unsetTabData({ tabId }));
}

function* videoSaga() {
  yield takeLatest(
    updateLoadedCaptionFromFile.type,
    updateLoadedCaptionFromFileSaga
  );
  yield takeLatest(videoActionTypes.updateShowCaption, updateShowCaptionSaga);
  yield takeEvery(
    loadCaptions.REQUEST,
    safe(loadCaptions.requestSaga(loadCaptionSaga))
  );

  yield takeLatest(
    loadServerCaption.REQUEST,
    loadServerCaption.requestSaga(loadServerCaptionSaga)
  );
  yield takeLatest(
    loadWebsiteViewerCaption.REQUEST,
    loadWebsiteViewerCaption.requestSaga(loadWebsiteViewerCaptionSaga)
  );
  yield takeLatest(
    likeCaption.REQUEST,
    likeCaption.requestSaga(likeCaptionSaga)
  );
  yield takeLatest(
    dislikeCaption.REQUEST,
    dislikeCaption.requestSaga(dislikeCaptionSaga)
  );
  yield takeLatest(requestFreshTabData, safe(requestFreshTabDataSaga));
  yield takeLatest(closeTab, safe(closeTabSaga));

  yield takeLatest(updateRenderer.type, safe(updateRendererSaga));
  yield takeLatest(closeMenuBar.type, safe(closeMenuBarSaga));
  yield takeLatest(openMenuBar.type, safe(openMenuBarSaga));
}

export default [fork(videoSaga)];
