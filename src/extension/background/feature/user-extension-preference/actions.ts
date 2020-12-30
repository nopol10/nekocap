import { createAction } from "@reduxjs/toolkit";
import { userExtensionPreferenceActionTypes } from "./action-types";

export const setHideToolbarIfNoCaptions = createAction<boolean>(
  userExtensionPreferenceActionTypes.setHideToolbarIfNoCaptions
);
