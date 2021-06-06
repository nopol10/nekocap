import captionReviewSaga from "@/common/feature/caption-review/sagas";
import captionerSagas from "@/common/feature/captioner/sagas";
import loginSagas from "@/common/feature/login/sagas";
import profileSaga from "@/common/feature/profile/sagas";
import publicDashboardSaga from "@/common/feature/public-dashboard/sagas";
import searchSaga from "@/common/feature/search/sagas";
import captionEditorSaga from "@/extension/background/feature/caption-editor/sagas";
import videoSagas from "@/extension/background/feature/video/sagas";
import { all } from "redux-saga/effects";

export function* rootWebSaga() {
  yield all([
    ...loginSagas,
    ...videoSagas,
    ...captionerSagas,
    ...publicDashboardSaga,
    ...profileSaga,
    ...captionReviewSaga,
    ...searchSaga,
    ...captionEditorSaga,
  ]);
}
