import { loadCaptions } from "@/common/feature/video/actions";
import { tabVideoDataSelector } from "@/common/feature/video/selectors";
import { TabVideoData } from "@/common/feature/video/types";
import { RootState } from "@/common/store/types";
import { createSelector } from "@reduxjs/toolkit";
import { UserExtensionPreferenceState } from "./types";

export const userExtensionPreferenceSelector = (state: RootState) =>
  state.userExtensionPreference;

export const shouldHideVideoPageMenuSelector = (tabId: number) =>
  createSelector(
    userExtensionPreferenceSelector,
    tabVideoDataSelector(tabId),
    loadCaptions.isLoading(window.tabId),
    (
      userExtensionPreference: UserExtensionPreferenceState,
      tabData: TabVideoData,
      isLoadingCaptions: boolean
    ) => {
      if (!userExtensionPreference.hideToolbarIfNoCaptions) {
        return false;
      }
      if (
        isLoadingCaptions ||
        !tabData.serverCaptionList ||
        tabData.serverCaptionList.length <= 0
      ) {
        return true;
      }
      return false;
    }
  );
