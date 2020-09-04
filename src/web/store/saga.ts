import { all } from "redux-saga/effects";
import loginSagas from "@/common/feature/login/sagas";
import captionerSagas from "@/common/feature/captioner/sagas";
import publicDashboardSaga from "@/common/feature/public-dashboard/sagas";
import profileSaga from "@/common/feature/profile/sagas";
import captionReviewSaga from "@/common/feature/caption-review/sagas";
import searchSaga from "@/common/feature/search/sagas";

export function* rootWebSaga() {
  yield all([
    ...loginSagas,
    ...captionerSagas,
    ...publicDashboardSaga,
    ...profileSaga,
    ...captionReviewSaga,
    ...searchSaga,
  ]);
}
