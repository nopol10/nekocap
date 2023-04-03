import { message } from "antd";
import React, { useCallback, useEffect, useState } from "react";
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
import { EDITOR_OPEN_ATTRIBUTE } from "@/common/constants";
import { shouldAutosaveSelector } from "@/extension/background/feature/user-extension-preference/selectors";
import { AUTOSAVE_INTERVAL } from "../feature/editor/constants";
import { hasSaveData } from "@/extension/background/feature/caption-editor/utils";
import { ConfirmSaveModal } from "./confirm-save-modal";

const editorMenuComponent = <VideoPageMenu inEditorScreen={true} />;

const useAutosave = () => {
  const dispatch = useDispatch();
  const shouldAutosave = useSelector(shouldAutosaveSelector);
  const showEditor = useSelector(showEditorSelector(globalThis.tabId));

  useEffect(() => {
    let intervalId = 0;
    if (shouldAutosave && showEditor) {
      intervalId = window.setInterval(() => {
        dispatch(
          saveLocalCaption.request({
            tabId: globalThis.tabId,
            videoId: globalThis.videoId,
            videoSource: globalThis.videoSource,
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
  const videoData = useSelector(tabVideoDataSelector(globalThis.tabId));
  const editorData = useSelector(tabEditorDataSelector(globalThis.tabId));
  const showEditor = useSelector(showEditorSelector(globalThis.tabId));
  const canUndo = useSelector(canEditorUndoSelector(globalThis.tabId));
  const canRedo = useSelector(canEditorRedoSelector(globalThis.tabId));
  const keyboardShortcuts = useSelector(keyboardShortcutsSelector);
  const isUserCaptionLoaded = useSelector(
    isUserCaptionLoadedSelector(globalThis.tabId)
  );
  const isSubmitting = useSelector(submitCaption.isLoading(globalThis.tabId));
  const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false);
  const [skipSaveConfirmation, setSkipSaveConfirmation] = useState(false);

  useAutosave();

  // Effect to clear and restore hotkeys present in the streaming site
  useEffect(() => {
    if (!globalThis.selectedProcessor) {
      return;
    }
    if (showEditor) {
      document.body.setAttribute(EDITOR_OPEN_ATTRIBUTE, "true");
      globalThis.selectedProcessor.onEditorOpen();
    } else {
      document.body.removeAttribute(EDITOR_OPEN_ATTRIBUTE);
      globalThis.selectedProcessor.onEditorClose();
    }
  }, [showEditor]);

  const handleUndo = useCallback(() => {
    dispatch(undoEditorTriggerAction({ tabId: globalThis.tabId }));
  }, [dispatch]);

  const handleRedo = useCallback(() => {
    dispatch(redoEditorTriggerAction({ tabId: globalThis.tabId }));
  }, [dispatch]);

  const handleForceSave = useCallback(
    (skipConfirmation?: boolean) => {
      if (skipConfirmation !== undefined) {
        setSkipSaveConfirmation(skipConfirmation);
      }
      setIsConfirmSaveOpen(false);
      dispatch(
        saveLocalCaption.request({
          tabId: globalThis.tabId,
          videoId: globalThis.videoId,
          videoSource: globalThis.videoSource,
        })
      ).then(() => {
        message.success("Saved!");
      });
    },
    [dispatch]
  );

  const handleSave = useCallback(async () => {
    const hasSave = await hasSaveData(
      globalThis.videoId,
      globalThis.videoSource
    );
    if (hasSave && !skipSaveConfirmation) {
      setIsConfirmSaveOpen(true);
      return;
    }
    handleForceSave();
  }, [skipSaveConfirmation, handleForceSave, setIsConfirmSaveOpen]);

  const handleExport = useCallback(
    (fileFormat: keyof typeof CaptionFileFormat) => {
      dispatch(
        exportCaption.request({
          tabId: globalThis.tabId,
          format: fileFormat,
        })
      );
    },
    [dispatch]
  );

  const handleUpdateCaption = useCallback(
    (action: PayloadAction<CaptionAction>, callback?: () => void) => {
      dispatch(updateEditorCaption({ action, tabId: globalThis.tabId })).then(
        () => {
          if (callback) {
            callback();
          }
        }
      );
    },
    [dispatch]
  );

  const handleCancelConfirmSaveModal = useCallback(() => {
    setIsConfirmSaveOpen(false);
  }, [setIsConfirmSaveOpen]);

  const caption =
    isUserCaptionLoaded && editorData && editorData.caption
      ? editorData.caption
      : videoData?.caption;

  return (
    <>
      <ConfirmSaveModal
        visible={isConfirmSaveOpen}
        onCancel={handleCancelConfirmSaveModal}
        onDone={handleForceSave}
        showSkipBox={true}
      />
      <CaptionEditor
        captionContainer={caption}
        showEditor={showEditor}
        captionContainerElement={globalThis.captionContainerElement}
        videoElement={globalThis.videoElement}
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
