import { CaptionContainer } from "@/common/feature/video/types";
import {
  NekoCaption,
  CaptionDataContainer,
  CaptionSettings,
  Track,
  TrackSettings,
} from "@/common/caption-parsers/types";
import cloneDeep from "lodash/cloneDeep";
import sortedIndexBy from "lodash/sortedIndexBy";
import { DependencyList, MutableRefObject, useEffect, useRef } from "react";
import {
  MAX_CONCURRENT_CAPTIONS,
  MAX_TRACKS,
} from "@/common/feature/video/constants";
import { Coords, CSSPosition } from "@/common/types";
import { parseDurationToMs } from "@/common/date-utils";

export type CaptionMutatorResult = {
  caption: CaptionDataContainer | undefined;
  error?: string;
};
export class CaptionMutators {
  public static modifyCaptionGlobalSettings(
    caption: CaptionDataContainer,
    settings: CaptionSettings
  ): CaptionMutatorResult {
    const newCaption: CaptionDataContainer = {
      ...caption,
      settings: { ...settings },
    };
    return { caption: newCaption };
  }
  public static modifyCaptionTrackSettings(
    caption: CaptionDataContainer,
    trackId: number,
    settings: TrackSettings
  ): CaptionMutatorResult {
    const newCaption: CaptionDataContainer = {
      ...caption,
      tracks: caption.tracks.map((track, id) => {
        if (id !== trackId) {
          return track;
        }
        return {
          ...track,
          settings,
        };
      }),
    };
    return { caption: newCaption };
  }

  public static modifyCaption(
    caption: CaptionDataContainer,
    trackId: number,
    captionId: number,
    newCaption: NekoCaption
  ): CaptionMutatorResult {
    const updatedCaption: CaptionDataContainer = {
      ...caption,
    };
    const newCues = updatedCaption.tracks[trackId].cues.map(
      (caption, index) => {
        if (captionId === index) {
          return newCaption;
        }
        return { ...caption };
      }
    );

    const updatedTrack: Track = {
      ...updatedCaption.tracks[trackId],
      cues: newCues,
    };
    // Check to see if we need to re-sort the modified track
    const nextCaption = updatedTrack.cues[captionId + 1];
    const previousCaption = updatedTrack.cues[captionId - 1];
    if (
      (nextCaption && newCaption.start > nextCaption.start) ||
      (previousCaption && newCaption.end < previousCaption.end)
    ) {
      // TODO: sorting is not required, just need to shift it forwards/backwards until the condition is satisfied.
      updatedTrack.cues.sort((a, b) => {
        return a.start - b.start;
      });
    }

    updatedCaption.tracks = updatedCaption.tracks.map((track, index) => {
      if (trackId === index) {
        return updatedTrack;
      }
      return { ...track };
    });

    return { caption: updatedCaption };
  }

  public static modifyCaptionStartTime(
    caption: CaptionDataContainer,
    trackId: number,
    captionId: number,
    newFormattedTime: string
  ): CaptionMutatorResult {
    const newCaption = {
      ...caption.tracks[trackId].cues[captionId],
    };
    newFormattedTime = newFormattedTime.replace("_", "0");
    newCaption.start = parseDurationToMs(newFormattedTime);
    return this.modifyCaption(caption, trackId, captionId, newCaption);
  }

  public static modifyCaptionStartTimeMs(
    caption: CaptionDataContainer,
    trackId: number,
    captionId: number,
    newTime: number
  ): CaptionMutatorResult {
    const newCaption = {
      ...caption.tracks[trackId].cues[captionId],
    };
    newCaption.start = newTime;
    return this.modifyCaption(caption, trackId, captionId, newCaption);
  }

  public static modifyCaptionEndTimeMs(
    caption: CaptionDataContainer,
    trackId: number,
    captionId: number,
    newTime: number
  ): CaptionMutatorResult {
    const newCaption = {
      ...caption.tracks[trackId].cues[captionId],
    };
    newCaption.end = newTime;
    return this.modifyCaption(caption, trackId, captionId, newCaption);
  }

  public static modifyCaptionEndTime(
    caption: CaptionDataContainer,
    trackId: number,
    captionId: number,
    newFormattedTime: string
  ): CaptionMutatorResult {
    const newCaption = {
      ...caption.tracks[trackId].cues[captionId],
    };
    newFormattedTime = newFormattedTime.replace("_", "0");
    newCaption.end = parseDurationToMs(newFormattedTime);
    return this.modifyCaption(caption, trackId, captionId, newCaption);
  }

