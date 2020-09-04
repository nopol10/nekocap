import { message } from "antd";
import React, { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CaptionFileFormat } from "@/common/types";
import {
  undoEditorTriggerAction,
  redoEditorTriggerAction,
  updateEditorCaption,
  saveLocalCaption,
  exportCaption,
  submitCaption,
  CaptionAction,
} from "@/common/feature/caption-editor/actions";
import {
  canEditorRedoSelector,
  canEditorUndoSelector,
  isUserCaptionLoadedSelector,
  keyboardShortcutsSelector,
  showEditorSelector,
  tabEditorDataSelector,
} from "@/common/feature/caption-editor/selectors";
import { tabVideoDataSelector } from "@/common/feature/video/selectors";
import { CaptionEditor } from "../feature/editor/components/caption-editor";
import { VideoPageMenu } from "./video-page-menu";
import { PayloadAction } from "@reduxjs/toolkit";

const editorMenuComponent = <VideoPageMenu inEditorScreen={true} />;

export const EditorContainer = () => {
  const dispatch = useDispatch();
  const videoData = useSelector(tabVideoDataSelector(window.tabId));
  const editorData = useSelector(tabEditorDataSelector(window.tabId));
  const showEditor = useSelector(showEditorSelector(window.tabId));
  const canUndo = useSelector(canEditorUndoSelector(window.tabId));
  const canRedo = useSelector(canEditorRedoSelector(window.tabId));
  const keyboardShortcuts = useSelector(keyboardShortcutsSelector);
  const isUserCaptionLoaded = useSelector(
    isUserCaptionLoadedSelector(window.tabId)
  );
  const isSubmitting = useSelector(submitCaption.isLoading(window.tabId));

  // Effect to clear and restore hotkeys present in the streaming site
  useEffect(() => {
    if (!window.selectedProcessor) {
      return;
    }
    if (showEditor) {
      window.selectedProcessor.clearHotkeys();
    } else {
      window.selectedProcessor.restoreHotkeys();
    }
  }, [showEditor]);

  const handleUndo = useCallback(() => {
    dispatch(undoEditorTriggerAction({ tabId: window.tabId }));
  }, []);

  const handleRedo = useCallback(() => {
    dispatch(redoEditorTriggerAction({ tabId: window.tabId }));
  }, []);

  const handleSave = useCallback(() => {
    dispatch(
      saveLocalCaption.request({
        tabId: window.tabId,
        videoId: window.videoId,
        videoSource: window.videoSource,
      })
    ).then(() => {
      message.success("Saved!");
    });
  }, []);

  const handleExport = useCallback(
    (fileFormat: keyof typeof CaptionFileFormat) => {
      dispatch(
        exportCaption.request({
          tabId: window.tabId,
          format: fileFormat,
        })
      );
    },
    []
  );

  const handleUpdateCaption = useCallback(
    (action: PayloadAction<CaptionAction>) => {
      dispatch(updateEditorCaption({ action, tabId: window.tabId }));
    },
    []
  );

  const caption =
    isUserCaptionLoaded && editorData && editorData.caption
      ? editorData.caption
      : videoData?.caption;

  return (
    <>
      <CaptionEditor
        captionContainer={caption}
        showEditor={showEditor}
        captionContainerElement={window.captionContainerElement}
        videoElement={window.videoElement}
        videoMenuComponent={editorMenuComponent}
        updateCaption={handleUpdateCaption}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        onSave={handleSave}
        onExport={handleExport}
        keyboardShortcuts={keyboardShortcuts}
        isSubmitting={isSubmitting}
      />
    </>
  );
};
