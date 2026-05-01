import { useCallback, useMemo, useRef, MutableRefObject } from "react";
import { isInExtension } from "@/common/client-utils";
import { TIME } from "@/common/constants";
import debounce from "@/common/debounce";
import {
  addCaptionToTrackTime,
  modifyCaptionTime,
  modifyCaptionWithMultipleActions,
} from "@/common/feature/caption-editor/actions";
import {
  EDITOR_KEYS,
  EditorShortcutHandlers,
} from "@/common/feature/caption-editor/types";
import { CaptionDataContainer } from "@/common/caption-parsers/types";
import { BooleanFilter, clamp, isInputElementSelected } from "@/common/utils";
import { AnyAction, PayloadAction } from "@reduxjs/toolkit";
import { CaptionMutators } from "../utils";
import { triggerEnterKeyupEvent } from "../utils/trigger-enter-keyup-event";
import { VideoPlayer } from "../video-player/video-player";

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

export type UseCaptionEditorHotkeysParams = {
  data: CaptionDataContainer | undefined;
  videoPlayer: VideoPlayer;
  videoFps: number;
  selectedTrack: number;
  selectedCaption: number;
  isPlayingRef: MutableRefObject<boolean>;
  captionListKeySuffix: MutableRefObject<number>;
  focusNewCaptionIndex: MutableRefObject<number>;
  lastDebouncedAction: MutableRefObject<PayloadAction<any> | undefined>;
  updateCaption: (action: AnyAction, callback?: () => void) => void;
  selectAndScrollToCaptionId: (captionId: number) => void;
  setVideoTime: (timeInSeconds: number, scrollTimeline?: boolean) => void;
  handleNewCaption: (trackId: number, newTime: number) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSave: () => void;
};

/**
 * Assembles all keyboard shortcut handlers for the caption editor
 * and returns the hotkeyHandlers map and debouncedUpdateCaption.
 */
export function useCaptionEditorHotkeys({
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
}: UseCaptionEditorHotkeysParams) {
  const debouncedUpdateCaption = useMemo(
    () => debounce(updateCaption, 500),
    [updateCaption],
  );

  const queueDebounceUpdateCaption = (action: PayloadAction<any>) => {
    lastDebouncedAction.current = { ...action };
    debouncedUpdateCaption(action);
  };

  // useCallback not necessary for the next few functions, changed it while attempting to fix react-hotkey issues
  // too lazy to change back
  const handleClickPlay = useCallback(
    (event) => {
      if (!videoPlayer) {
        return;
      }
      event.preventDefault();
      if (isPlayingRef.current) {
        videoPlayer.pause();
      } else {
        videoPlayer.play();
      }
    },
    [videoPlayer, isPlayingRef],
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
      const newStartTime = videoPlayer.currentTime() * 1000;
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
        }),
      );
    },
    [data, selectedTrack, selectedCaption, videoPlayer, updateCaption],
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
      const newEndTime = videoPlayer.currentTime() * 1000;
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
        }),
      );
    },
    [data, selectedTrack, selectedCaption, videoPlayer, updateCaption],
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
      focusCaptionTextArea(newId, 0);
    },
    [
      data,
      selectedCaption,
      selectedTrack,
      selectAndScrollToCaptionId,
      setVideoTime,
    ],
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
      focusCaptionTextArea(newId, 0);
    },
    [
      data,
      selectedCaption,
      selectAndScrollToCaptionId,
      selectedTrack,
      setVideoTime,
    ],
  );

  const handleNewCaptionFromShortcut = useCallback(
    (event: Event) => {
      if (!data || selectedTrack < 0) {
        return;
      }
      event.preventDefault();
      console.log(
        "Adding new caption at current time",
        videoPlayer.currentTime(),
        "last debounced action",
        lastDebouncedAction.current,
      );
      let newTime = videoPlayer.currentTime() * 1000;
      if (selectedCaption >= 0) {
        newTime = Math.max(
          newTime,
          data.tracks[selectedTrack].cues[selectedCaption].end,
        );
      }
      // Dry run adding it to see what the new id will be
      const { newCaptionId } = CaptionMutators.addCaptionToTrackTime(
        data,
        selectedTrack,
        newTime,
        undefined,
        false,
      );
      focusNewCaptionIndex.current = newCaptionId;
      if (isInputElementSelected()) {
        const inputElement = document.activeElement;
        let batchUpdates = false;
        if (debouncedUpdateCaption.pending()) {
          // We'll do the update and creation of new caption together
          batchUpdates = true;
          debouncedUpdateCaption.cancel();
        } else {
          debouncedUpdateCaption.flush();
        }

        const dispatchUpdates = () => {
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
              }),
            );
          } else {
            handleNewCaption(selectedTrack, newTime);
          }
        };
        // Force keyup now as we will trigger a rerender right after this, which causes the keyup to not be detected
        // that leads to hotkeys not working until a refocus.
        triggerEnterKeyupEvent(inputElement);
        dispatchUpdates();

        if (!isInExtension()) {
          focusNewCaptionIndex.current = newCaptionId;
        }
      } else {
        debouncedUpdateCaption.flush();
        handleNewCaption(selectedTrack, newTime);
      }
    },
    [
      data,
      debouncedUpdateCaption,
      handleNewCaption,
      selectedCaption,
      selectedTrack,
      updateCaption,
      videoPlayer,
    ],
  );

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

  const handleSeekShortcut = (duration: number) => (event) => {
    event.preventDefault();
    setVideoTime(
      clamp(
        videoPlayer.currentTime(
          videoPlayer.currentTime() + duration * TIME.MS_TO_SECONDS,
        ),
        0,
        videoPlayer.duration(),
      ),
      true,
    );
  };

  const handleSeekNextFrame = useCallback(
    (event) => {
      event.preventDefault();
      setVideoTime(
        clamp(
          videoPlayer.currentTime() + 1 / videoFps,
          0,
          videoPlayer.duration(),
        ),
        true,
      );
    },
    [setVideoTime, videoFps, videoPlayer],
  );

  const handleSeekPreviousFrame = useCallback(
    (event) => {
      event.preventDefault();
      setVideoTime(
        clamp(
          videoPlayer.currentTime() - 1 / videoFps,
          0,
          videoPlayer.duration(),
        ),
        true,
      );
    },
    [setVideoTime, videoFps, videoPlayer],
  );

  const handleShortcutSave = (event: Event) => {
    event.preventDefault();
    onSave();
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

  return {
    hotkeyHandlers,
    handleClickPlay,
    handleUndo,
    handleRedo,
    debouncedUpdateCaption,
    queueDebounceUpdateCaption,
  };
}
