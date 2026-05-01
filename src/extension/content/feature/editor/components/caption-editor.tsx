import { isInExtension } from "@/common/client-utils";
import { EDITOR_PORTAL_ELEMENT_ID, TIME } from "@/common/constants";
import {
  addCaptionToTrackTime,
  addTrack,
  changeCaptionTrackId,
  fixOverlaps,
  modifyCaptionTime,
  removeTrack,
  shiftTimings,
} from "@/common/feature/caption-editor/actions";
import { CaptionModificationState } from "@/common/feature/caption-editor/types";
import { CaptionContainer } from "@/common/feature/video/types";
import { findClosestCaption } from "@/common/feature/video/utils";
import { CaptionFileFormat, UndoComponentProps } from "@/common/types";
import { useGetVideoPlayerFrameRate } from "@/extension/content/hooks/use-get-video-player-frame-rate";
import {
  useVideoPlayerDurationChange,
  useVideoPlayerPlayPause,
  useVideoPlayerVolumeChange,
} from "@/hooks";
import { AnyAction, PayloadAction } from "@reduxjs/toolkit";
import { message, Space } from "antd";
import { isEqual } from "lodash-es";
import * as React from "react";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { HotKeys, KeySequence } from "react-hotkeys-ce";
import { List } from "react-virtualized";
import { MAX_VOLUME } from "../constants";
import { ShiftTimingsModal } from "../containers/shift-timings-modal";
import { CaptionMutators } from "../utils";
import { VideoPlayer } from "../video-player/video-player";
import {
  EditorVideoContainer,
  NotAvailableWrapper,
  RootPane,
  RootSplitPane,
  SettingsInfoMessage,
  SettingsPane,
  TimelineContainer,
  VideoPane,
} from "./caption-editor.styled";
import { CaptionTextList } from "./caption-text-list";
import { EditorTimeline, SetTimelineScroll } from "./editor-timeline";
import { EditorToolbar } from "./editor-toolbar";
import { SettingsPanel } from "./settings-panel";
import { useCaptionDragHandler } from "../hooks/use-caption-drag-handler";
import { useCaptionEditorHotkeys } from "../hooks/use-caption-editor-hotkeys";
import { useVideoElementManagement } from "../hooks/use-video-element-management";
import { VideoControlsPanel } from "./video-controls-panel";
import { SplitPane } from "@/common/components/multi-split-pane/split-pane";

const focusCaptionTextArea = (captionId: number, delay = 0) => {
  if (!isInExtension()) {
    const textArea = document.getElementById(`nc-ta-${captionId}`);
    textArea?.focus();
    return;
  }
  setTimeout(() => {
    const textArea = document.getElementById(`nc-ta-${captionId}`);
    if (!textArea) {
      return;
    }
    textArea.focus();
  }, delay);
};

type CaptionEditorProps = UndoComponentProps & {
  showEditor: boolean;
  isSubmitting: boolean;
  captionContainer?: CaptionContainer;
  videoPlayer: VideoPlayer;
  captionContainerElement: HTMLElement | null;
  videoMenuComponent: ReactNode;
  updateCaption: (action: AnyAction, callback?: () => void) => void;
  keyboardShortcuts: { [id: string]: KeySequence };
  onSave: () => void;
  onExport: (fileFormat: keyof typeof CaptionFileFormat) => void;
  children?: ReactNode; // Insert the video player directly as a child of this node
  toolbarChildren?: ReactNode; // Additional components for the toolbar
  isAdvancedCaption?: boolean;
};

