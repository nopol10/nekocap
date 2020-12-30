import { createReducer } from "@reduxjs/toolkit";
import { UserExtensionPreferenceState } from "./types";
import { setHideToolbarIfNoCaptions } from "./actions";

export const userExtensionPreferenceReducer = createReducer<
  UserExtensionPreferenceState
>(
  {
    hideToolbarIfNoCaptions: false,
  },
  (builder) => {
    return builder.addCase(setHideToolbarIfNoCaptions, (state, action) => {
      return {
        ...state,
        hideToolbarIfNoCaptions: action.payload,
      };
    });
  }
);
