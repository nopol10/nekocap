import { createReducer } from "@reduxjs/toolkit";
import { loginActionTypes } from "./action-types";
import { setLoggedIn, setUserData, webLogout } from "./actions";
import { LoginState } from "./types";

const initialState: LoginState = {
  loggedIn: false,
};
export const loginReducer = createReducer<LoginState>(
  initialState,
  (builder) => {
    webLogout.augmentReducer(builder);
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
      });
  }
);
