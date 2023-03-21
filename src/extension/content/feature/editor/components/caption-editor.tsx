import * as React from "react";
import {
  ChangeEvent,
  LegacyRef,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { CaptionContainer } from "@/common/feature/video/types";
import {
  useMount,
  useResize,
  useStateRef,
  useVideoDurationChange,
  useVideoPlayPause,
  useVideoVolumeChange,
} from "@/hooks";
import ReactDOM from "react-dom";
import styled from "styled-components";
import { SplitPane } from "react-multi-split-pane";
import { EDITOR_PORTAL_ELEMENT_ID, TIME } from "@/common/constants";
import { EditorTimeline, SetTimelineScroll } from "./editor-timeline";
import { EditorToolbar } from "./editor-toolbar";
import { Button, Col, message, Popover, Row, Slider, Space } from "antd";
import {
  CaptionFileFormat,
  Coords,
  CSSPosition,
  UndoComponentProps,
} from "@/common/types";
import { AutoSizer, List, ListRowProps } from "react-virtualized";
import { DurationInput } from "@/common/components/duration-input";
import * as dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import debounce from "@/common/debounce";
import { isEqual } from "lodash";
import { colors } from "@/common/colors";
import { CaptionMutators, useCaptionDrag } from "../utils";
import ClockCircleOutlined from "@ant-design/icons/ClockCircleOutlined";
import LoginOutlined from "@ant-design/icons/LoginOutlined";
import LogoutOutlined from "@ant-design/icons/LogoutOutlined";
import PlusCircleFilled from "@ant-design/icons/PlusCircleFilled";
import CompressOutlined from "@ant-design/icons/CompressOutlined";
import DeleteOutlined from "@ant-design/icons/DeleteOutlined";
import CaretRightOutlined from "@ant-design/icons/CaretRightOutlined";
import PauseOutlined from "@ant-design/icons/PauseOutlined";
import NumberFormat from "react-number-format";
import { HotKeys, KeySequence, ObserveKeys } from "react-hotkeys-ce";
import {
  CaptionModificationState,
  EditorShortcutHandlers,
  EDITOR_KEYS,
} from "@/common/feature/caption-editor/types";
import { DEFAULT_LAYOUT_SETTINGS, MAX_VOLUME } from "../constants";
import { faVolumeMute, faVolumeUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { VideoScrubber } from "./video-scrubber";
import { SettingsPanel } from "./settings-panel";
import { Gutter } from "antd/lib/grid/row";
import { WarningText } from "@/common/components/warning-text";
import { BooleanFilter, clamp, isInputElementSelected } from "@/common/utils";
import NekoLogoSvg from "@/assets/images/nekocap.svg";
import { AnyAction, PayloadAction } from "@reduxjs/toolkit";
import {
  modifyCaption,
  modifyCaptionGlobalSettings,
  modifyCaptionTrackSettings,
  addCaptionToTrackRelative,
  addCaptionToTrackTime,
  changeCaptionTrackId,
  modifyCaptionStartTime,
  modifyCaptionEndTime,
  modifyCaptionText,
  modifyCaptionTime,
  deleteCaption,
  addTrack,
  removeTrack,
  modifyCaptionWithMultipleActions,
  fixOverlaps,
  shiftTimings,
} from "@/common/feature/caption-editor/actions";
import { getImageLink } from "@/common/chrome-utils";
import { findClosestCaption } from "@/common/feature/video/utils";
import { ShiftTimingsModal } from "../containers/shift-timings-modal";
import { useGetVideoFrameRate } from "@/extension/content/hooks/use-get-video-frame-rate";
import { DEVICE } from "@/common/style-constants";
import { CaptionAlignment } from "@/common/caption-parsers/types";

dayjs.extend(duration);

const VideoPane = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  width: 100%;
  height: 100%;
`;

const SettingsPane = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  width: 100%;
  height: 100%;
  padding: 0 20px 20px;
  box-sizing: border-box;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-image: url(${getImageLink(NekoLogoSvg)});
    background-repeat: no-repeat;
    background-position: 97% 97%;
    background-size: 200px;
    background-origin: content-box;
    opacity: 0.3;
  }
`;

const SettingsInfoMessage = styled.div`
  position: absolute;
  left: 0;
  bottom: 0;
  padding: 0 10px;
  background-color: ${colors.white}77;
  border-top: 1px solid ${colors.divider};
  width: 100%;
`;

const VideoControls = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin: 5px 10px;
`;

const VolumeSlider = styled(Slider)`
  display: inline-block;
  vertical-align: middle;
  width: 100px;
`;

const TextEditorColumn = styled.div.withConfig<{ justify?: string }>({
  shouldForwardProp: (prop) => !["justify"].includes(prop),
})`
  display: flex !important;
  flex-direction: column !important;
  ${({ justify }) => (justify ? `justify-content: ${justify} !important;` : "")}

  & > div,button:not(:last-child) {
    margin-bottom: 5px;
  }
`;

const TextEditorRow = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 10px;
  & ${TextEditorColumn} {
    &:nth-child(1) {
      flex-grow: 1;
      flex-shrink: 0;
    }
    &:nth-child(2) {
      justify-content: center;
    }
  }
`;

type EditorVideoContainerProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
> & {
  playerStyles: string;
  innerRef: LegacyRef<HTMLDivElement>;
};
const EditorVideoContainer = styled(
  ({ playerStyles, innerRef, ...rest }: EditorVideoContainerProps) => {
    return <div {...rest} ref={innerRef} />;
  }
)`
  width: 100%;
  height: 100%;
  position: relative;

  ${({ playerStyles }) => {
    return playerStyles;
  }}
`;

const RootSplitPane = styled(SplitPane)`
  position: relative !important;
  background-color: white;
  min-height: unset !important;
`;

type RootPaneType = {
  show: boolean;
  captionMoveType?: CaptionModificationState;
};

const RootPane = styled("div").withConfig<RootPaneType>({
  shouldForwardProp: (prop, defPropValFn) => defPropValFn(prop),
})`
  display: ${({ show }: RootPaneType) => (show ? "flex" : "none")} !important;
  background-color: white;
  flex-direction: column;
  height: 100vh;
  pointer-events: all;

  .nekocap-cap-container {
    // Override the caption container to allow dragging of captions in the editor
    pointer-events: all !important;
    user-select: none;

    top: 50% !important;
    left: 50% !important;
    transform: translate(-50%, -50%) !important;
  }

  .nekocap-caption {
    ${({ captionMoveType }: RootPaneType) => {
      if (captionMoveType === CaptionModificationState.Global) {
        return `
          &[data-layout-type="global"] {
            .nekocap-caption-text:not(:empty)::before {
              content: "Global";
              border: 1px solid #41b1f1;
            }
          }
    `;
      } else if (captionMoveType === CaptionModificationState.Track) {
        return `
          &[data-layout-type="track"] {
            .nekocap-caption-text:not(:empty)::before {
              content: "Track";
              border: 1px solid #e6aa3b;
            }
          }
`;
      } else if (captionMoveType === CaptionModificationState.Caption) {
        return `
          &[data-layout-type="caption"] {
            .nekocap-caption-text:not(:empty)::before {
              content: "Caption";
              border: 1px solid #65df2d;
            }
          }
`;
      }
      return "";
    }}
  }

  .nekocap-caption-text {
    font-family: apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji",
      "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
    &:not(:empty)::before {
      position: absolute;
      top: 0;
      left: 0;
      padding: 0 5px;
      transform: translate(0, -100%);
      pointer-events: none;
      font-size: 0.7em;
      background-color: #33333375;
    }
  }

  *,
  *:focus,
  *:hover {
    outline: none;
  }

  // Pane specific styles
  .Resizer {
    background: #000;
    opacity: 0.2;
    z-index: 1;
    box-sizing: border-box;
    background-clip: padding-box;

    &.horizontal {
      height: 11px;
      margin: -5px 0;
      border-top: 5px solid rgba(255, 255, 255, 0);
      border-bottom: 5px solid rgba(255, 255, 255, 0);
      cursor: row-resize;
      &:hover,
      &.resizing {
        border-top: 5px solid rgba(0, 0, 0, 0.5);
        border-bottom: 5px solid rgba(0, 0, 0, 0.5);
      }
    }

    &.vertical {
      width: 11px;
      margin: 0 -5px;
      border-left: 5px solid rgba(255, 255, 255, 0);
      border-right: 5px solid rgba(255, 255, 255, 0);
      cursor: col-resize;

      &:hover,
      &.resizing {
        border-left: 5px solid rgba(0, 0, 0, 0.5);
        border-right: 5px solid rgba(0, 0, 0, 0.5);
      }
    }

    &:hover {
      transition: all 2s ease;
    }
  }

  .DragLayer {
    opacity: 0;
    pointer-events: none;
    &.resizing {
      pointer-events: auto;
    }
    &.horizontal {
      cursor: row-resize;
    }
    &.vertical {
      cursor: col-resize;
    }
  }
`;

const TimelineContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding-top: 20px;
  height: 100%;
  box-sizing: border-box;
  * {
    box-sizing: border-box;
  }
`;

const TextEditorPane = styled.div`
  display: block;
  width: 100%;
`;

type CaptionTextRowProps = {
  selected: boolean;
};

const CaptionTextRow = styled.div<CaptionTextRowProps>`
  position: relative;
  box-sizing: border-box;
  padding: 10px;
  background-color: ${({ selected }: CaptionTextRowProps) =>
    selected ? colors.lightHighlight : "unset"};
`;

const ScrollingTime = styled.div`
  font-size: 30px;
  font-weight: bold;
`;

const ScrollingText = styled.div`
  font-size: 26px;
`;

const ScrollingEditorField = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const NoTextInTrack = styled.div`
  text-align: center;
  font-size: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

type AddBetweenProps = {
  top: boolean;
  first?: boolean;
  last?: boolean;
};

const AddBetween = styled.div<AddBetweenProps>`
  position: absolute;
  width: 100%;
  opacity: 0;
  font-size: ${({ first }: AddBetweenProps) => (first ? "13px" : "20px")};
  transition: opacity 200ms;
  transform: ${({ last }: AddBetweenProps) =>
    last ? "translate(-50%, -120%)" : "translate(-50%, -50%)"};
  left: 50%;
  text-align: center;
  ${({ top, first }: AddBetweenProps) => {
    if (first) {
      return "top: 10px";
    }
    return top ? "top: 0" : "top: unset";
  }};
  z-index: 10;

  &:hover {
    opacity: 1;
  }
`;

const TimeInputLabel = styled.div`
  display: inline-block;
  flex: 0;
  border: 1px solid #d9d9d9;
  border-right: none;
  padding: 10px;
  background-color: white;
`;

const TimeInput = styled.div`
  display: flex;
`;

const EditorTextAreaWrapper = styled(ObserveKeys)`
  flex: 1;
  width: 100%;
`;

const EditorTextArea = styled.textarea`
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  border: 1px solid #d9d9d9;
  resize: none !important;
  transition: none;
`;

const CueActionButton = styled(Button)`
  padding: 0 2px;
  font-size: 12px;
  @media ${DEVICE.largeDesktop} {
    padding: 0 7px;
    font-size: 14px;
  }
`;

const DisabledNumberFormat = styled(NumberFormat<unknown>)`
  padding: 10px;
  letter-spacing: 2px;
  flex: 1;
  border: 1px solid #d9d9d9;
  background-color: ${colors.disabledField};
  overflow-x: hidden;
  font-size: 12px;
  @media ${DEVICE.largeDesktop} {
    font-size: 14px;
  }
`;

const GRID_GUTTER: [Gutter, Gutter] = [20, 20];

const focusCaptionTextArea = (captionId: number, delay = 0) => {
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
  videoElement: HTMLVideoElement;
  captionContainerElement: HTMLElement;
  videoMenuComponent: ReactNode;
  updateCaption: (action: AnyAction, callback?: () => void) => void;
  keyboardShortcuts: { [id: string]: KeySequence };
  onSave: () => void;
  onExport: (fileFormat: keyof typeof CaptionFileFormat) => void;
};

const CaptionEditorInternal = ({
  captionContainer,
  videoElement,
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
}: CaptionEditorProps) => {
  const [editorVideoContainer, editorVideoContainerRef] =
    useStateRef<HTMLDivElement>();
  const originalCaptionContainerParent = useRef<HTMLElement | null>();
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
  const videoDimensions = useRef<Coords>({ x: 0, y: 0 });
  const [isPlaying, setIsPlaying, isPlayingRef] =
    useVideoPlayPause(videoElement);
  const {
    volume: [volume, setVolume, volumeRef],
    mute: [isMute],
  } = useVideoVolumeChange(videoElement);

  const [videoDurationMs] = useVideoDurationChange(videoElement);
  const videoFps = useGetVideoFrameRate(videoElement);

  const { data } = captionContainer || {};

  /**
   * Effect for moving the video element to the editor and back
   */
  useEffect(() => {
    if (!videoElement || !editorVideoContainer) {
      return;
    }

    if (showEditor) {
      // Move the video in
      if (editorVideoContainer.contains(captionContainerElement)) {
        return;
      }
      originalCaptionContainerParent.current =
        captionContainerElement.parentElement;
      editorVideoContainer.appendChild(captionContainerElement);
      // TODO: Fix host website overriding this property
      document.body.style.overflow = "hidden";
    } else {
      if (!editorVideoContainer.contains(captionContainerElement)) {
        return;
      }
      if (originalCaptionContainerParent.current) {
        originalCaptionContainerParent.current.appendChild(
          captionContainerElement
        );
      }
      document.body.style.overflow = "unset";
    }
  }, [showEditor, captionContainerElement, editorVideoContainer, videoElement]);

  useMount(() => {
    return () => {
      document.body.style.overflow = "unset";
    };
  });

  useEffect(() => {
    // Force a refresh of the caption text list on the next update
    captionListKeySuffix.current++;
  }, [showEditor, captionListKeySuffix]);

  const handleDragCaptionEnd = (trackId: number, position: CSSPosition) => {
    const draggedCaption = data?.tracks[trackId].cues[selectedCaption];
    if (!draggedCaption) {
      return;
    }
    const x =
      ((position.left !== undefined ? position.left : position.right) || 0) /
      100;
    const y =
      ((position.bottom !== undefined ? position.bottom : position.top) || 0) /
      100;
    if (currentMoveType === CaptionModificationState.Caption) {
      updateCaption(
        modifyCaption({
          trackId,
          captionId: selectedCaption,
          newCaption: {
            ...draggedCaption,
            layout: {
              ...DEFAULT_LAYOUT_SETTINGS, // We have to set alignment to the default if it does not exist for the positioning to take effect
              // alignment: CaptionAlignment.BottomCenter,
              ...draggedCaption?.layout,
              position: {
                x,
                y,
              },
            },
          },
        })
      );
    } else if (currentMoveType === CaptionModificationState.Track) {
      const trackData = data.tracks[trackId];
      const trackSettings = trackData.settings;
      updateCaption(
        modifyCaptionTrackSettings({
          trackId,
          settings: {
            ...draggedCaption,
            ...trackSettings,
            layout: {
              ...DEFAULT_LAYOUT_SETTINGS,
              ...trackSettings?.layout,
              position: {
                x,
                y,
              },
            },
          },
        })
      );
    } else if (currentMoveType === CaptionModificationState.Global) {
      const globalSettings = data.settings;
      updateCaption(
        modifyCaptionGlobalSettings({
          settings: {
            ...globalSettings,
            layout: {
              ...DEFAULT_LAYOUT_SETTINGS,
              ...globalSettings?.layout,
              position: {
                x,
                y,
              },
            },
          },
        })
      );
    }
  };

  const canDragCaption = (trackId: number, captionId: number) => {
    if (currentMoveType === CaptionModificationState.None) {
      return false;
    }
    const trackLayout = data?.tracks[trackId].settings?.layout;
    const captionLayout = data?.tracks[trackId].cues[captionId].layout;
    if (
      currentMoveType === CaptionModificationState.Global &&
      (trackLayout || captionLayout)
    ) {
      // Can't change global position when current caption overrides global position
      return false;
    }
    if (currentMoveType === CaptionModificationState.Track) {
      if (captionLayout) {
        return false;
      }
      if (selectedTrack !== trackId) {
        // In track mode, can't move another track's position
        return false;
      }
    }
    if (
      currentMoveType === CaptionModificationState.Caption &&
      (selectedCaption !== captionId || selectedTrack !== trackId)
    ) {
      return false;
    }
    return true;
  };

  useCaptionDrag(
    showEditor,
    videoDimensions,
    canDragCaption,
    handleDragCaptionEnd,
    [captionContainer, selectedTrack, selectedCaption, currentMoveType]
  );

  const updateVideoDimensions = (width: number, height: number) => {
    videoDimensions.current = {
      x: width,
      y: height,
    };
  };

  useResize(videoElement, updateVideoDimensions, 0, [videoElement]);

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
        focusCaptionTextArea(focusNewCaptionIndex.current);
      }
      focusNewCaptionIndex.current = -1;
    }
  }, [data]);

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

  // useCallback not necessary for the next few functions, changed it while attempting to fix react-hotkey issues
  // too lazy to change back
  const handleClickPlay = useCallback(
    (event) => {
      if (!videoElement) {
        return;
      }
      event.preventDefault();
      if (isPlayingRef.current) {
        videoElement.pause();
      } else {
        videoElement.play();
      }
    },
    [videoElement, isPlayingRef]
  );

  const handleSetStartToCurrentTime = useCallback(
    (event) => {
      if (!data) {
        return;
      }
      if (
        selectedTrack < 0 ||
        selectedTrack >= data.tracks.length ||
        selectedCaption < 0
      ) {
        return;
      }
      const caption = data.tracks[selectedTrack].cues[selectedCaption];
      if (!caption) {
        return;
      }
      event.preventDefault();
      const newStartTime = videoElement.currentTime * 1000;
      let newEndTime = caption.end;
      if (caption.end < newStartTime) {
        // If the start time is after the end time, we'll shift the end time so that the same duration remains
        newEndTime = newStartTime + (caption.end - caption.start);
      }
      updateCaption(
        modifyCaptionTime({
          trackId: selectedTrack,
          captionId: selectedCaption,
          startMs: newStartTime,
          endMs: newEndTime,
        })
      );
    },
    [captionContainer, selectedTrack, data, selectedCaption, videoElement]
  );

  const handleSetEndToCurrentTime = useCallback(
    (event) => {
      if (!data) {
        return;
      }
      if (
        selectedTrack < 0 ||
        selectedTrack >= data.tracks.length ||
        selectedCaption < 0
      ) {
        return;
      }
      const caption = data.tracks[selectedTrack].cues[selectedCaption];
      if (!caption) {
        return;
      }
      event.preventDefault();
      const newEndTime = videoElement.currentTime * 1000;
      let newStartTime = caption.start;
      if (caption.start > newEndTime) {
        // If the end time is before the start time, we'll shift the start time so that the same duration remains
        newStartTime = newEndTime - (caption.end - caption.start);
      }
      updateCaption(
        modifyCaptionTime({
          trackId: selectedTrack,
          captionId: selectedCaption,
          startMs: newStartTime,
          endMs: newEndTime,
        })
      );
    },
    [captionContainer, selectedTrack, data, selectedCaption, videoElement]
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
    [textEditorScrollRef, setSelectedCaption]
  );

  const handleGotoNextCaption = useCallback(
    (event) => {
      if (!data) {
        return;
      }
      if (selectedCaption < 0) {
        return;
      }
      const newId = selectedCaption + 1;

      if (newId >= data.tracks[selectedTrack].cues.length) {
        return;
      }
      event.preventDefault();
      selectAndScrollToCaptionId(newId);
      const startTime = data.tracks[selectedTrack].cues[newId].start;
      setVideoTime(startTime / 1000, true);
      focusCaptionTextArea(newId);
    },
    [selectedCaption, selectedTrack, data]
  );

  const handleGotoPreviousCaption = useCallback(
    (event) => {
      if (!data || selectedCaption < 0) {
        return;
      }
      const newId = selectedCaption - 1;
      if (newId < 0) {
        return;
      }
      event.preventDefault();
      selectAndScrollToCaptionId(newId);
      const startTime = data.tracks[selectedTrack].cues[newId].start;
      setVideoTime(startTime / 1000, true);
      focusCaptionTextArea(newId);
    },
    [selectedCaption, selectedTrack, data]
  );

  const handleNewCaptionFromShortcut = (event: Event) => {
    if (!data || selectedTrack < 0) {
      return;
    }
    event.preventDefault();
    let newTime = videoElement.currentTime * 1000;
    if (selectedCaption >= 0) {
      newTime = Math.max(
        newTime,
        data.tracks[selectedTrack].cues[selectedCaption].end
      );
    }
    // Dry run adding it to see what the new id will be
    const { newCaptionId } = CaptionMutators.addCaptionToTrackTime(
      data,
      selectedTrack,
      newTime,
      undefined,
      false
    );
    if (isInputElementSelected()) {
      // Running the update only after keyup is called to workaround an issue where keyup is not fired if the update happens too quickly and the subsequent
      // rerender changes the elements (due to a key change)
      // In that case, react hotkeys will treat the keys used to trigger this action as still pressed, preventing other
      // hotkeys from working until a refocus
      const inputElement = document.activeElement;
      let batchUpdates = false;
      if (debouncedUpdateCaption.pending()) {
        // We'll do the update and creation of new caption together
        batchUpdates = true;
        debouncedUpdateCaption.cancel();
      } else {
        debouncedUpdateCaption.flush();
      }

      const temporaryKeyupListener = () => {
        if (batchUpdates) {
          captionListKeySuffix.current++;
          updateCaption(
            modifyCaptionWithMultipleActions({
              actions: [
                lastDebouncedAction.current,
                addCaptionToTrackTime({
                  trackId: selectedTrack,
                  timeMs: newTime,
                  skipValidityChecks: false,
                }),
              ].filter(BooleanFilter),
            })
          );
        } else {
          handleNewCaption(selectedTrack, newTime);
        }
        focusNewCaptionIndex.current = newCaptionId;
        inputElement?.removeEventListener("keyup", temporaryKeyupListener);
      };
      inputElement?.addEventListener("keyup", temporaryKeyupListener);
    } else {
      debouncedUpdateCaption.flush();
      handleNewCaption(selectedTrack, newTime);
      focusNewCaptionIndex.current = newCaptionId;
    }
  };

  const handleUndo = useCallback(() => {
    if (isInputElementSelected()) {
      return;
    }
    captionListKeySuffix.current++;
    if (onUndo) onUndo();
  }, [captionListKeySuffix, onUndo]);

  const handleRedo = useCallback(() => {
    if (isInputElementSelected()) {
      return;
    }
    captionListKeySuffix.current++;
    if (onRedo) onRedo();
  }, [captionListKeySuffix, onRedo]);

  const debouncedUpdateCaption = debounce(updateCaption, 500);
  const queueDebounceUpdateCaption = (action: PayloadAction<any>) => {
    lastDebouncedAction.current = { ...action };
    debouncedUpdateCaption(action);
  };

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
    currentTimeMs: number
  ) => {
    if (!data) {
      return;
    }
    setVideoTime(currentTimeMs * TIME.MS_TO_SECONDS, false);
    if (trackId >= 0 && trackId < data.tracks.length) {
      setSelectedTrack(trackId);
    }
  };

  const setVideoTime = (timeInSeconds: number, scrollTimeline = true) => {
    if (videoElement) {
      videoElement.currentTime = timeInSeconds;
    }
    // Set timeline to scroll to the correct position
    if (!scrollTimeline || !setTimelineScroll.current) {
      return;
    }
    setTimelineScroll.current(timeInSeconds * 1000);
  };

  const handleClickCaption = (trackId: number, captionId: number) => {
    captionListKeySuffix.current++;
    setSelectedTrack(trackId);
    selectAndScrollToCaptionId(captionId);
  };

  const handleNewCaption = (trackId: number, newTime: number) => {
    captionListKeySuffix.current++;
    updateCaption(
      addCaptionToTrackTime({
        trackId,
        timeMs: newTime,
        skipValidityChecks: false,
      })
    );
  };

  const handleUpdateCaptionTime = (
    trackId: number,
    captionId: number,
    startMs: number,
    endMs: number,
    finalTrackId: number
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
        endMs
      );
      if (!caption) {
        console.warn("No caption data found");
        return;
      }
      const newIndex = findClosestCaption(
        caption.tracks[trackId].cues,
        startMs + (endMs - startMs) / 2
      );
      updateCaption(
        modifyCaptionTime({ trackId, captionId, startMs, endMs }),
        () => {
          setSelectedCaption(newIndex);
        }
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
        })
      );
    }
  };

  const handleStartTimeKeyboardInput =
    (trackId: number, captionId: number) => (value: string) => {
      updateCaption(
        modifyCaptionStartTime({ trackId, captionId, newFormattedTime: value })
      );
    };

  const handleChangeStartTime =
    (trackId: number, captionId: number) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      queueDebounceUpdateCaption(
        modifyCaptionStartTime({
          trackId,
          captionId,
          newFormattedTime: event.target.value,
        })
      );
    };

  const handleEndTimeKeyboardInput =
    (trackId: number, captionId: number) => (value: string) => {
      updateCaption(
        modifyCaptionEndTime({ trackId, captionId, newFormattedTime: value })
      );
    };

  const handleChangeEndTime =
    (trackId: number, captionId: number) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      queueDebounceUpdateCaption(
        modifyCaptionEndTime({
          trackId,
          captionId,
          newFormattedTime: event.target.value,
        })
      );
    };

  const handleChangeCaptionText =
    (trackId: number, captionId: number) =>
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      queueDebounceUpdateCaption(
        modifyCaptionText({
          trackId,
          captionId,
          text: event.target.value,
        })
      );
    };

  const handleClickCaptionTextArea =
    (trackId: number, captionId: number) => (event: React.MouseEvent) => {
      if (!textEditorScrollRef.current) {
        return;
      }
      setSelectedCaption(captionId);
    };

  const handleJumpToCaption =
    (trackId: number, captionId: number) => (event: React.MouseEvent) => {
      if (!data || !textEditorScrollRef.current) {
        return;
      }
      const startTime = data.tracks[trackId].cues[captionId].start;
      setVideoTime(startTime / 1000, true);
      setSelectedCaption(captionId);
    };

  const handleDeleteCaption =
    (trackId: number, captionId: number) => (event: React.MouseEvent) => {
      if (!data) {
        return;
      }
      captionListKeySuffix.current++;
      if (captionId === selectedCaption) {
        if (selectedCaption >= data.tracks[trackId].cues.length - 1) {
          // Is the last, we need to make the previous caption the selected one
          setSelectedCaption(
            selectedCaption - 1 >= 0 ? selectedCaption - 1 : -1
          );
        }
      }
      updateCaption(deleteCaption({ trackId, captionId }));
    };

  const handleClickAddCaptionBetweenCaptions =
    (trackId: number, captionId: number) => (event: React.MouseEvent) => {
      captionListKeySuffix.current++;
      updateCaption(addCaptionToTrackRelative({ trackId, captionId }));
    };

  const noTextRowRenderer = () => {
    return (
      <NoTextInTrack
        onClick={handleClickAddCaptionBetweenCaptions(selectedTrack, 0)}
      >
        <div>Add caption</div>
        <PlusCircleFilled />
      </NoTextInTrack>
    );
  };

  const renderTrackList = () => {
    if (!data) {
      return <></>;
    }
    const captionCount =
      selectedTrack >= 0 &&
      data.tracks[selectedTrack] &&
      data.tracks[selectedTrack].cues
        ? data.tracks[selectedTrack].cues.length
        : 0;

    const trackTextRowRenderer = ({
      key,
      style,
      index,
      isScrolling,
    }: ListRowProps) => {
      const { tracks } = data;
      const currentTrack = tracks[selectedTrack];
      if (!currentTrack) {
        return <></>;
      }

      const currentCaption = currentTrack.cues[index];

      if (isScrolling) {
        const formattedStartTime = dayjs
          .duration(Math.floor(currentCaption.start), "milliseconds")
          .format("HH:mm:ss.SSS");
        return (
          <ScrollingEditorField style={style} key={key}>
            <ScrollingTime>{formattedStartTime}</ScrollingTime>
            <ScrollingText>
              {currentCaption.text.substring(0, 32)}
            </ScrollingText>
          </ScrollingEditorField>
        );
      }

      const start = dayjs
        .duration(currentCaption.start, "milliseconds")
        .format("HHmmssSSS");

      const end = dayjs
        .duration(currentCaption.end, "milliseconds")
        .format("HHmmssSSS");
      const duration = dayjs
        .duration(currentCaption.end - currentCaption.start, "milliseconds")
        .format("HHmmssSSS");

      // Use a property of the previous caption as part of this row's key so that reordering captions will trigger a refresh
      const previousCaptionKeyPart = currentTrack.cues[index - 1]
        ? currentTrack.cues[index - 1].end
        : "0";
      const rowKey = `${key}_${selectedTrack}_${captionListKeySuffix.current}_${previousCaptionKeyPart}`;
      const characterPerSecond =
        (currentCaption.text || "").length /
        (currentCaption.end - currentCaption.start) /
        TIME.MS_TO_SECONDS;
      const charPerSecString = characterPerSecond.toFixed(2);
      return (
        <CaptionTextRow
          key={rowKey}
          style={style}
          selected={index === selectedCaption}
        >
          <AddBetween
            top={true}
            first={index === 0}
            onClick={handleClickAddCaptionBetweenCaptions(selectedTrack, index)}
          >
            <PlusCircleFilled />
          </AddBetween>
          <TextEditorRow /* gutter={GRID_GUTTER} */>
            <TextEditorColumn>
              <EditorTextAreaWrapper>
                <EditorTextArea
                  dir="auto"
                  key={rowKey}
                  name={`nc-ta-${index}`}
                  id={`nc-ta-${index}`}
                  dirName={`nc-ta-${index}.dir`}
                  defaultValue={currentCaption.text}
                  onClick={handleClickCaptionTextArea(selectedTrack, index)}
                  onChange={handleChangeCaptionText(selectedTrack, index)}
                />
              </EditorTextAreaWrapper>
              <WarningText warn={characterPerSecond > 25}>
                {charPerSecString} char/s
              </WarningText>
            </TextEditorColumn>
            <TextEditorColumn>
              <CueActionButton
                onClick={handleJumpToCaption(selectedTrack, index)}
                size="small"
              >
                <CompressOutlined />
              </CueActionButton>
              <CueActionButton
                onClick={handleDeleteCaption(selectedTrack, index)}
                size="small"
              >
                <DeleteOutlined style={{ color: colors.dislike }} />
              </CueActionButton>
            </TextEditorColumn>
            <TextEditorColumn>
              <div>
                <TimeInput>
                  <TimeInputLabel>
                    <LoginOutlined />
                  </TimeInputLabel>
                  <DurationInput
                    value={start}
                    onChange={handleChangeStartTime(selectedTrack, index)}
                    onKeyboardShortcutInput={handleStartTimeKeyboardInput(
                      selectedTrack,
                      index
                    )}
                  />
                </TimeInput>
              </div>
              <div>
                <TimeInput>
                  <TimeInputLabel>
                    <ClockCircleOutlined />
                  </TimeInputLabel>
                  <DisabledNumberFormat
                    format={"##:##:##.###"}
                    value={duration}
                    displayType="text"
                  />
                </TimeInput>
              </div>
              <div>
                <TimeInput>
                  <TimeInputLabel>
                    <LogoutOutlined />
                  </TimeInputLabel>
                  <DurationInput
                    value={end}
                    onChange={handleChangeEndTime(selectedTrack, index)}
                    onKeyboardShortcutInput={handleEndTimeKeyboardInput(
                      selectedTrack,
                      index
                    )}
                  />
                </TimeInput>
              </div>
            </TextEditorColumn>
          </TextEditorRow>
          {index === currentTrack.cues.length - 1 && (
            <AddBetween
              top={false}
              last={true}
              onClick={handleClickAddCaptionBetweenCaptions(
                selectedTrack,
                index + 1
              )}
            >
              <PlusCircleFilled />
            </AddBetween>
          )}
        </CaptionTextRow>
      );
    };

    return (
      <TextEditorPane>
        <AutoSizer>
          {({ width, height }) => (
            <List
              ref={textEditorScrollRef}
              height={height}
              width={width}
              rowCount={captionCount}
              rowHeight={170}
              overscanRowCount={2}
              noRowsRenderer={noTextRowRenderer}
              rowRenderer={trackTextRowRenderer}
            />
          )}
        </AutoSizer>
      </TextEditorPane>
    );
  };

  const handleClickMute = () => {
    if (!videoElement) {
      return;
    }
    videoElement.muted = !videoElement.muted;
  };

  const handleChangeVolume = (newVolume: number) => {
    if (!videoElement) {
      return;
    }
    newVolume = newVolume / MAX_VOLUME;
    videoElement.volume = newVolume;
    videoElement.muted = newVolume === 0;
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

  const handleSeekShortcut = (duration: number) => (event) => {
    event.preventDefault();
    setVideoTime(
      clamp(
        videoElement.currentTime + duration * TIME.MS_TO_SECONDS,
        0,
        videoElement.duration
      ),
      true
    );
  };

  const handleSeekNextFrame = useCallback(
    (event) => {
      event.preventDefault();
      setVideoTime(
        clamp(
          videoElement.currentTime + 1 / videoFps,
          0,
          videoElement.duration
        ),
        true
      );
    },
    [videoFps]
  );

  const handleSeekPreviousFrame = useCallback(
    (event) => {
      event.preventDefault();
      setVideoTime(
        clamp(
          videoElement.currentTime - 1 / videoFps,
          0,
          videoElement.duration
        ),
        true
      );
    },
    [videoFps]
  );

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

  const handleShortcutSave = (event: Event) => {
    event.preventDefault();
    onSave();
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
    endMs: number
  ) => {
    updateCaption(shiftTimings({ duration: shiftMs, startMs, endMs }));
  };

  const hotkeyHandlers: EditorShortcutHandlers = {
    [EDITOR_KEYS.PLAY_PAUSE]: handleClickPlay,
    [EDITOR_KEYS.SET_START_TO_CURRENT_TIME]: handleSetStartToCurrentTime,
    [EDITOR_KEYS.SET_END_TO_CURRENT_TIME]: handleSetEndToCurrentTime,
    [EDITOR_KEYS.UNDO]: handleUndo,
    [EDITOR_KEYS.REDO]: handleRedo,
    [EDITOR_KEYS.GO_TO_NEXT_CAPTION]: handleGotoNextCaption,
    [EDITOR_KEYS.GO_TO_PREVIOUS_CAPTION]: handleGotoPreviousCaption,
    [EDITOR_KEYS.SEEK_NEXT_FRAME]: handleSeekNextFrame,
    [EDITOR_KEYS.SEEK_PREVIOUS_FRAME]: handleSeekPreviousFrame,
    [EDITOR_KEYS.SEEK_FORWARD_500_MS]: handleSeekShortcut(500),
    [EDITOR_KEYS.SEEK_BACK_500_MS]: handleSeekShortcut(-500),
    [EDITOR_KEYS.SEEK_FORWARD_5_SECONDS]: handleSeekShortcut(5000),
    [EDITOR_KEYS.SEEK_BACK_5_SECONDS]: handleSeekShortcut(-5000),
    [EDITOR_KEYS.NEW_CAPTION]: handleNewCaptionFromShortcut,
    [EDITOR_KEYS.SAVE]: handleShortcutSave,
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
          show={showEditor}
          captionMoveType={currentMoveType}
          className="scoped-antd"
        >
          <RootSplitPane split="horizontal" defaultSizes={[1, 1]}>
            <SplitPane split="vertical">
              {renderTrackList()}
              <VideoPane>
                <EditorVideoContainer
                  playerStyles={
                    window.selectedProcessor?.editorVideoPlayerStyles || ""
                  }
                  innerRef={editorVideoContainerRef}
                ></EditorVideoContainer>
                <VideoControls>
                  <VideoScrubber
                    videoElement={videoElement}
                    onSeek={handleSeek}
                  />
                  <Space style={{ justifyContent: "center" }}>
                    <Popover
                      placement={"top"}
                      content={
                        <div>
                          <VolumeSlider
                            range={false}
                            defaultValue={10}
                            step={0.1}
                            min={0}
                            max={MAX_VOLUME}
                            onChange={handleChangeVolume}
                          />
                        </div>
                      }
                    >
                      <Button onClick={handleClickMute}>
                        <FontAwesomeIcon
                          icon={
                            volume > 0 && !isMute ? faVolumeUp : faVolumeMute
                          }
                          style={{
                            verticalAlign: "middle",
                          }}
                        />
                      </Button>
                    </Popover>
                    <Button onClick={handleClickPlay}>
                      {isPlaying ? <PauseOutlined /> : <CaretRightOutlined />}
                    </Button>
                  </Space>
                </VideoControls>
              </VideoPane>
              <SettingsPane>
                <SettingsPanel
                  caption={data}
                  videoElement={videoElement}
                  videoDurationMs={videoDurationMs}
                  selectedTrack={selectedTrack}
                  selectedCaption={selectedCaption}
                  captionModificationState={currentMoveType}
                  onToggleMoveCaptionPosition={handleToggleMoveCaptionPosition}
                  onToggleMoveTrackPosition={handleToggleMoveTrackPosition}
                  onToggleMoveGlobalPosition={handleToggleMoveGlobalPosition}
                  onUpdateCaption={handleUpdateCaption}
                />
                {renderInfoMessage()}
              </SettingsPane>
            </SplitPane>
            <div>
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
                    />
                  </Space>
                </div>
                <EditorTimeline
                  show={showEditor}
                  caption={data}
                  scale={timelineScale}
                  videoDurationMs={videoDurationMs}
                  videoElement={videoElement}
                  selectedTrack={selectedTrack}
                  selectedCaption={selectedCaption}
                  onAddTrack={handleAddTrack}
                  onRemoveTrack={handleRemoveTrack}
                  onClickTimeline={handleClickTimeline}
                  onClickCaption={handleClickCaption}
                  onNewCaption={handleNewCaption}
                  setTimelineScroll={setTimelineScroll}
                  onUpdateCaptionTime={handleUpdateCaptionTime}
                ></EditorTimeline>
              </TimelineContainer>
            </div>
          </RootSplitPane>
        </RootPane>
      </HotKeys>
      <ShiftTimingsModal
        visible={isShiftTimingsModalOpen}
        onShift={handleShiftTimings}
        onCancel={handleCancelShiftTimingsModal}
        videoElement={videoElement}
      />
    </>,
    editorPortalElement
  );
};

export const CaptionEditor = React.memo(
  CaptionEditorInternal,
  (prevProps, nextProps) => {
    const isSubEqual = isEqual(
      prevProps.captionContainer,
      nextProps.captionContainer
    );
    const isShortcutEqual = isEqual(
      prevProps.keyboardShortcuts,
      nextProps.keyboardShortcuts
    );

    return (
      prevProps.isSubmitting === nextProps.isSubmitting &&
      prevProps.canRedo === nextProps.canRedo &&
      prevProps.canUndo === nextProps.canUndo &&
      prevProps.showEditor === nextProps.showEditor &&
      prevProps.captionContainerElement === nextProps.captionContainerElement &&
      prevProps.videoElement === nextProps.videoElement &&
      prevProps.videoMenuComponent === nextProps.videoMenuComponent &&
      prevProps.updateCaption === nextProps.updateCaption &&
      prevProps.onRedo === nextProps.onRedo &&
      prevProps.onUndo === nextProps.onUndo &&
      prevProps.onSave === nextProps.onSave &&
      isShortcutEqual &&
      isSubEqual
    );
  }
);
