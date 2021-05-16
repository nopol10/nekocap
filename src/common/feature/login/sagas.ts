import { fork, takeLatest, call, put, select, take } from "redux-saga/effects";
import {
  autoLogin,
  loginSuccess,
  loginWithGoogle,
  logout,
  setLoggedIn,
  setUserData,
  webAutoLogin,
  webLoginSuccess,
  webLoginWithGoogle,
  webLogout,
} from "./actions";
import { loginRoutes } from "./routes";
import { PayloadAction } from "@reduxjs/toolkit";
import { safe } from "@/common/redux-utils";
import { LoginRequest } from "./types";
import { userDataSelector } from "./selectors";
import { webGoogleLogout } from "./utils";
import {
  loadPrivateCaptionerData,
  setCaptionerPrivateData,
} from "../captioner/actions";
import { CaptionerState } from "../captioner/types";
import { routePopup } from "@/extension/background/common/saga";
import { isInExtension } from "@/common/client-utils";
import {
  LoginMethod,
  LoginResponse,
  UserData,
} from "@/common/providers/backend-provider";
import { captionerSelector } from "../captioner/selectors";
import * as firebase from "firebase/app";
import "firebase/auth";
import { routeNames } from "@/web/feature/route-types";
import { webHistory } from "@/web/feature/web-history";

function* autoLoginRequestSaga() {
  if (!isInExtension()) {
    return;
  }
  const user = firebase.auth().currentUser;
  if (!user) {
    // This saga shouldn't have been run without a user
    return;
  }
  const idToken = yield call([user, "getIdToken"]);
  const { status, userData }: LoginResponse = yield call(
    [window.backendProvider, "login"],
    LoginMethod.Firebase,
    {
      background: true,
      userData: {
        id: user.uid,
        username: user.displayName,
        idToken,
      },
    }
  );
  yield put(loginSuccess(userData));
}

function* loginWithGoogleRequestSaga({ payload }: PayloadAction<LoginRequest>) {
  const { status, userData }: LoginResponse = yield call(
    [window.backendProvider, "login"],
    LoginMethod.Google,
    { background: payload.background }
  );
  if (status === "error") {
    yield put(loginWithGoogle.failure());
    return;
  }
  yield put(
    loginWithGoogle.success({ ...userData, loginMethod: LoginMethod.Google })
  );
}

function* extensionLoginSuccessSaga({
  payload: userData,
}: PayloadAction<UserData>) {
  yield put(setUserData(userData));
  yield put(setLoggedIn(true));

  // Get user profile
  yield put(loadPrivateCaptionerData.request({ withCaptions: false }));
  // Wait for the captioner's profile to be set before proceeding
  yield take(setCaptionerPrivateData.type);
  const captioner: CaptionerState = yield select(captionerSelector);
  if (userData.isNewUser || !captioner.captioner?.name) {
    yield call(routePopup, loginRoutes.popup.profile);
  } else {
    yield call(routePopup, loginRoutes.popup.dashboard);
  }
}

function* logoutRequestSaga() {
  try {
    const userData: UserData = yield select(userDataSelector);
    yield call([window.backendProvider, "logout"]);
    yield put(logout.success());
  } catch (e) {
    yield put(logout.failure(e));
  }
}

function* logoutSuccessSaga() {
  yield put(setLoggedIn(false));
}

// #region Web Login
function* webAutoLoginRequestSaga() {
  const user = firebase.auth().currentUser;
  if (!user) {
    // This saga shouldn't have been run without a user
    return;
  }
  const idToken = yield call([user, "getIdToken"]);
  const { status, userData }: LoginResponse = yield call(
    [window.backendProvider, "login"],
    LoginMethod.Firebase,
    {
      background: true,
      userData: {
        id: user.uid,
        username: user.displayName,
        idToken,
      },
    }
  );
  yield put(webLoginSuccess(userData));
}

function* webLoginWithGoogleRequestSaga({
  payload,
}: PayloadAction<LoginRequest>) {
  const { background } = payload;
  const { status, userData }: LoginResponse = yield call(
    [window.backendProvider, "login"],
    LoginMethod.Google,
    { background }
  );
  // Retrieve data
  yield put(webLoginSuccess(userData));
}

function* webLogoutRequestSaga() {
  const userData: UserData = yield select(userDataSelector);
  yield call([window.backendProvider, "logout"]);
  // Logout from the auth provider
  if (userData && userData.loginMethod === LoginMethod.Google) {
    yield call(webGoogleLogout);
  }
  yield put(webLogout.success());
}

function* webLogoutSuccessSaga() {
  yield put(setLoggedIn(false));
}

function* webLoginSuccessSaga({ payload: userData }: PayloadAction<UserData>) {
  yield put(setUserData(userData));
  yield put(setLoggedIn(true));
  // Load private data
  yield put(loadPrivateCaptionerData.request({ withCaptions: true }));
  yield take(setCaptionerPrivateData.type);
  const captioner: CaptionerState = yield select(captionerSelector);
  if (userData.isNewUser || !captioner.captioner?.name) {
    if (webHistory) {
      yield call([webHistory, "push"], routeNames.profile.new);
    }
  }
}
// #endregion

export function* loginSaga() {
  yield takeLatest(autoLogin.REQUEST, safe(autoLoginRequestSaga));
  yield takeLatest(
    loginWithGoogle.REQUEST,
    safe(loginWithGoogle.requestSaga(loginWithGoogleRequestSaga))
  );
  yield takeLatest(loginWithGoogle.SUCCESS, safe(extensionLoginSuccessSaga));
  yield takeLatest(loginSuccess, safe(extensionLoginSuccessSaga));

  yield takeLatest(webAutoLogin.REQUEST, safe(webAutoLoginRequestSaga));
  yield takeLatest(
    webLoginWithGoogle.REQUEST,
    safe(webLoginWithGoogleRequestSaga)
  );
  yield takeLatest(webLoginSuccess.type, safe(webLoginSuccessSaga));
  yield takeLatest(
    webLogout.REQUEST,
    safe(webLogout.requestSaga(webLogoutRequestSaga))
  );
  yield takeLatest(webLogout.SUCCESS, safe(webLogoutSuccessSaga));

  yield takeLatest(logout.REQUEST, safe(logoutRequestSaga));
  yield takeLatest(logout.SUCCESS, safe(logoutSuccessSaga));
}

export default [fork(loginSaga)];
