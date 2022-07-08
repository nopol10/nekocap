import { languages } from "@/common/languages";
import { createAction } from "@reduxjs/toolkit";
import { userExtensionPreferenceActionTypes } from "./action-types";
import { AutoloadMethod } from "./types";

export const setHideToolbarIfNoCaptions = createAction<boolean>(
  userExtensionPreferenceActionTypes.setHideToolbarIfNoCaptions
);

export const toggleAutosave = createAction(
  userExtensionPreferenceActionTypes.toggleAutosave
);

export const setPreferredLanguage = createAction<
  keyof typeof languages | "none"
>(userExtensionPreferenceActionTypes.setPreferredLanguage);

export const setAutoloadMethod = createAction<AutoloadMethod>(
  userExtensionPreferenceActionTypes.setAutoloadMethod
);
