import { EDITOR_OPEN_ATTRIBUTE } from "@/common/constants";
import {
  CaptionAction,
  exportCaption,
  redoEditorTriggerAction,
  saveLocalCaption,
  submitCaption,
  undoEditorTriggerAction,
  updateEditorCaption,
} from "@/common/feature/caption-editor/actions";
import {
  canEditorRedoSelector,
  canEditorUndoSelector,
  inWebEditorSelector,
  isUserCaptionLoadedSelector,
  keyboardShortcutsSelector,
  showEditorSelector,
  tabEditorDataSelector,
  tabEditorRawDataSelector,
} from "@/common/feature/caption-editor/selectors";
import { tabVideoDataSelector } from "@/common/feature/video/selectors";
import { CaptionFileFormat } from "@/common/types";
import { hasSaveData } from "@/extension/background/feature/caption-editor/utils";
import { shouldAutosaveSelector } from "@/extension/background/feature/user-extension-preference/selectors";
import { CaptionEditor } from "@/extension/content/feature/editor/components/caption-editor";
import { useToggle } from "@/hooks";
import { PayloadAction } from "@reduxjs/toolkit";
import { message } from "antd";
import {
  FunctionComponent,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { AUTOSAVE_INTERVAL } from "../feature/editor/constants";
import { VideoPlayer } from "../feature/editor/video-player/video-player";
import { ConfirmSaveModal } from "./confirm-save-modal";
import { VideoPageMenu } from "./video-page-menu";
import { WebEditorToolbarActions } from "./web-editor-toolbar-actions";

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
          }),
        )
          .then(() => {
            message.success("Autosaved!");
          })
          .catch(() => {
            /* intentionally empty */
          });
      }, AUTOSAVE_INTERVAL);
    }
    return () => {
      clearInterval(intervalId);
    };
  }, [shouldAutosave, dispatch, showEditor]);
};

export type EditorContainerProps = {
  playerOverride?: VideoPlayer;
  children?: ReactNode;
};

export const EditorContainer: FunctionComponent<EditorContainerProps> = ({
  playerOverride,
  children,
}: EditorContainerProps) => {
  const dispatch = useDispatch();
  const videoData = useSelector(tabVideoDataSelector(globalThis.tabId));
  const editorData = useSelector(tabEditorDataSelector(globalThis.tabId));
  const rawEditorData = useSelector(tabEditorRawDataSelector(globalThis.tabId));
  const showEditor = useSelector(showEditorSelector(globalThis.tabId));
  const canUndo = useSelector(canEditorUndoSelector(globalThis.tabId));
  const canRedo = useSelector(canEditorRedoSelector(globalThis.tabId));
  const keyboardShortcuts = useSelector(keyboardShortcutsSelector);
  const isUserCaptionLoaded = useSelector(
    isUserCaptionLoadedSelector(globalThis.tabId),
  );
  const isSubmitting = useSelector(submitCaption.isLoading(globalThis.tabId));
  const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false);
  const [skipSaveConfirmation, setSkipSaveConfirmation] = useState(false);
  const inWebEditor = useSelector(inWebEditorSelector);
  const [showLogin, toggleShowLogin] = useToggle(false);

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
        }),
      ).then(() => {
        message.success("Saved!");
      });
    },
    [dispatch],
  );

  const handleSave = useCallback(async () => {
    const hasSave = await hasSaveData(
      globalThis.videoId,
      globalThis.videoSource,
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
        }),
      );
    },
    [dispatch],
  );

  const handleUpdateCaption = useCallback(
    (action: PayloadAction<CaptionAction>, callback?: () => void) => {
      dispatch(updateEditorCaption({ action, tabId: globalThis.tabId })).then(
        () => {
          if (callback) {
            callback();
          }
        },
      );
    },
    [dispatch],
  );

  const handleCancelConfirmSaveModal = useCallback(() => {
    setIsConfirmSaveOpen(false);
  }, [setIsConfirmSaveOpen]);

  const caption =
    isUserCaptionLoaded && editorData && editorData.caption
      ? editorData.caption
      : videoData?.caption;

  const editorMenuComponent = (
    <VideoPageMenu inEditorScreen={true} onLoginRequired={toggleShowLogin} />
  );

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
        toolbarChildren={
          inWebEditor && (
            <WebEditorToolbarActions
              showLogin={showLogin}
              toggleLogin={toggleShowLogin}
            />
          )
        }
        captionContainerElement={
          playerOverride
            ? playerOverride.element()?.parentElement || null
            : globalThis.captionContainerElement
        }
        videoPlayer={playerOverride ?? globalThis.videoPlayer}
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
        isAdvancedCaption={!!rawEditorData}
      >
        {children}
      </CaptionEditor>
    </>
  );
};

export default EditorContainer;
