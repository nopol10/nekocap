import { RootState } from "@/common/store/types";
import { createSelector } from "@reduxjs/toolkit";
import { captionerSelector } from "../captioner/selectors";

export const tabEditorDataSelector = (tabId: number) => (state: RootState) => {
  const tabData = state.captionEditor.tabData;
  if (!tabData || !tabData[tabId]) {
    return undefined;
  }
  return state.captionEditor.tabData[tabId].present;
};

export const tabEditorRawDataSelector = (tabId: number) => (
  state: RootState
) => {
  const tabRawData = state.captionEditor.tabRawData;
  if (!tabRawData || !tabRawData[tabId]) {
    return undefined;
  }
  return state.captionEditor.tabRawData[tabId];
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
