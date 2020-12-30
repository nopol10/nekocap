import { all } from "redux-saga/effects";
import loginSagas from "../../../common/feature/login/sagas";
import { ChromeMessageType } from "../../../common/types";
import videoSagas from "@/extension/background/feature/video/sagas";
import captionEditorSaga from "@/extension/background/feature/caption-editor/sagas";
import captionerSagas from "../../../common/feature/captioner/sagas";
import publicDashboardSaga from "../../../common/feature/public-dashboard/sagas";
import profileSaga from "../../../common/feature/profile/sagas";
import captionReviewSaga from "../../../common/feature/caption-review/sagas";
import userExtensionPreerenceSaga from "@/extension/background/feature/user-extension-preference/sagas";

export function* rootSaga() {
  yield all([
    ...loginSagas,
    ...videoSagas,
    ...captionerSagas,
    ...publicDashboardSaga,
    ...profileSaga,
    ...captionReviewSaga,
    ...captionEditorSaga,
    ...userExtensionPreerenceSaga,
  ]);
}

export const routePopup = (route: string) => {
  chrome.runtime.sendMessage({
    type: ChromeMessageType.Route,
    payload: route,
  });
};
