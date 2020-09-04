import { createAction } from "@reduxjs/toolkit";
import {
  createSignalAction,
  createSignalActionInState,
} from "@/common/store/action";
import { loginActionTypes } from "./action-types";
import { LoginRequest } from "./types";
import { UserData } from "@/common/providers/backend-provider";

const csa = createSignalActionInState("login");

export const autoLogin = csa(loginActionTypes.autoLogin);

export const loginWithGoogle = csa<LoginRequest, UserData>(
  loginActionTypes.loginWithGoogle
);

export const loginSuccess = createAction<UserData>(
  loginActionTypes.loginSuccess
);

export const logout = csa(loginActionTypes.logout);

export const webAutoLogin = csa(loginActionTypes.webAutoLogin);

export const webLoginWithGoogle = csa<LoginRequest, UserData>(
  loginActionTypes.webLoginWithGoogle
);

export const webLoginSuccess = createAction<UserData>(
  loginActionTypes.webLoginSuccess
);

export const webLogout = csa(loginActionTypes.webLogout);

export const setLoggedIn = createAction<boolean>(loginActionTypes.setLoggedIn);
export const setUserData = createAction<UserData>(loginActionTypes.setUserData);