  public static modifyCaptionTime(
    caption: CaptionDataContainer,
    trackId: number,
    captionId: number,
    startMs: number,
    endMs: number
  ): CaptionMutatorResult {
    const newCaption = {
      ...caption.tracks[trackId].cues[captionId],
    };
    newCaption.start = startMs;
    newCaption.end = endMs;
    return this.modifyCaption(caption, trackId, captionId, newCaption);
  }

  public static changeCaptionTrackId(
    caption: CaptionDataContainer,
    trackId: number,
    captionId: number,
    startMs: number,
    endMs: number,
    finalTrackId: number
  ): CaptionMutatorResult {
    if (
      !caption.tracks ||
      finalTrackId < 0 ||
      finalTrackId >= caption.tracks.length
    ) {
      return { caption, error: "Invalid target track" };
    }
    const newCaption = {
      ...caption.tracks[trackId].cues[captionId],
    };
    newCaption.start = startMs;
    newCaption.end = endMs;

    let { caption: container } = this.deleteCaption(
      caption,
      trackId,
      captionId
    );
    const addCaptionResult = this.addCaptionToTrackTime(
      container,
      finalTrackId,
      newCaption.start,
      newCaption,
      true
    );
    if (addCaptionResult.error) {
      return { caption, error: addCaptionResult.error };
    }
    container = addCaptionResult.caption;

    const targetTrack = container.tracks[finalTrackId];
    const nextCaption = targetTrack.cues[captionId + 1];
    const previousCaption = targetTrack.cues[captionId - 1];
    if (
      (nextCaption && newCaption.start > nextCaption.start) ||
      (previousCaption && newCaption.end < previousCaption.end)
    ) {
      // TODO: sorting is not required, just need to shift it forwards/backwards until the condition is satisfied.
      targetTrack.cues.sort((a, b) => {
        return a.start - b.start;
      });
    }

    return { caption: container };
  }

  public static modifyCaptionText(
    caption: CaptionDataContainer,
    trackId: number,
    captionId: number,
    text: string
  ): CaptionMutatorResult {
    const newCaption = {
      ...caption.tracks[trackId].cues[captionId],
    };
    newCaption.text = text;
    return this.modifyCaption(caption, trackId, captionId, newCaption);
  }

  public static deleteCaption(
    caption: CaptionDataContainer,
    trackId: number,
    captionId: number
  ): CaptionMutatorResult {
    const newCaptions = [...caption.tracks[trackId].cues].filter(
      (_, index) => index !== captionId
    );
    const newContainer = cloneDeep(caption);
    newContainer.tracks[trackId].cues = newCaptions;
    return { caption: newContainer };
  }

  /**
   * Add a caption to a track relative to a given caption id
   * @param caption The container for the caption
   * @param trackId The caption's track
   * @param captionId The position of the new caption (i.e. add before the caption at captionId)
   * @param before Whether to add before or after the specified position
   */
  public static addCaptionToTrackRelative(
    caption: CaptionContainer,
    trackId: number,
    captionId: number
  ): CaptionMutatorResult {
    const track: Track = { ...caption.data.tracks[trackId] };
    const { cues } = track;
    captionId = Math.min(captionId, cues.length);
    let start = 0,
      end = 0;
    if (cues.length <= 0) {
      end = 1000;
    } else if (captionId === cues.length) {
      start = cues[cues.length - 1].end;
      end = start + 1000;
    } else {
      // Only allow addition if there is free space
      const currentCaption = cues[captionId];
      const previousCaption = cues[captionId - 1];
      if (!currentCaption && !previousCaption) {
        // This shouldn't happen
        console.warn(
          "[addCaptionToTrack] Can't find both current and previous caption at the given id"
        );
        return {
          caption: caption.data,
          error: "Can't find both current and previous cue at the given id",
        };
      } else if (currentCaption && !previousCaption) {
        // This will be the first caption
        if (currentCaption.start <= 0) {
          return { caption: caption.data };
        }
        end = currentCaption.start;
        start = Math.max(0, end - 1000);
      } else if (!currentCaption && previousCaption) {
        // This will be the last caption
        start = previousCaption.end;
        end = start + 1000;
      } else {
        // The new caption will be between 2 captions
        const captionInterval = currentCaption.start - previousCaption.end;
        if (captionInterval <= 500) {
          // There's no space
          return {
            caption: caption.data,
            error: "Interval between cues is too short",
          };
        }
        start = previousCaption.end;
        end = start + 500;
      }
    }
    const newCue: NekoCaption = {
      start,
      end,
      text: "",
    };

    const newCues = [...cues];
    newCues.splice(captionId, 0, newCue);
    track.cues = newCues;

    const newCaption = cloneDeep(caption);
    newCaption.data.tracks[trackId] = track;

    return { caption: newCaption.data };
  }

