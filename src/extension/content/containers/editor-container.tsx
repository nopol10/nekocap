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
  hasEditorCaptionDataSelector,
  isUserCaptionLoadedSelector,
  keyboardShortcutsSelector,
  showEditorSelector,
  tabEditorDataSelector,
} from "@/common/feature/caption-editor/selectors";
import { tabVideoDataSelector } from "@/common/feature/video/selectors";
import { CaptionEditor } from "../feature/editor/components/caption-editor";
import { VideoPageMenu } from "./video-page-menu";
import { PayloadAction } from "@reduxjs/toolkit";
import { EDITOR_OPEN_ATTRIBUTE } from "@/common/constants";
import { shouldAutosaveSelector } from "@/extension/background/feature/user-extension-preference/selectors";
import { AUTOSAVE_INTERVAL } from "../feature/editor/constants";

const editorMenuComponent = <VideoPageMenu inEditorScreen={true} />;

const useAutosave = () => {
  const dispatch = useDispatch();
  const shouldAutosave = useSelector(shouldAutosaveSelector);
  const showEditor = useSelector(showEditorSelector(window.tabId));

  useEffect(() => {
    let intervalId = 0;
    if (shouldAutosave && showEditor) {
      intervalId = setInterval(() => {
        dispatch(
          saveLocalCaption.request({
            tabId: window.tabId,
            videoId: window.videoId,
            videoSource: window.videoSource,
            mustHaveData: true,
          })
        ).then(() => {
          message.success("Autosaved!");
        });
      }, AUTOSAVE_INTERVAL);
    }
    return () => {
      clearInterval(intervalId);
    };
  }, [shouldAutosave, dispatch, showEditor]);
};

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

  useAutosave();

  // Effect to clear and restore hotkeys present in the streaming site
  useEffect(() => {
    if (!window.selectedProcessor) {
      return;
    }
    if (showEditor) {
      document.body.setAttribute(EDITOR_OPEN_ATTRIBUTE, "true");
      window.selectedProcessor.onEditorOpen();
    } else {
      document.body.removeAttribute(EDITOR_OPEN_ATTRIBUTE);
      window.selectedProcessor.onEditorClose();
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
    (action: PayloadAction<CaptionAction>, callback?: () => void) => {
      dispatch(updateEditorCaption({ action, tabId: window.tabId })).then(
        () => {
          if (callback) {
            callback();
          }
        }
      );
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
