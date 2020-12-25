import { combineReducers, ReducersMapObject } from "@reduxjs/toolkit";
import { loginReducer } from "@/common/feature/login/reducers";
import { videoReducer } from "../feature/video/reducers";
import { captionerReducer } from "@/common/feature/captioner/reducers";
import { publicDashboardReducer } from "@/common/feature/public-dashboard/reducers";
import { profileReducer } from "@/common/feature/profile/reducers";
import { captionReviewReducer } from "@/common/feature/caption-review/reducers";
import { searchReducer } from "@/common/feature/search/reducers";
import { captionEditorReducer } from "../feature/caption-editor/reducers";
import { userExtensionPreferenceReducer } from "../feature/user-extension-preference/reducers";
import { persistReducer } from "redux-persist";
import { syncStorage } from "redux-persist-webextension-storage";

const userExtensionPreferenceSyncStorageConfig = {
  key: "userExtensionPreferenceSyncStorage",
  storage: syncStorage,
};

export const createRootReducer = (additionalReducers?: ReducersMapObject) => {
  return combineReducers({
    // Insert reducers from features here
    ...additionalReducers,

    login: loginReducer,
    video: videoReducer,
    captioner: captionerReducer,
    captionReview: captionReviewReducer,
    publicDashboard: publicDashboardReducer,
    profile: profileReducer,
    search: searchReducer,
    captionEditor: captionEditorReducer,
    userExtensionPreference: persistReducer(
      userExtensionPreferenceSyncStorageConfig,
      userExtensionPreferenceReducer
    ),
  });
};
