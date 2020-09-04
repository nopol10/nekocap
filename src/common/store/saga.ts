import { all } from "redux-saga/effects";
import loginSagas from "../feature/login/sagas";
import { ChromeMessageType } from "../types";
import videoSagas from "@/background/feature/video/sagas";
import captionEditorSaga from "@/background/feature/caption-editor/sagas";
import captionerSagas from "../feature/captioner/sagas";
import publicDashboardSaga from "../feature/public-dashboard/sagas";
import profileSaga from "../feature/profile/sagas";
import captionReviewSaga from "../feature/caption-review/sagas";

export function* rootSaga() {
  yield all([
    ...loginSagas,
    ...videoSagas,
    ...captionerSagas,
    ...publicDashboardSaga,
    ...profileSaga,
    ...captionReviewSaga,
    ...captionEditorSaga,
  ]);
}

export const routePopup = (route: string) => {
  chrome.runtime.sendMessage({
    type: ChromeMessageType.Route,
    payload: route,
  });
};
