import { fork, takeLatest, call, put, select } from "redux-saga/effects";

import { PayloadAction } from "@reduxjs/toolkit";
import { safe } from "@/common/redux-utils";
import {
  loadLatestCaptions,
  loadLatestUserLanguageCaptions,
  loadPopularCaptions,
  setLatestCaptions,
  setLatestUserLanguageCaptions,
  setPopularCaptions,
} from "./actions";
import { CaptionListFields } from "../video/types";
import { CaptionsResponse } from "../captioner/types";
import { videoSourceToProcessorMap } from "../video/utils";

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
  const { captions, status, error }: CaptionsResponse = yield call(
    window.backendProvider.loadLatestCaptions
  );
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
  const { captions: captions, status, error }: CaptionsResponse = yield call(
    window.backendProvider.loadLatestUserLanguageCaptions,
    languageCode
  );
  if (status !== "success") {
    throw new Error(error);
  }
  yield put(loadLatestUserLanguageCaptions.success(captions));
}

function* loadLatestUserLanguageCaptionsSuccessSaga({
  payload: captions,
}: PayloadAction<CaptionListFields[]>) {
  yield put(setLatestUserLanguageCaptions(captions));
}

function* loadPopularCaptionsRequestSaga() {
  const { captions, status, error }: CaptionsResponse = yield call(
    window.backendProvider.loadPopularCaptions
  );

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
}

export default [fork(publicDashboardSaga)];
