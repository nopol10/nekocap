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
import { LoginRequest, WebAutoLoginRequest, WebLoginSuccess } from "./types";
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
import { routeNames } from "@/web/feature/route-types";
import { webHistory } from "@/web/feature/web-history";
import { Locator } from "@/common/locator/locator";
import type { User as FirebaseUser } from "firebase/auth";

function* autoLoginRequestSaga() {
  if (!isInExtension()) {
    return;
  }
  const user: FirebaseUser = globalThis.firebaseAuth.currentUser;
  if (!user) {
    // This saga shouldn't have been run without a user
    return;
  }
  const idToken = yield call([user, "getIdToken"]);
  const { status, userData }: LoginResponse = yield call(
    [Locator.provider(), "login"],
    LoginMethod.Firebase,
    {
      background: true,
      userData: {
        id: user.uid,
        username: user.displayName || "",
        idToken,
      },
    }
  );
  if (status === "deferred") {
    return;
  }
  if (!userData) {
    console.warn("No user data found");
    return;
  }
  yield put(loginSuccess(userData));
}

function* loginWithGoogleRequestSaga({ payload }: PayloadAction<LoginRequest>) {
  const { status, userData }: LoginResponse = yield call(
    [Locator.provider(), "login"],
    LoginMethod.Google,
    { background: payload.background }
  );
  if (status === "deferred") {
    return;
  }
  if (status === "error" || !userData) {
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
    yield call([Locator.provider(), "logout"]);
    yield put(logout.success());
  } catch (e) {
    yield put(logout.failure(e));
  }
}

function* logoutSuccessSaga() {
  yield put(setLoggedIn(false));
}

// #region Web Login
function* webAutoLoginRequestSaga({
  payload: { withCaptions },
}: PayloadAction<WebAutoLoginRequest>) {
  const user: FirebaseUser = globalThis.firebaseAuth.currentUser;
  if (!user) {
    // This saga shouldn't have been run without a user
    return;
  }
  const idToken = yield call([user, "getIdToken"]);
  const { status, userData }: LoginResponse = yield call(
    [Locator.provider(), "login"],
    LoginMethod.Firebase,
    {
      background: true,
      userData: {
        id: user.uid,
        username: user.displayName || "",
        idToken,
      },
    }
  );
  if (status === "deferred") {
    return;
  }
  if (!userData) {
    console.warn("No user data found");
    return;
  }
  yield put(webLoginSuccess({ userData, withCaptions }));
}

function* webLoginWithGoogleRequestSaga({
  payload,
}: PayloadAction<LoginRequest>) {
  const { background, withCaptions } = payload;
  const { status, userData }: LoginResponse = yield call(
    [Locator.provider(), "login"],
    LoginMethod.Google,
    { background }
  );
  if (status === "deferred") {
    return;
  }
  if (!userData) {
    console.warn("No user data found");
    return;
  }
  // Retrieve data
  yield put(webLoginSuccess({ userData, withCaptions }));
}

function* webLogoutRequestSaga() {
  const userData: UserData = yield select(userDataSelector);
  yield call([Locator.provider(), "logout"]);
  // Logout from the auth provider
  if (userData && userData.loginMethod === LoginMethod.Google) {
    yield call(webGoogleLogout);
  }
  yield put(webLogout.success());
}

function* webLogoutSuccessSaga() {
  yield put(setLoggedIn(false));
}

function* webLoginSuccessSaga({
  payload: { userData, withCaptions },
}: PayloadAction<WebLoginSuccess>) {
  yield put([setUserData(userData), setLoggedIn(true)]);
  // Load private data
  yield put(loadPrivateCaptionerData.request({ withCaptions }));
  yield take(setCaptionerPrivateData.type);
  const captioner: CaptionerState = yield select(captionerSelector);
  if (
    (userData.isNewUser || !captioner.captioner?.name) &&
    typeof location !== "undefined" &&
    location.pathname !== routeNames.extensionSignIn
  ) {
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

  yield takeLatest(
    webAutoLogin.REQUEST,
    safe(webAutoLogin.requestSaga(webAutoLoginRequestSaga))
  );
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
