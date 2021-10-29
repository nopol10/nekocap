import {
  fork,
  takeLatest,
  call,
  put,
  select,
  takeEvery,
} from "redux-saga/effects";
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
import { PayloadAction } from "@reduxjs/toolkit";
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
} from "@/common/feature/video/types";
import {
  convertToCaptionContainer,
  videoSourceToProcessorMap,
} from "@/common/feature/video/utils";
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
import { parseCaption } from "@/common/caption-parsers";
import {
  clearHistory,
  setEditorCaptionAfterEdit,
  setEditorRawCaption,
  setShowEditor,
} from "@/common/feature/caption-editor/actions";
import { decompressFromBase64 as lzDecompress } from "lz-string";
import { isAss } from "@/common/caption-utils";
import { take } from "lodash";
import { withSuccess } from "antd/lib/modal/confirm";
import { Locator } from "@/common/locator/locator";
import { loadFontListApi } from "@/common/feature/video/api";
import { SUBSTATION_FONT_LIST } from "@/common/substation-fonts";

function* updateLoadedCaptionFromFileSaga({
  payload,
}: PayloadAction<UpdateLoadedCaptionFromFile>) {
  const { file, content, videoId, videoSource, tabId, type } = payload;
  const format: keyof typeof CaptionFileFormat | undefined =
    CaptionFileFormat[type];
  let rawCaption: RawCaptionData;
  let canAutoConvertToNekoCaption = true;
  let defaultRenderer: CaptionRendererType = CaptionRendererType.Default;
  let fontList = SUBSTATION_FONT_LIST;
  if (format) {
    rawCaption = {
      data: content,
      type: format,
    };
    if (isAss(type)) {
      // The user has to manually initiate the conversion as a large ass will freeze the page
      // Other file formats don't support fancy effects so we'll allow them to be auto converted
      canAutoConvertToNekoCaption = false;
      defaultRenderer = CaptionRendererType.AdvancedOctopus;
      yield put(
        setIsLoadingRawCaption({ loading: true, percentage: 0, tabId })
      );
      fontList = yield call(loadFontListApi);
      yield put(setShowEditor({ tabId, show: false }));
    }
  }

  let caption: CaptionContainer = {
    data: { tracks: [] },
    loadedByUser: true,
    videoId,
    videoSource,
  };
  if (canAutoConvertToNekoCaption) {
    const parsedCaption = parseCaption(type, content);
    caption = convertToCaptionContainer(parsedCaption, videoId, videoSource);
  }

  yield put([
    clearHistory(tabId),
    setFontList({ list: fontList }),
    // Use setEditorCaptionAfterEdit to force one entry to be entered into the undo-redo state so that we can undo back to the original state
    setRenderer({ tabId, renderer: defaultRenderer }),
    setEditorCaptionAfterEdit({ caption, tabId }),
    setEditorRawCaption({ rawCaption, tabId }),
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
  const infoMessage: NotificationMessage = {
    message:
      "You can open the menu again by clicking the NekoCap icon in the extensions toolbar",
    duration: 4,
  };
  chrome.tabs.sendMessage(tabId, {
    type: ChromeMessageType.InfoMessage,
    payload: infoMessage,
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
  yield put(setServerCaptions({ captions: result, tabId }));
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
  }

  yield put([
    clearHistory(tabId),
    setFontList({ list: fontList }),
    setLoadedCaption({ tabId, caption, rawCaption }),
    setRenderer({ tabId, renderer: defaultRenderer }),
    // We set the caption for the editor to this caption, but this does not make it editable.
    // Use setEditorCaptionAfterEdit to force one entry to be entered into the undo-redo state so that we can undo back to the original state
    setEditorCaptionAfterEdit({ tabId, caption }),
    setEditorRawCaption({ tabId, rawCaption }),
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
  const { tabId, newVideoId, newVideoSource, newPageType } = payload;

  // @ts-ignore
  yield put([clearHistory(tabId), clearTabData({ tabId })]);
  yield put(setContentPageType({ tabId, pageType: newPageType }));
  /**
   * This somehow forces the saga to wait for clearTabData to go through the reducer before continuing.
   * Prevents caption loading from finishing before clearTabData, which would erase loaded captions immediately
   */
  yield select(tabVideoDataSelector(tabId));
  if (newPageType === PageType.Video && newVideoId) {
    yield put(
      loadCaptions.request({
        videoId: newVideoId,
        videoSource: newVideoSource,
        tabId,
      })
    );
  }
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