  /**
   * Add a caption cue to a track at the given time
   * @param caption
   * @param trackId ID of the track
   * @param timeMs Time in milliseconds to add the caption to
   */
  public static addCaptionToTrackTime(
    caption: CaptionDataContainer,
    trackId: number,
    timeMs: number,
    newCue?: NekoCaption,
    skipValidityChecks = false
  ): CaptionMutatorResult & { newCaptionId: number } {
    const track: Track = { ...caption.tracks[trackId] };
    const { cues } = track;

    if (!newCue) {
      newCue = {
        start: timeMs,
        end: timeMs + 500,
        text: "",
      };
    }

    // Look for the position within the caption array to place the caption
    const captionId = Math.min(
      sortedIndexBy(cues, newCue, (caption) => {
        return caption.start;
      }),
      cues.length
    );

    if (!skipValidityChecks) {
      if (cues.length <= 0) {
        // Nothing needs to be done
      } else if (captionId === cues.length) {
        // Last caption, nothing needs to be done
      } else {
        // Only allow addition if there is free space
        const currentCaption = cues[captionId];
        const previousCaption = cues[captionId - 1];
        if (!currentCaption && !previousCaption) {
          // This shouldn't happen
          console.warn(
            "[addCaptionToTrack] Can't find both current and previous caption at the given id"
          );
          return { caption, newCaptionId: -1 };
        } else if (currentCaption && !previousCaption) {
          // This will be the first caption
          if (currentCaption.start <= 0) {
            // Not enough space for insertion
            return {
              caption,
              newCaptionId: -1,
              error: "Not enough space to add a caption",
            };
          }
        } else if (!currentCaption && previousCaption) {
          // This will be the last caption
        } else {
          // The new caption will be between 2 captions
          const captionInterval = currentCaption.start - newCue.end;
          if (captionInterval < 0) {
            // Force the new caption to end right before the start of the next one
            newCue.end = currentCaption.start - 1;
          }
        }
      }
    }

    const newCaptions = [...cues];
    newCaptions.splice(captionId, 0, newCue);
    track.cues = newCaptions;

    const newCaption = cloneDeep(caption);
    newCaption.tracks[trackId] = track;

    return { caption: newCaption, newCaptionId: captionId };
  }

  public static addTrack(caption: CaptionDataContainer): CaptionMutatorResult {
    const updatedCaption = cloneDeep(caption);
    updatedCaption.tracks.push({
      cues: [],
    });
    return { caption: updatedCaption };
  }

  public static removeTrack(
    caption: CaptionDataContainer,
    trackId: number
  ): CaptionMutatorResult {
    if (caption.tracks.length <= 1) {
      return { caption, error: "At least 1 track needs to be present" };
    }
    const updatedCaption = {
      ...caption,
    };
    updatedCaption.tracks = updatedCaption.tracks.filter((track, id) => {
      return id !== trackId;
    });
    return { caption: updatedCaption };
  }
}

