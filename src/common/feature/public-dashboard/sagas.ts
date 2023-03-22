import { fork, takeLatest, call, put, select } from "redux-saga/effects";

import { PayloadAction } from "@reduxjs/toolkit";
import { safe } from "@/common/redux-utils";
import {
  loadAllCaptions,
  loadLatestCaptions,
  loadLatestUserLanguageCaptions,
  loadPopularCaptions,
  setBrowseResults,
  setLatestCaptions,
  setLatestUserLanguageCaptions,
  setPopularCaptions,
} from "./actions";
import { CaptionListFields } from "../video/types";
import { CaptionsResponse } from "../captioner/types";
import { videoSourceToProcessorMap } from "../video/utils";
import {
  BrowseParams,
  BrowseResults,
  PublicDashboardState,
  SetBrowseResults,
} from "./types";
import { getLimitOffsetFromPagination } from "@/common/utils";
import { publicDashboardSelector } from "./selectors";
import { Locator } from "@/common/locator/locator";

const populateCaptionDetails = async (
  captions: CaptionListFields[]
): Promise<CaptionListFields[]> => {
  const updatedCaptions = await Promise.all(
    captions.map(async (caption) => {
      const processor =
        videoSourceToProcessorMap[parseInt(caption.videoSource)];
      if (!processor) {
        return caption;
      }
      const thumbnailUrl = await processor.generateThumbnailLink(
        caption.videoId
      );
      return {
        ...caption,
        thumbnailUrl,
      };
    })
  );
  return updatedCaptions;
};

function* loadLatestCaptionsRequestSaga() {
  const { captions, status, error }: CaptionsResponse = yield call([
    Locator.provider(),
    "loadLatestCaptions",
  ]);
  if (status !== "success") {
    throw new Error(error);
  }

  const captionsWithDetails = yield call(populateCaptionDetails, captions);

  yield put(loadLatestCaptions.success(captionsWithDetails));
}

function* loadLatestCaptionsSuccessSaga({
  payload: captions,
}: PayloadAction<CaptionListFields[]>) {
  yield put(setLatestCaptions(captions));
}

function* loadLatestUserLanguageCaptionsRequestSaga({
  payload: languageCode,
}: PayloadAction<string>) {
  const {
    captions: captions,
    status,
    error,
  }: CaptionsResponse = yield call(
    [Locator.provider(), "loadLatestUserLanguageCaptions"],
    languageCode
  );
  if (status !== "success") {
    throw new Error(error);
  }
  const captionsWithDetails = yield call(populateCaptionDetails, captions);

  yield put(loadLatestUserLanguageCaptions.success(captionsWithDetails));
}

function* loadLatestUserLanguageCaptionsSuccessSaga({
  payload: captions,
}: PayloadAction<CaptionListFields[]>) {
  yield put(setLatestUserLanguageCaptions(captions));
}

function* loadPopularCaptionsRequestSaga() {
  const { captions, status, error }: CaptionsResponse = yield call([
    Locator.provider(),
    "loadPopularCaptions",
  ]);

  if (status !== "success") {
    throw new Error(error);
  }
  yield put(loadPopularCaptions.success(captions));
}

function* loadPopularCaptionsSuccessSaga({
  payload: captions,
}: PayloadAction<CaptionListFields[]>) {
  yield put(setPopularCaptions(captions));
}

function* loadAllCaptionsRequestSaga(action: PayloadAction<BrowseParams>) {
  const { pageSize, pageNumber, append = false, ...rest } = action.payload;
  const {
    browseResults = [],
    hasMoreResults: originalHasMoreResults,
    totalResults,
  }: PublicDashboardState = yield select(publicDashboardSelector);
  const displayedCaptionCount =
    browseResults.length + (originalHasMoreResults ? 1 : 0);
  const listStartIndex = (pageNumber - 1) * pageSize;
  const listEndIndex = listStartIndex + pageSize;
  const hasUnloadedCaption = browseResults
    .slice((pageNumber - 1) * pageSize, listEndIndex)
    .some((caption) => !caption);
  if (
    !hasUnloadedCaption &&
    append &&
    (pageNumber !== Math.ceil(displayedCaptionCount / pageSize) ||
      !originalHasMoreResults)
  ) {
    // Only fetch more results when browsing to the last page. Otherwise just update the current page
    yield put(
      loadAllCaptions.success({
        hasMoreResults: originalHasMoreResults,
        currentResultPage: pageNumber,
        pageSize,
        captions: browseResults,
        append: false,
        totalResults,
      })
    );
    return;
  }
  const { status, error, captions, hasMoreResults, totalCount }: BrowseResults =
    yield call([Locator.provider(), "browse"], {
      ...getLimitOffsetFromPagination(pageSize, pageNumber),
      ...rest,
    });
  if (status === "error") {
    throw new Error(error);
  }

  yield put(
    loadAllCaptions.success({
      hasMoreResults,
      currentResultPage: pageNumber,
      pageSize,
      captions,
      append,
      totalResults: totalCount || 0,
    })
  );
}

function* loadAllCaptionsSuccessSaga({
  payload: captions,
}: PayloadAction<SetBrowseResults>) {
  yield put(setBrowseResults(captions));
}

function* publicDashboardSaga() {
  yield takeLatest(
    loadLatestCaptions.REQUEST,
    loadLatestCaptions.requestSaga(loadLatestCaptionsRequestSaga)
  );
  yield takeLatest(
    loadLatestCaptions.SUCCESS,
    safe(loadLatestCaptionsSuccessSaga)
  );

  yield takeLatest(
    loadLatestUserLanguageCaptions.REQUEST,
    loadLatestUserLanguageCaptions.requestSaga(
      loadLatestUserLanguageCaptionsRequestSaga
    )
  );
  yield takeLatest(
    loadLatestUserLanguageCaptions.SUCCESS,
    safe(loadLatestUserLanguageCaptionsSuccessSaga)
  );

  yield takeLatest(
    loadPopularCaptions.REQUEST,
    loadPopularCaptions.requestSaga(loadPopularCaptionsRequestSaga)
  );
  yield takeLatest(
    loadPopularCaptions.SUCCESS,
    safe(loadPopularCaptionsSuccessSaga)
  );

  yield takeLatest(
    loadAllCaptions.REQUEST,
    loadAllCaptions.requestSaga(loadAllCaptionsRequestSaga)
  );
  yield takeLatest(loadAllCaptions.SUCCESS, safe(loadAllCaptionsSuccessSaga));
}

export default [fork(publicDashboardSaga)];
