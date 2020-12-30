import { fork } from "redux-saga/effects";

function* userExtensionPreferenceSaga() {
  /* no-content */
}

export default [fork(userExtensionPreferenceSaga)];