export const useCaptionDrag = (
  showEditor: boolean,
  videoDimensions: MutableRefObject<Coords>,
  canDrag: (trackId: number, captionId: number) => boolean,
  onDragEnd: (trackId: number, endPosition: CSSPosition) => void,
  dependencies: DependencyList = []
) => {
  const isDragging = useRef<boolean[]>([]);
  const dragStartCoords = useRef<Coords[]>([]);
  const correctedDragStartCoords = useRef<CSSPosition[]>([]);
  const containers = useRef<HTMLDivElement[]>([]);

  const getCurrentDragPosition = (
    index: number,
    mouseX: number,
    mouseY: number
  ): CSSPosition => {
    const startCoords = dragStartCoords.current[index];
    const diffX = mouseX - startCoords.x;
    const diffY = mouseY - startCoords.y;
    const diffXPercentage = (diffX / videoDimensions.current.x) * 100;
    const diffYPercentage = (diffY / videoDimensions.current.y) * 100;
    const correctedDragStartCoord = correctedDragStartCoords.current[index];
    const position: CSSPosition = {};

    if (correctedDragStartCoord.left !== undefined) {
      position.left = correctedDragStartCoord.left + diffXPercentage;
    }
    if (correctedDragStartCoord.bottom !== undefined) {
      position.bottom = correctedDragStartCoord.bottom - diffYPercentage;
    }
    if (correctedDragStartCoord.right !== undefined) {
      position.right = correctedDragStartCoord.right - diffXPercentage;
    }
    if (correctedDragStartCoord.top !== undefined) {
      position.top = correctedDragStartCoord.top + diffYPercentage;
    }
    return position;
  };

  const setContainerPosition = (index: number, position: CSSPosition): void => {
    const correctedDragStartCoord = correctedDragStartCoords.current[index];
    const container = containers.current[index];
    if (correctedDragStartCoord.left !== undefined) {
      container.style.left = `${position.left}%`;
    }
    if (correctedDragStartCoord.bottom !== undefined) {
      container.style.bottom = `${position.bottom}%`;
    }
    if (correctedDragStartCoord.right !== undefined) {
      container.style.right = `${position.right}%`;
    }
    if (correctedDragStartCoord.top !== undefined) {
      container.style.top = `${position.top}%`;
    }
  };

  // Effect for adding drag listeners to caption containers
  useEffect(() => {
    const totalContainerCount = MAX_TRACKS * MAX_CONCURRENT_CAPTIONS;

    isDragging.current = Array(totalContainerCount).fill(false);
    dragStartCoords.current = Array(totalContainerCount).fill({
      x: 0,
      y: 0,
    });
    containers.current = Array(totalContainerCount).fill(undefined);
    const mouseDowns = Array(totalContainerCount)
      .fill(0)
      .map((_, index) => {
        return (event: MouseEvent) => {
          const container = containers.current[index];
          const trackId = parseInt(
            container.getAttribute("data-track") || "-1"
          );
          const captionId = parseInt(
            container.getAttribute("data-caption") || "-1"
          );
          if (!canDrag(trackId, captionId)) {
            return;
          }
          const coordsString = container.getAttribute("data-coords");
          if (!coordsString) {
            return;
          }
          let coords: CSSPosition;
          try {
            coords = JSON.parse(coordsString);
          } catch (e) {
            return;
          }

          isDragging.current[index] = true;
          dragStartCoords.current[index] = {
            x: event.clientX,
            y: event.clientY,
          };

          correctedDragStartCoords.current[index] = coords;
        };
      });

    const mouseMoves = Array(totalContainerCount)
      .fill(0)
      .map((_, index) => {
        return (event: MouseEvent) => {
          if (!isDragging.current[index]) {
            return;
          }
          const position = getCurrentDragPosition(
            index,
            event.clientX,
            event.clientY
          );
          setContainerPosition(index, position);
        };
      });

    const mouseUps = Array(totalContainerCount)
      .fill(0)
      .map((_, index) => {
        return (event: MouseEvent) => {
          if (isDragging.current[index]) {
            const trackId = Math.floor(index / MAX_CONCURRENT_CAPTIONS);
            const position = getCurrentDragPosition(
              index,
              event.clientX,
              event.clientY
            );
            setContainerPosition(index, position);
            onDragEnd(trackId, position);
          }
          isDragging.current[index] = false;
        };
      });

    if (showEditor) {
      // Add event listeners to the caption containers
      const containerElements = document.querySelectorAll(".nekocap-caption");
      if (containerElements.length !== totalContainerCount) {
        console.warn(
          `Number of caption containers is different from initialized drag handler count! Container: ${containerElements.length} vs Handler: ${totalContainerCount}`
        );
      }
      containerElements.forEach(
        (captionContainer: HTMLDivElement, index: number) => {
          containers.current[index] = captionContainer;
          captionContainer.addEventListener("mousedown", mouseDowns[index]);
          document.addEventListener("mousemove", mouseMoves[index]);
          document.addEventListener("mouseup", mouseUps[index]);
        }
      );
    }
    return () => {
      document
        .querySelectorAll(".nekocap-caption")
        .forEach((captionContainer: HTMLDivElement, index: number) => {
          captionContainer.removeEventListener("mousedown", mouseDowns[index]);
          document.removeEventListener("mousemove", mouseMoves[index]);
          document.removeEventListener("mouseup", mouseUps[index]);
        });
    };
  }, [...dependencies, videoDimensions, canDrag, showEditor]);
};
