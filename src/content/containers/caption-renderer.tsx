import * as React from "react";
import { useCallback, useEffect, useRef } from "react";
import { findClosestCaption } from "@/common/feature/video/utils";
import { CaptionContainer } from "@/common/feature/video/types";
import {
  CaptionAlignment,
  NekoCaption,
  CaptionDataContainer,
  TrackSettings,
} from "@/common/caption-parsers/types";
import {
  MAX_CONCURRENT_CAPTIONS,
  MAX_TRACKS,
} from "@/common/feature/video/constants";
import { isEqual } from "lodash";
import { Coords } from "@/common/types";
import { useAnimationFrame, useResize } from "@/hooks";

interface CaptionRendererProps {
  caption?: CaptionContainer;
  videoElement: HTMLVideoElement;
  captionContainerElement: HTMLElement;
  showCaption: boolean;
}

const captionWrapperElementStyle = `
display: flex;
justify-content: center;
position: absolute;
padding: 0px 10px;
color: white;
text-align: center;
box-sizing: border-box;
`;

const captionTextElementStyle = `
position: relative;
padding: 0px 10px;
font-size: 33px;
text-align: left;
background-color: rgb(37 37 37 / 90%);
border-radius: 0.4em;
box-sizing: border-box;
`;

const localCaptionContainerStyle = `
position: absolute;
top: 0;
left: 50%;
transform: translate(-50%, 0);
height: 100%;
pointer-events: none;
`;

const DEFAULT_BOTTOM_OFFSET_FACTOR = 0.074074; // How many pixels to offset the caption from the bottom of the video (a factor of the video height)
const DEFAULT_TOP_OFFSET_FACTOR = 0.0333333; // How many pixels to offset the caption from the top of the video (a factor of the video height)
const DEFAULT_FONT_SIZE_FACTOR = 43 / 1080; // Factor of font size based on the width of the video

type AlignmentMeta = {
  leftDefault: number;
  topDefault: number;
  transform: string;
  justify: string;
};

const alignmentDataMap: {
  [id in CaptionAlignment]: AlignmentMeta;
} = {
  [CaptionAlignment.TopLeft]: {
    leftDefault: 0,
    topDefault: DEFAULT_TOP_OFFSET_FACTOR * 100,
    transform: "translate(0, 0)",
    justify: "flex-start",
  },
  [CaptionAlignment.TopCenter]: {
    leftDefault: 50,
    topDefault: DEFAULT_TOP_OFFSET_FACTOR * 100,
    transform: "translate(-50%, 0)",
    justify: "center",
  },
  [CaptionAlignment.TopRight]: {
    leftDefault: 100,
    topDefault: DEFAULT_TOP_OFFSET_FACTOR * 100,
    transform: "translate(-100%, 0)",
    justify: "flex-end",
  },
  [CaptionAlignment.MiddleLeft]: {
    leftDefault: 0,
    topDefault: 50,
    transform: "translate(0, -50%)",
    justify: "flex-start",
  },
  [CaptionAlignment.MiddleCenter]: {
    leftDefault: 50,
    topDefault: 50,
    transform: "translate(-50%, -50%)",
    justify: "center",
  },
  [CaptionAlignment.MiddleRight]: {
    leftDefault: 100,
    topDefault: 50,
    transform: "translate(-100%, -50%)",
    justify: "flex-end",
  },
  [CaptionAlignment.BottomLeft]: {
    leftDefault: 0,
    topDefault: 100 - DEFAULT_TOP_OFFSET_FACTOR * 100,
    transform: "translate(0%, -100%)",
    justify: "flex-start",
  },
  [CaptionAlignment.BottomCenter]: {
    leftDefault: 50,
    topDefault: 100 - DEFAULT_TOP_OFFSET_FACTOR * 100,
    transform: "translate(-50%, -100%)",
    justify: "center",
  },
  [CaptionAlignment.BottomRight]: {
    leftDefault: 100,
    topDefault: 100 - DEFAULT_TOP_OFFSET_FACTOR * 100,
    transform: "translate(-100%, -100%)",
    justify: "flex-end",
  },
};

