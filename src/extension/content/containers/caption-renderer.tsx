import {
  CaptionAlignment,
  CaptionDataContainer,
  NekoCaption,
  TrackSettings,
} from "@/common/caption-parsers/types";
import { isInExtension } from "@/common/client-utils";
import {
  MAX_CONCURRENT_CAPTIONS,
  MAX_TRACKS,
} from "@/common/feature/video/constants";
import type {
  CaptionContainer,
  IFrameProps,
  VideoPlayerPreferences,
} from "@/common/feature/video/types";
import { findClosestCaption } from "@/common/feature/video/utils";
import { Coords, Dimension } from "@/common/types";
import {
  createElementAdditionObserver,
  createElementRemovalObserver,
} from "@/common/utils";
import { useAnimationFrame, useResize } from "@/hooks";
import { isEqual } from "lodash-es";
import * as React from "react";
import {
  MutableRefObject,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { VideoPlayer } from "../feature/editor/video-player/video-player";
import { refreshVideoMeta } from "../utils";
import { createGlobalStyle } from "styled-components";
import { usePurifier } from "../feature/editor/hooks/use-purifier";
interface CaptionRendererProps {
  caption?: CaptionContainer;
  captionContainerElement?: HTMLElement;
  videoPlayer?: VideoPlayer;
  isIframe?: boolean;
  iframeProps?: IFrameProps;
  showCaption: boolean;
  preferences?: VideoPlayerPreferences;
}
export interface CaptionRendererHandle {
  onVideoPlay: () => void;
  onVideoSeeked: () => void;
  onVideoPause: () => void;
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

const localCaptionContainerStyle = `
position: absolute;
top: 0;
left: 50%;
transform: translate(-50%, 0);
height: 100%;
pointer-events: none;
font-family: apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
`;

const DEFAULT_BOTTOM_OFFSET_FACTOR = 0.074074; // How many pixels to offset the caption from the bottom of the video (a factor of the video height)
const DEFAULT_TOP_OFFSET_FACTOR = 0.0333333; // How many pixels to offset the caption from the top of the video (a factor of the video height)
const DEFAULT_FONT_SIZE_FACTOR = 43 / 1080; // Factor of font size based on the width of the video

export const SAFE_STYLE_RE =
  /^color:\s*#([A-Fa-f0-9]{8}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{4}|[A-Fa-f0-9]{3})$/i;

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
  coords?: Coords,
  coordType = "none",
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
    JSON.stringify({ left: leftValue, top: topValue }),
  );
  container.setAttribute("data-layout-type", coordType);
};

/* eslint-disable react/display-name */
const TAG = "caption-renderer";

