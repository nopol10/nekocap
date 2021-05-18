import { fork, takeLatest, call, put, select } from "redux-saga/effects";

import { PayloadAction } from "@reduxjs/toolkit";
import { getLimitOffsetFromPagination } from "@/common/utils";
import { safe } from "@/common/redux-utils";
import {
  deleteServerCaption,
  loadPrivateCaptionerData,
  loadUserCaptions,
  removeStoreCaption,
  setListedCaptions,
  setCaptionerPrivateData,
  updateCaptionerProfile,
} from "./actions";
import { isLoggedInSelector } from "../login/selectors";
import {
  LoadPrivateCaptionerDataRequestParams,
  PrivateCaptionerData,
  CaptionsPagedRequest,
  CaptionsPagedResult,
  UpdateCaptionerProfileParams,
} from "./types";
import { ServerResponse } from "@/common/types";
import { CaptionListFields } from "../video/types";

function* loadUserCaptionsRequestSaga(
  action: PayloadAction<CaptionsPagedRequest>
) {
  const isLoggedIn = yield select(isLoggedInSelector);
  if (!isLoggedIn) {
    throw new Error("You must be logged in to perform this action!");
  }
  const { pageNumber, pageSize, captionerId } = action.payload;

  const captions: CaptionListFields[] = yield call(
    [window.backendProvider, "loadUserCaptions"],
    {
      ...getLimitOffsetFromPagination(pageSize, pageNumber),
      captionerId,
    }
  );

  yield put(
    loadUserCaptions.success({ pageNumber, pageSize, captions: captions })
  );
}

function* loadUserCaptionsSuccessSaga({
  payload: captions,
}: PayloadAction<CaptionsPagedResult>) {
  yield put(setListedCaptions(captions));
}

function* loadPrivateCaptionerDataRequestSaga(
  action: PayloadAction<LoadPrivateCaptionerDataRequestParams>
) {
  const params = action.payload;
  const isLoggedIn = yield select(isLoggedInSelector);
  if (!isLoggedIn) {
    yield put(loadPrivateCaptionerData.failure());
    return;
  }
  const privateData: PrivateCaptionerData = yield call(
    [window.backendProvider, "loadPrivateCaptionerData"],
    params
  );
  const { captioner, privateProfile, captions } = privateData;
  if (!captioner || !privateProfile || !captions) {
    throw new Error("Received profile data is faulty!");
  }
  yield put(loadPrivateCaptionerData.success(privateData));
}

function* loadPrivateCaptionerDataSuccessSaga({
  payload: privateData,
}: PayloadAction<Required<PrivateCaptionerData>>) {
  yield put(setCaptionerPrivateData(privateData));
}

function* updateCaptionerProfileRequestSaga(
  action: PayloadAction<UpdateCaptionerProfileParams>
) {
  const params = action.payload;
  const isLoggedIn = yield select(isLoggedInSelector);
  if (!isLoggedIn) {
    yield put(loadPrivateCaptionerData.failure());
    return;
  }
  const privateData: PrivateCaptionerData = yield call(
    [window.backendProvider, "updateCaptionerProfile"],
    params
  );
  const { captioner, privateProfile, captions } = privateData;
  if (!captioner || !privateProfile || !captions) {
    throw new Error("Received profile data is faulty!");
  }
  yield put(updateCaptionerProfile.success(privateData));
}

function* updateCaptionerProfileSuccessSaga({
  payload: privateData,
}: PayloadAction<Required<PrivateCaptionerData>>) {
  yield put(setCaptionerPrivateData(privateData));
}

function* deleteServerCaptionSaga(action: PayloadAction<string>) {
  const captionId = action.payload;
  const result: ServerResponse = yield call(
    [window.backendProvider, "deleteCaption"],
    captionId
  );
  if (result.status === "error") {
    throw new Error(result.error);
  }
  // Remove the deleted caption locally
  yield put(removeStoreCaption(captionId));

  yield put(deleteServerCaption.success());
}

export function* captionerSaga() {
  yield takeLatest(
    loadUserCaptions.REQUEST,
    loadUserCaptions.requestSaga(loadUserCaptionsRequestSaga)
  );
  yield takeLatest(loadUserCaptions.SUCCESS, safe(loadUserCaptionsSuccessSaga));
  yield takeLatest(
    loadPrivateCaptionerData.REQUEST,
    loadPrivateCaptionerData.requestSaga(loadPrivateCaptionerDataRequestSaga)
  );
  yield takeLatest(
    loadPrivateCaptionerData.SUCCESS,
    safe(loadPrivateCaptionerDataSuccessSaga)
  );
  yield takeLatest(
    updateCaptionerProfile.REQUEST,
    updateCaptionerProfile.requestSaga(updateCaptionerProfileRequestSaga)
  );
  yield takeLatest(
    deleteServerCaption.REQUEST,
    deleteServerCaption.requestSaga(deleteServerCaptionSaga)
  );
  yield takeLatest(
    updateCaptionerProfile.SUCCESS,
    safe(updateCaptionerProfileSuccessSaga)
  );
}

export default [fork(captionerSaga)];