const CaptionEditorInternal = ({
  captionContainer,
  videoPlayer,
  captionContainerElement,
  videoMenuComponent,
  showEditor,
  updateCaption,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onSave,
  onExport,
  keyboardShortcuts,
  children,
  toolbarChildren,
  isAdvancedCaption,
}: CaptionEditorProps) => {
  const setTimelineScroll = useRef<SetTimelineScroll>(() => {
    /* */
  });
  const textEditorScrollRef = useRef<List>(null);

  const [timelineScale, setTimelineScale] = useState(1);
  const [selectedTrack, setSelectedTrack] = useState(0);
  const [selectedCaption, setSelectedCaption] = useState<number>(-1);
  const [isShiftTimingsModalOpen, setIsShiftTimingsModalOpen] = useState(false);

  // Whether we are currently changing the global, track or caption's position
  const [currentMoveType, setCurrentMoveType] =
    useState<CaptionModificationState>(CaptionModificationState.None);
  /**
   * We add this to the caption text editor list items' keys to force the list to refresh correctly when captions are added
   */
  const captionListKeySuffix = useRef<number>(0);
  const focusNewCaptionIndex = useRef<number>(-1);
  const lastDebouncedAction = useRef<PayloadAction<any>>();
  const hotKeysRef = useRef<HTMLDivElement>(null);
  const [isPlaying, _, isPlayingRef] = useVideoPlayerPlayPause(videoPlayer);
  const {
    volume: [volume, setVolume],
    mute: [isMute],
  } = useVideoPlayerVolumeChange(videoPlayer);
  const [videoDurationMs] = useVideoPlayerDurationChange(videoPlayer);
  const videoFps = useGetVideoPlayerFrameRate(videoPlayer);

  const { data } = captionContainer || {};

  const { editorVideoContainerRef, videoDimensions } =
    useVideoElementManagement(
      showEditor,
      videoPlayer,
      captionContainerElement,
      !!children,
    );

  useEffect(() => {
    // Force a refresh of the caption text list on the next update
    captionListKeySuffix.current++;
  }, [showEditor, captionListKeySuffix]);

  const setVideoTime = useCallback(
    (timeInSeconds: number, scrollTimeline = true) => {
      if (videoPlayer) {
        videoPlayer.currentTime(timeInSeconds);
      }
      // Set timeline to scroll to the correct position
      if (!scrollTimeline || !setTimelineScroll.current) {
        return;
      }
      setTimelineScroll.current(timeInSeconds * 1000);
    },
    [videoPlayer],
  );

  const selectAndScrollToCaptionId = useCallback(
    (captionId: number) => {
      setSelectedCaption(captionId);
      setTimeout(() => {
        if (textEditorScrollRef.current) {
          textEditorScrollRef.current.scrollToRow(captionId);
        }
      });
    },
    [textEditorScrollRef, setSelectedCaption],
  );

  useEffect(() => {
    if (focusNewCaptionIndex.current >= 0) {
      selectAndScrollToCaptionId(focusNewCaptionIndex.current);
      if (
        data?.tracks[selectedTrack] &&
        data.tracks[selectedTrack]?.cues[focusNewCaptionIndex.current] !==
          undefined
      ) {
        const startTime =
          data.tracks[selectedTrack].cues[focusNewCaptionIndex.current].start;
        setVideoTime(startTime / 1000, true);
        focusCaptionTextArea(focusNewCaptionIndex.current, 0);
      }
      focusNewCaptionIndex.current = -1;
    }
  }, [data, selectAndScrollToCaptionId, selectedTrack, setVideoTime]);

  // Effect for unfocusing previous element after opening/closing editor
  useEffect(() => {
    if (document.activeElement) {
      (document.activeElement as HTMLElement).blur();
    }
    if (showEditor && hotKeysRef.current) {
      // Focus the editor window
      hotKeysRef.current.focus();
    }
  }, [showEditor]);

  // --- Caption drag handler hook ---
  useCaptionDragHandler(
    showEditor,
    videoDimensions,
    data,
    selectedTrack,
    selectedCaption,
    currentMoveType,
    captionContainer,
    updateCaption,
  );

  // --- New caption handler ---
  const handleNewCaption = useCallback(
    (trackId: number, newTime: number) => {
      captionListKeySuffix.current++;
      updateCaption(
        addCaptionToTrackTime({
          trackId,
          timeMs: newTime,
          skipValidityChecks: false,
        }),
      );
    },
    [updateCaption],
  );

  // --- Hotkeys hook ---
  const {
    hotkeyHandlers,
    handleClickPlay,
    handleUndo,
    handleRedo,
    debouncedUpdateCaption,
    queueDebounceUpdateCaption,
  } = useCaptionEditorHotkeys({
    data,
    videoPlayer,
    videoFps,
    selectedTrack,
    selectedCaption,
    isPlayingRef,
    captionListKeySuffix,
    focusNewCaptionIndex,
    lastDebouncedAction,
    updateCaption,
    selectAndScrollToCaptionId,
    setVideoTime,
    handleNewCaption,
    onUndo,
    onRedo,
    onSave,
  });

  // --- Move type toggles ---
  const handleToggleMoveCaptionPosition = () => {
    if (currentMoveType === CaptionModificationState.Caption) {
      setCurrentMoveType(CaptionModificationState.None);
    } else {
      setCurrentMoveType(CaptionModificationState.Caption);
    }
  };

  const handleToggleMoveTrackPosition = () => {
    if (currentMoveType === CaptionModificationState.Track) {
      setCurrentMoveType(CaptionModificationState.None);
    } else {
      setCurrentMoveType(CaptionModificationState.Track);
    }
  };

  const handleToggleMoveGlobalPosition = () => {
    if (currentMoveType === CaptionModificationState.Global) {
      setCurrentMoveType(CaptionModificationState.None);
    } else {
      setCurrentMoveType(CaptionModificationState.Global);
    }
  };

  // --- Timeline handlers ---
  const handleChangeTimelineZoom = (value: number) => {
    setTimelineScale(value);
  };

  const handleAddTrack = () => {
    updateCaption(addTrack({}));
  };

  const handleRemoveTrack = (trackId: number) => {
    const updatedCaption = {
      ...captionContainer,
      data: { ...captionContainer?.data },
    };
    if ((updatedCaption.data.tracks?.length || 0) <= 1) {
      message.error("A caption needs to have at least 1 track!");
      return;
    }

    updateCaption(removeTrack({ trackId }));
  };

  const handleClickTimeline = (
    trackId: number,
    captionId: number,
    currentTimeMs: number,
  ) => {
    if (!data) {
      return;
    }
    setVideoTime(currentTimeMs * TIME.MS_TO_SECONDS, false);
    if (trackId >= 0 && trackId < data.tracks.length) {
      setSelectedTrack(trackId);
    }
  };

  const handleClickCaption = (trackId: number, captionId: number) => {
    captionListKeySuffix.current++;
    setSelectedTrack(trackId);
    selectAndScrollToCaptionId(captionId);
  };

  const handleUpdateCaptionTime = (
    trackId: number,
    captionId: number,
    startMs: number,
    endMs: number,
    finalTrackId: number,
  ) => {
    if (!data) {
      return;
    }
    if (finalTrackId === trackId) {
      captionListKeySuffix.current++;
      // Dry run to get new id after changing the time so that we can set the selected caption to the right one
      const { caption } = CaptionMutators.modifyCaptionTime(
        data,
        trackId,
        captionId,
        startMs,
        endMs,
      );
      if (!caption) {
        console.warn("No caption data found");
        return;
      }
      const newIndex = findClosestCaption(
        caption.tracks[trackId].cues,
        startMs + (endMs - startMs) / 2,
      );
      updateCaption(
        modifyCaptionTime({ trackId, captionId, startMs, endMs }),
        () => {
          setSelectedCaption(newIndex);
        },
      );
    } else {
      captionListKeySuffix.current++;
      updateCaption(
        changeCaptionTrackId({
          trackId,
          captionId,
          startMs,
          endMs,
          finalTrackId,
        }),
      );
    }
  };

  // --- Volume handlers ---
  const handleClickMute = async () => {
    if (!videoPlayer) {
      return;
    }
    videoPlayer.muted(!(await videoPlayer.muted()));
  };

  const handleChangeVolume = async (newVolume: number) => {
    if (!videoPlayer) {
      return;
    }
    newVolume = newVolume / MAX_VOLUME;
    setVolume(newVolume);
    await videoPlayer.muted(newVolume === 0);
  };

  const handleUpdateCaption = (action: AnyAction) => {
    updateCaption(action);
  };

  const renderVideoMenu = () => {
    return videoMenuComponent;
  };

  const handleSeek = (seekedTime: number) => {
    setVideoTime(seekedTime, true);
  };

  const renderInfoMessage = () => {
    if (currentMoveType !== CaptionModificationState.None) {
      return (
        <SettingsInfoMessage>
          Drag the caption on the video to move it. You can only drag the
          currently selected caption.
        </SettingsInfoMessage>
      );
    }
    return null;
  };

  const handleFixOverlaps = () => {
    updateCaption(fixOverlaps({}));
  };

  const handleCancelShiftTimingsModal = () => {
    setIsShiftTimingsModalOpen(false);
  };

  const handleOpenShiftTimings = () => {
    setIsShiftTimingsModalOpen(true);
  };

  const handleShiftTimings = (
    shiftMs: number,
    startMs: number,
    endMs: number,
  ) => {
    updateCaption(shiftTimings({ duration: shiftMs, startMs, endMs }));
  };

  const editorPortalElement = document.getElementById(EDITOR_PORTAL_ELEMENT_ID);
  if (!editorPortalElement) {
    return <></>;
  }
  return ReactDOM.createPortal(
    <>
      <HotKeys
        keyMap={keyboardShortcuts}
        handlers={hotkeyHandlers}
        innerRef={hotKeysRef}
        allowChanges={true}
      >
        <RootPane
          $show={showEditor}
          $captionMoveType={currentMoveType}
          className="scoped-antd"
        >
          <RootSplitPane split="horizontal" defaultSizes={[1, 1]}>
            <SplitPane split="vertical">
              <CaptionTextList
                data={data}
                selectedTrack={selectedTrack}
                selectedCaption={selectedCaption}
                isAdvancedCaption={isAdvancedCaption}
                captionListKeySuffix={captionListKeySuffix}
                textEditorScrollRef={textEditorScrollRef}
                updateCaption={updateCaption}
                queueDebounceUpdateCaption={queueDebounceUpdateCaption}
                setSelectedCaption={setSelectedCaption}
                setVideoTime={setVideoTime}
              />
              <VideoPane>
                <EditorVideoContainer
                  $playerStyles={
                    globalThis.selectedProcessor?.editorVideoPlayerStyles || ""
                  }
                  innerRef={editorVideoContainerRef}
                >
                  {children}
                </EditorVideoContainer>
                <VideoControlsPanel
                  videoPlayer={videoPlayer}
                  isPlaying={isPlaying}
                  volume={volume}
                  isMute={isMute}
                  onClickPlay={handleClickPlay}
                  onSeek={handleSeek}
                  onChangeVolume={handleChangeVolume}
                  onClickMute={handleClickMute}
                />
              </VideoPane>
              <SettingsPane>
                {isAdvancedCaption && <NotAvailableWithAdvancedCaption />}
                {!isAdvancedCaption && (
                  <SettingsPanel
                    caption={data}
                    videoPlayer={videoPlayer}
                    videoDurationMs={videoDurationMs}
                    selectedTrack={selectedTrack}
                    selectedCaption={selectedCaption}
                    captionModificationState={currentMoveType}
                    onToggleMoveCaptionPosition={
                      handleToggleMoveCaptionPosition
                    }
                    onToggleMoveTrackPosition={handleToggleMoveTrackPosition}
                    onToggleMoveGlobalPosition={handleToggleMoveGlobalPosition}
                    onUpdateCaption={handleUpdateCaption}
                  />
                )}
                {renderInfoMessage()}
              </SettingsPane>
            </SplitPane>
            <div style={{ width: "100%" }}>
              <TimelineContainer>
                <div
                  style={{ paddingLeft: "20px", flexGrow: 0, flexShrink: 0 }}
                >
                  <Space>
                    {renderVideoMenu()}
                    <EditorToolbar
                      onChangeZoom={handleChangeTimelineZoom}
                      timelineScale={timelineScale}
                      onUndo={handleUndo}
                      onRedo={handleRedo}
                      onSave={onSave}
                      onFixOverlaps={handleFixOverlaps}
                      onOpenShiftTimings={handleOpenShiftTimings}
                      canUndo={canUndo}
                      canRedo={canRedo}
                      onExport={onExport}
                    >
                      {toolbarChildren}
                    </EditorToolbar>
                  </Space>
                </div>
                {isAdvancedCaption && <NotAvailableWithAdvancedCaption />}
                {!isAdvancedCaption && (
                  <EditorTimeline
                    show={showEditor}
                    caption={data}
                    scale={timelineScale}
                    videoDurationMs={videoDurationMs}
                    videoPlayer={videoPlayer}
                    selectedTrack={selectedTrack}
                    selectedCaption={selectedCaption}
                    onAddTrack={handleAddTrack}
                    onRemoveTrack={handleRemoveTrack}
                    onClickTimeline={handleClickTimeline}
                    onClickCaption={handleClickCaption}
                    onNewCaption={handleNewCaption}
                    setTimelineScroll={setTimelineScroll}
                    onUpdateCaptionTime={handleUpdateCaptionTime}
                  />
                )}
              </TimelineContainer>
            </div>
          </RootSplitPane>
        </RootPane>
      </HotKeys>
      <ShiftTimingsModal
        visible={isShiftTimingsModalOpen}
        onShift={handleShiftTimings}
        onCancel={handleCancelShiftTimingsModal}
        videoPlayer={videoPlayer}
      />
    </>,
    editorPortalElement,
  );
};