const CaptionRendererInternal = React.forwardRef(
  (
    {
      caption,
      videoPlayer,
      captionContainerElement,
      showCaption,
      isIframe = false,
      iframeProps,
      preferences = {
        fontSizeMultiplier: 1,
      },
    }: CaptionRendererProps,
    ref: MutableRefObject<CaptionRendererHandle>,
  ) => {
    const currentCaptionIds = useRef<number[]>([]);
    const captionWrapperElements = useRef<HTMLElement[]>();
    const captionTextElements = useRef<HTMLElement[]>();
    /**
     * We'll create our own container element to prevent modifying the original page too much
     */
    const localCaptionContainer = useRef<HTMLElement>();
    const containerDimensions = useRef<Dimension>({
      width: 0,
      height: 0,
    });
    const previousTime = useRef<number>(-1);
    const [recreateLocalCaptionContainer, setRecreateLocalCaptionContainer] =
      useState<boolean>(false);
    const purifier = usePurifier();

    const updateRenderedCaption = useCallback(
      (
        currentTextElement: HTMLElement,
        captionContainerElement: HTMLElement,
        currentCaption: NekoCaption,
        currentCaptionId: number,
        captionData: CaptionDataContainer,
        trackSettings: TrackSettings,
      ) => {
        // Set layout
        captionContainerElement.setAttribute(
          "data-caption",
          currentCaptionId.toString(10),
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
            activeLayout.position,
            coordType,
          );
        } else {
          // Default alignment is bottom center
          alignContainer(
            captionContainerElement,
            CaptionAlignment.BottomCenter,
            undefined,
            coordType,
          );
        }
        // Set text styles
        const containerMinSideLength = Math.min(
          containerDimensions.current.width,
          containerDimensions.current.height,
        );
        currentTextElement.style.fontSize = `${
          DEFAULT_FONT_SIZE_FACTOR *
          preferences.fontSizeMultiplier *
          containerMinSideLength
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

        let rawText = currentCaption.text || "";

        // Extract <nr background-color="..."> wrapper before sanitization
        let cueBackgroundColor = "";
        const nrParser = new DOMParser();
        const nrDoc = nrParser.parseFromString(rawText, "text/html");
        const nrElement = nrDoc.body.querySelector("nr");
        if (nrElement) {
          const bgAttr = nrElement.getAttribute("background-color") || "";
          // Validate hex color format
          if (
            /^#([A-Fa-f0-9]{8}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{4}|[A-Fa-f0-9]{3})$/i.test(
              bgAttr,
            )
          ) {
            cueBackgroundColor = bgAttr;
          }
          // Unwrap: replace <nr> with its children
          nrElement.replaceWith(...Array.from(nrElement.childNodes));
          rawText = nrDoc.body.innerHTML;
        }

        rawText = rawText.replace(/\n/g, "<br>");

        // Apply background-color to the caption text element
        if (cueBackgroundColor) {
          currentTextElement.style.backgroundColor = cueBackgroundColor;
        } else {
          // Reset to default
          currentTextElement.style.backgroundColor = "rgb(37 37 37 / 90%)";
        }

        currentTextElement.innerHTML = purifier?.sanitize(rawText, {
          RETURN_TRUSTED_TYPE: true,
          ALLOWED_TAGS: ["b", "i", "u", "ruby", "rt", "lang", "br", "nc"],
          ALLOWED_ATTR: ["lang", "style"],
        }) as unknown as string;
      },
      [preferences.fontSizeMultiplier, purifier],
    );

    const handleTimeUpdate = useCallback(
      (deltaTime?: number, forceUpdate?: boolean) => {
        if (!caption || !caption.data) {
          return;
        }
        let currentTime = 0;
        if (isIframe && iframeProps && iframeProps.getCurrentTime) {
          currentTime = iframeProps.getCurrentTime();
        } else if (videoPlayer) {
          currentTime = videoPlayer.currentTime();
        }
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
                captionTextElements.current?.[
                  trackIndex * MAX_CONCURRENT_CAPTIONS + containerId
                ];
              if (currentTextElement) {
                currentTextElement.innerHTML = "";
              }
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
            if (currentCaption.end < currentCaption.start) {
              // Invalid caption. This can happen for some captions imported from 3rd party services
              continue;
            }

            const wrapper =
              captionWrapperElements.current?.[
                trackIndex * MAX_CONCURRENT_CAPTIONS + totalCaptionsSet
              ];
            const currentTextElement =
              captionTextElements.current?.[
                trackIndex * MAX_CONCURRENT_CAPTIONS + totalCaptionsSet
              ];
            if (
              currentTimeMs >= currentCaption.start &&
              currentTimeMs <= currentCaption.end &&
              totalCaptionsSet < MAX_CONCURRENT_CAPTIONS &&
              currentTextElement &&
              wrapper
            ) {
              updateRenderedCaption(
                currentTextElement,
                wrapper,
                currentCaption,
                i,
                caption.data,
                track.settings || {},
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
              captionTextElements.current?.[
                trackIndex * MAX_CONCURRENT_CAPTIONS + unsetCaptionId
              ];
            if (textElement) {
              textElement.innerHTML = "";
            }
          }
        }
      },
      [caption, videoPlayer, isIframe, iframeProps, updateRenderedCaption],
    );

    const updateCaptionContainerStyles = useCallback(
      (width: number, height: number) => {
        if (!localCaptionContainer.current || !videoPlayer) {
          return;
        }
        containerDimensions.current = {
          width: videoPlayer.element()?.offsetWidth || 0,
          height: videoPlayer.element()?.offsetHeight || 0,
        };
        localCaptionContainer.current.style.width = `${width}px`;
        localCaptionContainer.current.style.height = `${height}px`;
        handleTimeUpdate(0, true);
      },
      [handleTimeUpdate, videoPlayer],
    );

    // Sites like Netflix will remove the caption container. This helps us recreate it
    useEffect(() => {
      if (
        !isInExtension() ||
        !globalThis.selectedProcessor?.observer ||
        !globalThis.selectedProcessor.observer.shouldObserveMenuPlaceability
      ) {
        return;
      }
      let recreateContainer = false;
      const removalObserver = createElementRemovalObserver(
        ".nekocap-cap-container",
        () => {
          recreateContainer = true;
          setRecreateLocalCaptionContainer(false);
        },
      );
      const videoSelector =
        typeof globalThis.selectedProcessor.videoSelector == "string"
          ? globalThis.selectedProcessor.videoSelector
          : "video";
      const additionObserver = createElementAdditionObserver(
        videoSelector,
        async () => {
          if (recreateContainer) {
            await refreshVideoMeta();
            recreateContainer = false;
            setRecreateLocalCaptionContainer(true);
          }
        },
      );
      return () => {
        removalObserver.disconnect();
        additionObserver.disconnect();
      };
    }, []);

    // Create the caption element to render into
    useEffect(() => {
      if (!captionContainerElement) {
        return;
      }
      captionContainerElement.style.position = "relative";
      if (document.querySelector(".nekocap-cap-container")) {
        return;
      }

      const newCaptionElements: HTMLElement[] = [];
      const newCaptionTextElements: HTMLElement[] = [];
      localCaptionContainer.current = document.createElement("div");
      localCaptionContainer.current.classList.add("nekocap-cap-container");
      localCaptionContainer.current.style.cssText = localCaptionContainerStyle;

      try {
        captionContainerElement.insertBefore(
          localCaptionContainer.current,
          videoPlayer?.element()?.nextSibling || null,
        );
      } catch (e) {
        console.warn(
          "Could not insert caption container right after the video element. Defaulting to last child",
        );
        captionContainerElement.appendChild(localCaptionContainer.current);
      }

      const videoElementHeight =
        isIframe && iframeProps
          ? iframeProps.height
          : videoPlayer?.element()?.offsetHeight || 0;
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
          captionTextElement.setAttribute("dir", "auto");
          captionTextElement.classList.add("nekocap-caption-text");

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
        captionWrapperElements.current?.forEach((element) => {
          element.remove();
        });
        captionWrapperElements.current = [];
        localCaptionContainer.current?.remove();
        localCaptionContainer.current = undefined;
      };
    }, [
      captionContainerElement,
      videoPlayer,
      recreateLocalCaptionContainer,
      isIframe,
      iframeProps,
    ]);

    const resetCurrentCaption = useCallback(() => {
      if (!caption) {
        return;
      }
      let currentTime = 0;
      if (videoPlayer) {
        currentTime = videoPlayer.currentTime();
      } else if (isIframe && iframeProps && iframeProps.getCurrentTime) {
        currentTime = iframeProps.getCurrentTime();
      }
      const { data } = caption;
      const currentTimeMs = currentTime * 1000;
      data.tracks.forEach((track, trackIndex) => {
        const captionId = findClosestCaption(track.cues, currentTimeMs);
        currentCaptionIds.current[trackIndex] = captionId;
      });
      handleTimeUpdate(0, true);
    }, [caption, handleTimeUpdate, iframeProps, isIframe, videoPlayer]);

    const handleVideoPlay = useCallback(() => {
      if (!caption) {
        return;
      }
      resetCurrentCaption();
    }, [caption, resetCurrentCaption]);

    const handleVideoSeeked = useCallback(() => {
      resetCurrentCaption();
    }, [resetCurrentCaption]);

    // Register video listener
    useEffect(() => {
      if (videoPlayer) {
        videoPlayer.addPlayListener(TAG, handleVideoPlay);
        videoPlayer.addSeekListener(TAG, handleVideoSeeked);
      }

      currentCaptionIds.current = Array(
        caption?.data?.tracks?.length || 0,
      ).fill(0);

      // Update the caption container's width and height to match the video to prevent subs from going into the black bars
      if (localCaptionContainer.current) {
        containerDimensions.current = {
          width:
            isIframe && iframeProps
              ? iframeProps.width
              : videoPlayer?.element()?.offsetWidth || 0,
          height:
            isIframe && iframeProps
              ? iframeProps.height
              : videoPlayer?.element()?.offsetHeight || 0,
        };
        localCaptionContainer.current.style.width = `${containerDimensions.current.width}px`;
        localCaptionContainer.current.style.height = `${containerDimensions.current.height}px`;
      }

      return () => {
        if (!videoPlayer) {
          return;
        }
        videoPlayer.removePlayListener(TAG);
        videoPlayer.removeSeekListener(TAG);
      };
    }, [
      videoPlayer,
      caption,
      isIframe,
      iframeProps,
      handleVideoPlay,
      handleVideoSeeked,
    ]);

    useResize(videoPlayer?.element(), updateCaptionContainerStyles, 0, [
      videoPlayer?.element(),
      handleTimeUpdate,
      updateCaptionContainerStyles,
      isIframe,
      iframeProps,
    ]);

    useAnimationFrame(60, handleTimeUpdate, [
      videoPlayer,
      caption,
      isIframe,
      iframeProps,
      handleTimeUpdate,
    ]);

    useImperativeHandle<CaptionRendererHandle, CaptionRendererHandle>(
      ref,
      () => {
        return {
          onVideoPlay: handleVideoPlay,
          onVideoPause: handleVideoPause,
          onVideoSeeked: handleVideoSeeked,
        };
      },
    );

    // Effect to force rerendering of the caption when the caption data is changed
    useEffect(() => {
      handleTimeUpdate(0, true);
    }, [caption, handleTimeUpdate, preferences]);

    // Update display
    useEffect(() => {
      if (!localCaptionContainer.current) {
        return;
      }
      localCaptionContainer.current.style.visibility = showCaption
        ? "visible"
        : "hidden";
    }, [showCaption]);

    const handleVideoPause = () => {
      // do nothing
    };

    useImperativeHandle<CaptionRendererHandle, CaptionRendererHandle>(
      ref,
      () => {
        return {
          onVideoPlay: handleVideoPlay,
          onVideoPause: handleVideoPause,
          onVideoSeeked: handleVideoSeeked,
        };
      },
    );

    return (
      <>
        <GlobalStyle />
      </>
    );
  },
);

export const CaptionRenderer = React.memo(
  CaptionRendererInternal,
  (prevProps, nextProps) => {
    return (
      prevProps.videoPlayer === nextProps.videoPlayer &&
      prevProps.captionContainerElement === nextProps.captionContainerElement &&
      prevProps.showCaption === nextProps.showCaption &&
      prevProps.isIframe === nextProps.isIframe &&
      isEqual(prevProps.preferences, nextProps.preferences) &&
      isEqual(prevProps.caption, nextProps.caption) &&
      isEqual(prevProps.iframeProps, nextProps.iframeProps)
    );
  },
);

const GlobalStyle = createGlobalStyle<{ $additionalStyles?: string }>`
.nekocap-caption-text {
  position: relative;
  padding: 0.3em 10px;
  font-size: 33px;
  text-align: left;
  background-color: rgb(37 37 37 / 90%);
  border-radius: 0.4em;
  box-sizing: border-box;

  &:empty {
    padding: 0;
  }
}
`;
