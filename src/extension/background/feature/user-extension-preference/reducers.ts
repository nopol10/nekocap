import { createReducer } from "@reduxjs/toolkit";
import { AutoloadMethod, UserExtensionPreferenceState } from "./types";
import {
  toggleAutosave,
  setHideToolbarIfNoCaptions,
  setPreferredLanguage,
  setAutoloadMethod,
} from "./actions";

export const userExtensionPreferenceReducer = createReducer<
  UserExtensionPreferenceState
>(
  {
    hideToolbarIfNoCaptions: false,
    autosave: true,
    preferredLanguage: "en",
    autoloadMethod: AutoloadMethod.NoAutoload,
  },
  (builder) => {
    return builder
      .addCase(setHideToolbarIfNoCaptions, (state, action) => {
        return {
          ...state,
          hideToolbarIfNoCaptions: action.payload,
        };
      })
      .addCase(setAutoloadMethod, (state, action) => {
        return {
          ...state,
          autoloadMethod: action.payload,
        };
      })
      .addCase(setPreferredLanguage, (state, action) => {
        return {
          ...state,
          preferredLanguage: action.payload,
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