const alignContainer = (
  container: HTMLElement,
  alignment: CaptionAlignment,
  videoElementHeight: number,
  coords?: Coords,
  coordType = "none"
) => {
  const alignmentData = alignmentDataMap[alignment];
  const leftValue = coords ? coords.x * 100 : alignmentData.leftDefault;
  const left = `${leftValue}%`;
  const topValue = coords ? coords.y * 100 : alignmentData.topDefault;
  const top = `${topValue}%`;
  // Reset and set the styles
  container.style.cssText = `${captionWrapperElementStyle}
    justify-content: ${alignmentData.justify};
    left: ${left};
    top: ${top};
    width: 100%;
    transform: ${alignmentData.transform};
  `;
  container.setAttribute(
    "data-coords",
    JSON.stringify({ left: leftValue, top: topValue })
  );
  container.setAttribute("data-layout-type", coordType);
};

const CaptionRendererInternal = ({
  caption,
  videoElement,
  captionContainerElement,
  showCaption,
}: CaptionRendererProps) => {
  const currentCaptionIds = useRef<number[]>([]);
  const captionWrapperElements = useRef<HTMLElement[]>();
  const captionTextElements = useRef<HTMLElement[]>();
  /**
   * We'll create our own container element to prevent modifying the original page too much
   */
  const localCaptionContainer = useRef<HTMLElement>();
  const containerDimensions = useRef<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const previousTime = useRef<number>(-1);

  const updateCaptionContainerStyles = (width: number, height: number) => {
    if (!localCaptionContainer.current) {
      return;
    }
    containerDimensions.current = {
      width: videoElement.offsetWidth,
      height: videoElement.offsetHeight,
    };
    localCaptionContainer.current.style.width = `${width}px`;
    localCaptionContainer.current.style.height = `${height}px`;
    handleTimeUpdate(0, true);
  };

  // Create the caption element to render into
  useEffect(() => {
    if (!captionContainerElement) {
      return;
    }
    captionContainerElement.style.position = "relative";

    const newCaptionElements = [];
    const newCaptionTextElements = [];
    localCaptionContainer.current = document.createElement("div");
    localCaptionContainer.current.classList.add("nekocap-cap-container");
    localCaptionContainer.current.style.cssText = localCaptionContainerStyle;

    try {
      captionContainerElement.insertBefore(
        localCaptionContainer.current,
        videoElement.nextSibling
      );
    } catch (e) {
      console.warn(
        "Could not insert caption container right after the video element. Defaulting to last child"
      );
      captionContainerElement.appendChild(localCaptionContainer.current);
    }

    const videoElementHeight = videoElement.offsetHeight;
    for (let trackId = 0; trackId < MAX_TRACKS; trackId++) {
      for (let i = 0; i < MAX_CONCURRENT_CAPTIONS; i++) {
        const captionContainer = document.createElement("div");
        captionContainer.style.cssText = captionWrapperElementStyle;
        captionContainer.classList.add("nekocap-caption");
        captionContainer.setAttribute("data-track", trackId.toString(10));
        captionContainer.style.bottom = `${
          DEFAULT_BOTTOM_OFFSET_FACTOR * videoElementHeight
        }px`;
        localCaptionContainer.current.appendChild(captionContainer);

        const captionTextElement = document.createElement("div");
        captionTextElement.classList.add("nekocap-caption-text");
        captionTextElement.style.cssText = captionTextElementStyle;

        captionContainer.appendChild(captionTextElement);
        newCaptionTextElements.push(captionTextElement);
        newCaptionElements.push(captionContainer);
      }
    }

    captionWrapperElements.current = newCaptionElements;
    captionTextElements.current = newCaptionTextElements;

    return () => {
      if (!captionContainerElement) {
        return;
      }
      captionWrapperElements.current.forEach((element) => {
        element.remove();
      });
      captionWrapperElements.current = [];
      localCaptionContainer.current.remove();
      localCaptionContainer.current = undefined;
    };
  }, [captionContainerElement, videoElement]);

  // Register video listener
  useEffect(() => {
    if (!videoElement) {
      return;
    }
    videoElement.addEventListener("play", handleVideoPlay);
    videoElement.addEventListener("seeked", handleVideoSeeked);
    currentCaptionIds.current = Array(caption?.data?.tracks?.length || 0).fill(
      0
    );

    // Update the caption container's width and height to match the video to prevent subs from going into the black bars
    if (localCaptionContainer.current) {
      containerDimensions.current = {
        width: videoElement.offsetWidth,
        height: videoElement.offsetHeight,
      };
      localCaptionContainer.current.style.width = `${containerDimensions.current.width}px`;
      localCaptionContainer.current.style.height = `${containerDimensions.current.height}px`;
    }

    return () => {
      if (!videoElement) {
        return;
      }
      videoElement.removeEventListener("play", handleVideoPlay);
      videoElement.removeEventListener("seeked", handleVideoSeeked);
    };
  }, [videoElement, caption]);

  const updateRenderedCaption = (
    currentTextElement: HTMLElement,
    captionContainerElement: HTMLElement,
    currentCaption: NekoCaption,
    currentCaptionId: number,
    captionData: CaptionDataContainer,
    trackSettings: TrackSettings
  ) => {
    // Set layout
    captionContainerElement.setAttribute(
      "data-caption",
      currentCaptionId.toString(10)
    );
    const activeLayout =
      currentCaption.layout ||
      trackSettings?.layout ||
      captionData.settings?.layout;
    const coordType: string = currentCaption.layout
      ? "caption"
      : trackSettings?.layout
      ? "track"
      : "global";
    if (activeLayout && activeLayout.alignment) {
      alignContainer(
        captionContainerElement,
        activeLayout.alignment,
        containerDimensions.current.height,
        activeLayout.position,
        coordType
      );
    } else {
      // Default alignment is bottom center
      alignContainer(
        captionContainerElement,
        CaptionAlignment.BottomCenter,
        containerDimensions.current.height,
        undefined,
        coordType
      );
    }
    // Set text styles
    currentTextElement.style.fontSize = `${
      DEFAULT_FONT_SIZE_FACTOR * containerDimensions.current.height
    }px`;
    const alignment = activeLayout?.alignment;
    switch (alignment) {
      case CaptionAlignment.BottomCenter:
      case CaptionAlignment.TopCenter:
      case CaptionAlignment.MiddleCenter:
        currentTextElement.style.textAlign = "center";
        break;
      case CaptionAlignment.BottomLeft:
      case CaptionAlignment.TopLeft:
      case CaptionAlignment.MiddleLeft:
        currentTextElement.style.textAlign = "left";
        break;
      case CaptionAlignment.BottomRight:
      case CaptionAlignment.TopRight:
      case CaptionAlignment.MiddleRight:
        currentTextElement.style.textAlign = "right";
        break;
      default:
    }
    currentTextElement.innerText = currentCaption.text;
  };

  const handleTimeUpdate = useCallback(
    (deltaTime?: number, forceUpdate?: boolean) => {
      if (!videoElement || !caption || !caption.data) {
        return;
      }
      const { currentTime } = videoElement;
      const currentTimeMs = currentTime * 1000;
      if (previousTime.current === currentTimeMs && !forceUpdate) {
        // No need to update when paused
        return;
      }
      previousTime.current = currentTimeMs;
      const { tracks } = caption.data;
      if (!tracks) {
        return;
      }
      /**
       * Update all of the maximum allowed number of tracks, even if the current captions don't have more
       * so that leftover captions in unused tracks will be cleared after changing the loaded caption
       */
      for (let trackIndex = 0; trackIndex < MAX_TRACKS; trackIndex++) {
        if (trackIndex >= tracks.length) {
          // Clear text of unused tracks
          for (
            let containerId = 0;
            containerId < MAX_CONCURRENT_CAPTIONS;
            containerId++
          ) {
            const currentTextElement =
              captionTextElements.current[
                trackIndex * MAX_CONCURRENT_CAPTIONS + containerId
              ];
            currentTextElement.innerText = "";
          }
          continue;
        }
        const track = tracks[trackIndex];
        if (!track) {
          continue;
        }

        const { cues: captions } = track;
        if (
          !captions ||
          currentCaptionIds.current[trackIndex] >= captions.length
        ) {
          continue;
        }

        let totalCaptionsSet = 0;
        // Go through the next few captions to display all concurrent captions (up to the maximum number)
        for (
          let i = Math.max(0, currentCaptionIds.current[trackIndex]);
          i < captions.length;
          i++
        ) {
          const currentCaption = captions[i];
          if (!currentCaption) {
            console.warn(`Caption ${i} is undefined!`);
            continue;
          }

          const wrapper =
            captionWrapperElements.current[
              trackIndex * MAX_CONCURRENT_CAPTIONS + totalCaptionsSet
            ];
          const currentTextElement =
            captionTextElements.current[
              trackIndex * MAX_CONCURRENT_CAPTIONS + totalCaptionsSet
            ];
          if (
            currentTimeMs >= currentCaption.start &&
            currentTimeMs <= currentCaption.end &&
            totalCaptionsSet < MAX_CONCURRENT_CAPTIONS
          ) {
            updateRenderedCaption(
              currentTextElement,
              wrapper,
              currentCaption,
              i,
              caption.data,
              track.settings
            );
            totalCaptionsSet++;
          } else if (currentTimeMs > currentCaption.end) {
            currentCaptionIds.current[trackIndex]++;
          }
        }
        // Clear all the captions that were not set
        for (
          let unsetCaptionId = totalCaptionsSet;
          unsetCaptionId < MAX_CONCURRENT_CAPTIONS;
          unsetCaptionId++
        ) {
          const textElement =
            captionTextElements.current[
              trackIndex * MAX_CONCURRENT_CAPTIONS + unsetCaptionId
            ];
          textElement.innerText = "";
        }
      }
    },
    [videoElement, caption]
  );

  useResize(videoElement, updateCaptionContainerStyles, 0, [
    videoElement,
    handleTimeUpdate,
  ]);

  useAnimationFrame(handleTimeUpdate, [videoElement, caption]);

  // Effect to force rerendering of the caption when the caption data is changed
  useEffect(() => {
    handleTimeUpdate(0, true);
  }, [caption]);

  // Update display
  useEffect(() => {
    captionWrapperElements.current.forEach((captionElement) => {
      captionElement.style.visibility = showCaption ? "visible" : "hidden";
    });
  }, [showCaption]);

  const resetCurrentCaption = () => {
    if (!videoElement || !caption) {
      return;
    }
    const { currentTime } = videoElement;
    const { data } = caption;
    const currentTimeMs = currentTime * 1000;
    data.tracks.forEach((track, trackIndex) => {
      const captionId = findClosestCaption(track.cues, currentTimeMs);
      currentCaptionIds.current[trackIndex] = captionId;
    });
    handleTimeUpdate(0, true);
  };

  const handleVideoPlay = (event) => {
    if (!videoElement || !caption) {
      return;
    }
    resetCurrentCaption();
  };

  const handleVideoSeeked = (event) => {
    if (!videoElement) {
      return;
    }
    resetCurrentCaption();
  };

  return <></>;
};

export const CaptionRenderer = React.memo(
  CaptionRendererInternal,
  (prevProps, nextProps) => {
    return (
      prevProps.videoElement === nextProps.videoElement &&
      prevProps.captionContainerElement === nextProps.captionContainerElement &&
      prevProps.showCaption === nextProps.showCaption &&
      isEqual(prevProps.caption, nextProps.caption)
    );
  }
);