export const CaptionEditor = React.memo(
  CaptionEditorInternal,
  (prevProps, nextProps) => {
    const isSubEqual = isEqual(
      prevProps.captionContainer,
      nextProps.captionContainer,
    );
    const isShortcutEqual = isEqual(
      prevProps.keyboardShortcuts,
      nextProps.keyboardShortcuts,
    );

    return (
      prevProps.isSubmitting === nextProps.isSubmitting &&
      prevProps.canRedo === nextProps.canRedo &&
      prevProps.canUndo === nextProps.canUndo &&
      prevProps.showEditor === nextProps.showEditor &&
      prevProps.captionContainerElement === nextProps.captionContainerElement &&
      prevProps.videoPlayer === nextProps.videoPlayer &&
      prevProps.videoMenuComponent === nextProps.videoMenuComponent &&
      prevProps.updateCaption === nextProps.updateCaption &&
      prevProps.onRedo === nextProps.onRedo &&
      prevProps.onUndo === nextProps.onUndo &&
      prevProps.onSave === nextProps.onSave &&
      prevProps.children === nextProps.children &&
      prevProps.toolbarChildren === nextProps.toolbarChildren &&
      prevProps.isAdvancedCaption === nextProps.isAdvancedCaption &&
      isShortcutEqual &&
      isSubEqual
    );
  },
);

function NotAvailableWithAdvancedCaption() {
  return (
    <NotAvailableWrapper>
      Not available with advanced captions
    </NotAvailableWrapper>
  );
}
