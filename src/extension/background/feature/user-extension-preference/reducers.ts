import { createReducer } from "@reduxjs/toolkit";
import { UserExtensionPreferenceState } from "./types";
import { toggleAutosave, setHideToolbarIfNoCaptions } from "./actions";

export const userExtensionPreferenceReducer = createReducer<
  UserExtensionPreferenceState
>(
  {
    hideToolbarIfNoCaptions: false,
    autosave: true,
  },
  (builder) => {
    return builder
      .addCase(setHideToolbarIfNoCaptions, (state, action) => {
        return {
          ...state,
          hideToolbarIfNoCaptions: action.payload,
        };
      })
      .addCase(toggleAutosave, (state) => {
        return {
          ...state,
          autosave: !state.autosave,
        };
      });
  }
);
