import { isInBackgroundScript } from "@/common/client-utils";
import { RootState } from "@/common/store/types";
import { createSelector } from "@reduxjs/toolkit";
import { captionerSelector } from "../captioner/selectors";
import { RawCaptionData } from "../video/types";

export const tabEditorDataSelector = (tabId: number) => (state: RootState) => {
  const tabData = state.captionEditor.tabData;
  if (!tabData || !tabData[tabId]) {
    return undefined;
  }
  return state.captionEditor.tabData[tabId].present;
};

/**
 * Returns whether there is any user entered caption data
 * @param tabId
 */
export const hasEditorCaptionDataSelector = (tabId: number) => (
  state: RootState
) => {
  const tabData = state.captionEditor.tabData;
  if (!tabData || !tabData[tabId]) {
    return undefined;
  }
  const editorData = state.captionEditor.tabData[tabId].present;
  if (
    !editorData ||
    !editorData.caption ||
    !editorData.caption.data ||
    !editorData.caption.data.tracks ||
    editorData.caption.data.tracks.length <= 0
  ) {
    return false;
  }
  for (
    let trackId = 0;
    trackId < editorData.caption.data.tracks.length;
    trackId++
  ) {
    const { cues } = editorData.caption.data.tracks[trackId];
    for (let cueId = 0; cueId < cues.length; cueId++) {
      if (cues[cueId].text) {
        return true;
      }
    }
  }
  return false;
};

export const tabEditorRawDataSelector = (tabId: number) => (
  state: RootState
): RawCaptionData => {
  const background = isInBackgroundScript();
  const tabRawData = background
    ? window.backgroundEditorRawCaption[tabId]
    : window.editorRawCaption; // state.captionEditor.tabRawData;
  // if (!tabRawData || !tabRawData[tabId]) {
  if (!tabRawData) {
    return undefined;
  }
  return tabRawData;
};

export const loadedEditorCaptionSelector = (tabId: number) => (
  state: RootState
) => {
  const tabData = state.captionEditor.tabData;
  if (!tabData || !tabData[tabId]) {
    return undefined;
  }
  return state.captionEditor.tabData[tabId].present.caption;
};

export const showEditorIfPossibleSelector = (tabId: number) => (
  state: RootState
) => {
  const tabData = state.captionEditor.tabData;
  if (!tabData || !tabData[tabId]) {
    return undefined;
  }
  return state.captionEditor.tabData[tabId].present.showEditorIfPossible;
};

export const keyboardShortcutsSelector = (state: RootState) => {
  return state.captionEditor.keyboardShortcuts;
};

export const currentShortcutTypeSelector = (state: RootState) => {
  return state.captionEditor.shortcutType;
};

/**
 * Is the loaded caption created by the current user?
 * @param tabId
 */
export const isUserCaptionLoadedSelector = (tabId: number) =>
  createSelector(
    tabEditorDataSelector(tabId),
    captionerSelector,
    (editorData, captioner) => {
      if (!editorData || !editorData.caption) {
        return false;
      }
      const caption = editorData.caption;
      return (
        caption.loadedByUser ||
        (caption.creator &&
          captioner &&
          captioner.captioner &&
          caption.creator === captioner.captioner.userId)
      );
    }
  );

export const showEditorSelector = (tabId: number) =>
  createSelector(
    isUserCaptionLoadedSelector(tabId),
    showEditorIfPossibleSelector(tabId),
    (isUserCaptionLoaded, showEditorIfPossible) => {
      return isUserCaptionLoaded && showEditorIfPossible;
    }
  );

export const canEditorUndoSelector = (tabId: number) => (state: RootState) => {
  const tabData = state.captionEditor.tabData;
  if (!tabData || !tabData[tabId]) {
    return false;
  }
  return state.captionEditor.tabData[tabId].past.length > 1;
};

export const canEditorRedoSelector = (tabId: number) => (state: RootState) => {
  const tabData = state.captionEditor.tabData;
  if (!tabData || !tabData[tabId]) {
    return false;
  }
  return state.captionEditor.tabData[tabId].future.length > 0;
};
