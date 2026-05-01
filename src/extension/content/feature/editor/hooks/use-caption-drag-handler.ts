import { useCallback, useRef, MutableRefObject } from "react";
import { CaptionModificationState } from "@/common/feature/caption-editor/types";
import { CaptionContainer } from "@/common/feature/video/types";
import { CaptionDataContainer } from "@/common/caption-parsers/types";
import { CSSPosition, Coords } from "@/common/types";
import { AnyAction } from "@reduxjs/toolkit";
import { DEFAULT_LAYOUT_SETTINGS } from "../constants";
import { useCaptionDrag } from "../utils";
import {
  modifyCaption,
  modifyCaptionGlobalSettings,
  modifyCaptionTrackSettings,
} from "@/common/feature/caption-editor/actions";

/**
 * Manages caption drag-to-reposition logic, including determining
 * which captions can be dragged based on the current modification state.
 */
export function useCaptionDragHandler(
  showEditor: boolean,
  videoDimensions: MutableRefObject<Coords>,
  data: CaptionDataContainer | undefined,
  selectedTrack: number,
  selectedCaption: number,
  currentMoveType: CaptionModificationState,
  captionContainer: CaptionContainer | undefined,
  updateCaption: (action: AnyAction, callback?: () => void) => void,
) {
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
        }),
      );
    } else if (currentMoveType === CaptionModificationState.Track) {
      const trackData = data!.tracks[trackId];
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
        }),
      );
    } else if (currentMoveType === CaptionModificationState.Global) {
      const globalSettings = data!.settings;
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
        }),
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
    [captionContainer, selectedTrack, selectedCaption, currentMoveType],
  );
}
