import { hydrate } from "@/web/store/action";
import { createReducer } from "@reduxjs/toolkit";
import { setLoggedIn, setUserData, webAutoLogin, webLogout } from "./actions";
import { LoginState } from "./types";

const initialState: LoginState = {
  loggedIn: false,
};
export const loginReducer = createReducer<LoginState>(
  initialState,
  (builder) => {
    webLogout.augmentReducer(builder);
    webAutoLogin.augmentReducer(builder);
    return builder
      .addCase(setLoggedIn, (state, action) => {
        const loggedIn = action.payload;
        return {
          ...state,
          loggedIn,
          userData: loggedIn ? state.userData : undefined,
        };
      })
      .addCase(setUserData, (state, action) => {
        return {
          ...state,
          userData: action.payload,
        };
      })
      .addCase(hydrate, (state, action) => {
        const currentLoginState = state.loggedIn;
        const currentUserData = state.userData;
        return {
          ...state,
          ...action.payload.login,
          // Prevent hydration from clearing the user's logged in state
          ...{
            loggedIn: currentLoginState
              ? currentLoginState
              : action.payload.login.loggedIn,
            userData: currentLoginState
              ? currentUserData
              : action.payload.login.userData,
          },
        };
      });
  }
);
