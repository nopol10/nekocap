import { fork, takeLatest, call, put, select } from "redux-saga/effects";

import { PayloadAction } from "@reduxjs/toolkit";
import { safe } from "@/common/redux-utils";
import {
  loadCaptionForReview,
  rejectCaption,
  setReviewData,
  verifyCaption,
} from "./actions";
import {
  LoadCaptionForReviewResult,
  ReasonedCaptionAction,
  CaptionReviewState,
} from "./types";
import { ServerResponse } from "@/common/types";
import { captionReviewSelector } from "./selectors";
import { Locator } from "@/common/locator/locator";

function* loadCaptionForReviewRequestSaga({
  payload: captionId,
}: PayloadAction<string>) {
  const response: LoadCaptionForReviewResult = yield call(
    [Locator.provider(), "loadCaptionForReview"],
    { captionId }
  );
  if (!response) {
    throw new Error("Could not load caption!");
  }

  yield put(loadCaptionForReview.success(response));
}

function* loadCaptionForReviewSuccessSaga({
  payload,
}: PayloadAction<LoadCaptionForReviewResult>) {
  yield put(setReviewData(payload));
}

function* rejectCaptionRequestSaga({
  payload,
}: PayloadAction<ReasonedCaptionAction>) {
  const { status, error }: ServerResponse = yield call(
    [Locator.provider(), "rejectCaption"],
    payload
  );
  if (status !== "success") {
    throw new Error(`Could not reject: ${error}`);
  }

  const { caption }: CaptionReviewState = yield select(captionReviewSelector);
  if (!caption || !caption.id) {
    throw new Error("No caption data found.");
  }
  yield put(loadCaptionForReview.request(caption.id));

  yield put(rejectCaption.success());
}

function* verifyCaptionRequestSaga({
  payload,
}: PayloadAction<ReasonedCaptionAction>) {
  const { status, error }: ServerResponse = yield call(
    [Locator.provider(), "verifyCaption"],
    payload
  );
  if (status !== "success") {
    throw new Error(`Could not reject: ${error}`);
  }

  const { caption }: CaptionReviewState = yield select(captionReviewSelector);
  if (!caption || !caption.id) {
    throw new Error("No caption data found.");
  }
  yield put(loadCaptionForReview.request(caption.id));

  yield put(verifyCaption.success());
}

function* captionReviewSaga() {
  yield takeLatest(
    loadCaptionForReview.REQUEST,
    loadCaptionForReview.requestSaga(loadCaptionForReviewRequestSaga)
  );
  yield takeLatest(
    loadCaptionForReview.SUCCESS,
    safe(loadCaptionForReviewSuccessSaga)
  );
  yield takeLatest(
    rejectCaption.REQUEST,
    rejectCaption.requestSaga(rejectCaptionRequestSaga)
  );
  yield takeLatest(
    verifyCaption.REQUEST,
    verifyCaption.requestSaga(verifyCaptionRequestSaga)
  );
}

export default [fork(captionReviewSaga)];
