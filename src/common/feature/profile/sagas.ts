import { fork, takeLatest, call, put, select } from "redux-saga/effects";

import { PayloadAction } from "@reduxjs/toolkit";
import { getLimitOffsetFromPagination } from "@/common/utils";
import { safe } from "@/common/redux-utils";
import {
  assignReviewer,
  assignReviewerManager,
  banCaptioner,
  loadProfile,
  loadUserCaptions,
  setListedCaptions,
  setProfile,
  updateProfile,
  verifyCaptioner,
} from "./actions";
import { CaptionListFields } from "../video/types";
import {
  EditProfileFields,
  LoadProfileParams,
  ProfileState,
  PublicProfileData,
} from "./types";
import {
  PrivateCaptionerData,
  CaptionerState,
  CaptionsPagedRequest,
  CaptionsPagedResult,
} from "../captioner/types";
import {
  loadPrivateCaptionerData,
  setCaptionerPrivateData,
} from "../captioner/actions";
import { captionerSelector } from "../captioner/selectors";
import { profileSelector } from "./selectors";
import { ServerResponse } from "@/common/types";
import { Locator } from "@/common/locator/locator";

function* loadProfileRequestSaga({
  payload,
}: PayloadAction<LoadProfileParams>) {
  const profile: PublicProfileData = yield call(
    [Locator.provider(), "loadProfile"],
    payload
  );

  yield put(loadProfile.success(profile));
}

function* loadProfileSuccessSaga({
  payload: captions,
}: PayloadAction<PublicProfileData>) {
  yield put(setProfile(captions));
}

function* loadUserCaptionsRequestSaga(
  action: PayloadAction<CaptionsPagedRequest>
) {
  const { pageNumber, pageSize, captionerId: captionerId } = action.payload;

  const captions: CaptionListFields[] = yield call(
    [Locator.provider(), "loadUserCaptions"],
    { ...getLimitOffsetFromPagination(pageSize, pageNumber), captionerId }
  );

  yield put(loadUserCaptions.success({ pageNumber, pageSize, captions }));
}

function* loadUserCaptionsSuccessSaga({
  payload: captions,
}: PayloadAction<CaptionsPagedResult>) {
  yield put(setListedCaptions(captions));
}

function* updateProfileRequestSaga({
  payload,
}: PayloadAction<EditProfileFields>) {
  const privateData: PrivateCaptionerData = yield call(
    [Locator.provider(), "updateCaptionerProfile"],
    { ...payload, name: "" }
  );

  yield put(updateProfile.success(privateData));
}

function* updateProfileSuccessSaga({
  payload,
}: PayloadAction<PrivateCaptionerData>) {
  const { captioner, privateProfile } = payload;
  const { captions: captions }: CaptionerState = yield select(
    captionerSelector
  );
  yield put(
    setCaptionerPrivateData({
      captions,
      privateProfile,
      captioner,
    })
  );
}

function* reloadUserId(userId: string) {
  // Update the loaded data
  const { captioner: profileCaptioner }: ProfileState = yield select(
    profileSelector
  );
  if (profileCaptioner && profileCaptioner.userId === userId) {
    yield put(loadProfile.request({ profileId: userId, withCaptions: true }));
  }

  const { captioner: userCaptioner }: CaptionerState = yield select(
    captionerSelector
  );
  if (userCaptioner && userCaptioner.userId === userId) {
    yield put(loadPrivateCaptionerData.request({ withCaptions: true }));
  }
}

function* assignReviewerManagerRequestSaga({
  payload: targetUserId,
}: PayloadAction<string>) {
  const response: ServerResponse = yield call(
    [Locator.provider(), "assignReviewerManager"],
    { targetUserId }
  );
  if (response.status === "error") {
    throw new Error(response.error);
  }

  yield call(reloadUserId, targetUserId);

  yield put(assignReviewerManager.success());
}

function* assignReviewerRequestSaga({
  payload: targetUserId,
}: PayloadAction<string>) {
  const response: ServerResponse = yield call(
    [Locator.provider(), "assignReviewer"],
    { targetUserId }
  );
  if (response.status === "error") {
    throw new Error(response.error);
  }

  yield call(reloadUserId, targetUserId);

  yield put(assignReviewer.success());
}

function* verifyCaptionerRequestSaga({
  payload: targetUserId,
}: PayloadAction<string>) {
  const response: ServerResponse = yield call(
    [Locator.provider(), "verifyCaptioner"],
    { targetUserId }
  );
  if (response.status === "error") {
    throw new Error(response.error);
  }

  yield call(reloadUserId, targetUserId);
  yield put(verifyCaptioner.success());
}

function* banCaptionerRequestSaga({
  payload: targetUserId,
}: PayloadAction<string>) {
  const response: ServerResponse = yield call(
    [Locator.provider(), "banCaptioner"],
    { targetUserId }
  );
  if (response.status === "error") {
    throw new Error(response.error);
  }

  yield call(reloadUserId, targetUserId);
  yield put(banCaptioner.success());
}

function* profileSaga() {
  yield takeLatest(
    loadProfile.REQUEST,
    loadProfile.requestSaga(loadProfileRequestSaga)
  );
  yield takeLatest(loadProfile.SUCCESS, safe(loadProfileSuccessSaga));

  yield takeLatest(
    loadUserCaptions.REQUEST,
    loadUserCaptions.requestSaga(loadUserCaptionsRequestSaga)
  );
  yield takeLatest(loadUserCaptions.SUCCESS, safe(loadUserCaptionsSuccessSaga));

  yield takeLatest(
    updateProfile.REQUEST,
    updateProfile.requestSaga(updateProfileRequestSaga)
  );
  yield takeLatest(updateProfile.SUCCESS, safe(updateProfileSuccessSaga));

  yield takeLatest(
    assignReviewerManager.REQUEST,
    assignReviewerManager.requestSaga(assignReviewerManagerRequestSaga)
  );
  yield takeLatest(
    assignReviewer.REQUEST,
    assignReviewer.requestSaga(assignReviewerRequestSaga)
  );

  yield takeLatest(
    verifyCaptioner.REQUEST,
    verifyCaptioner.requestSaga(verifyCaptionerRequestSaga)
  );

  yield takeLatest(
    banCaptioner.REQUEST,
    banCaptioner.requestSaga(banCaptionerRequestSaga)
  );
}

export default [fork(profileSaga)];
