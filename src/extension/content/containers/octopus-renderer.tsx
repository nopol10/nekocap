/* eslint-disable react/display-name */
import * as React from "react";
import {
  MutableRefObject,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { isEqual } from "lodash";
import * as SubtitlesOctopus from "../../../libs/subtitle-octopus/subtitles-octopus";
import type { Dimension } from "@/common/types";
import type { IFrameProps } from "@/common/feature/video/types";
import { useAnimationFrame } from "@/hooks";
import { createElementRemovalObserver } from "@/common/utils";
import { isInExtension } from "@/common/client-utils";
import { createGlobalStyle } from "styled-components";
import { CaptionRendererHandle } from "./caption-renderer";

interface OctopusRendererProps {
  rawCaption?: string;
  videoElement?: HTMLVideoElement;
  captionContainerElement: HTMLElement;
  showCaption: boolean;
  isIframe?: boolean;
  iframeProps?: IFrameProps;
  fontList: { [name: string]: string };
  onFontsLoaded?: (progress: number) => void;
}

const localCaptionContainerStyle = `
position: absolute;
left: 50%;
top: 50%;
transform: translate(-50%, -50%);
pointer-events: none;
`;

const CANVAS_CLASS_NAME = "libassjs-canvas";
const CANVAS_PARENT_CLASS_NAME = "libassjs-canvas-parent";

const WebViewerStyle = createGlobalStyle`
.${CANVAS_CLASS_NAME} {
  max-width: 100%;
  max-height: 100%;
}
  `;

const createCanvas = (
  dimension: Dimension,
  captionContainerElement: HTMLElement
): [HTMLCanvasElement, HTMLDivElement] => {
  if (!captionContainerElement) {
    return [undefined, undefined];
  }
  const canvas = document.createElement("canvas");
  canvas.className = CANVAS_CLASS_NAME;
  canvas.style.display = "none";
  canvas.style.cssText = localCaptionContainerStyle;
  canvas.width = dimension.width;
  canvas.height = dimension.height;

  const canvasParent = document.createElement("div");
  canvasParent.className = CANVAS_PARENT_CLASS_NAME;
  canvasParent.appendChild(canvas);
  captionContainerElement.prepend(canvasParent);
  return [canvas, canvasParent];
};

const getURL = (url: string) => {
  if (window.chrome && window.chrome.runtime && window.chrome.runtime.getURL) {
    return window.chrome.runtime.getURL(url);
  } else if (
    globalThis &&
    globalThis.browser &&
    globalThis.browser.runtime &&
    globalThis.browser.runtime.getURL
  ) {
    return globalThis.browser.runtime.getURL(url);
  }
  return "/" + url;
};

const OctopusRendererInternal = React.forwardRef(
  (
    {
      rawCaption,
      videoElement,
      showCaption,
      captionContainerElement,
      isIframe = false,
      iframeProps,
      fontList,
      onFontsLoaded,
    }: OctopusRendererProps,
    ref: MutableRefObject<CaptionRendererHandle>
  ) => {
    /**
     * We'll create our own container element to prevent modifying the original page too much
     */
    const localCaptionContainer = useRef<HTMLElement>();
    const octopusInstance = useRef<any>(undefined);
    const containerDimensions = useRef<Dimension>({
      width: 0,
      height: 0,
    });

    useEffect(() => {
      const canvas = document.querySelector(
        `.${CANVAS_PARENT_CLASS_NAME}`
      ) as HTMLElement;
      if (canvas) {
        canvas.style.visibility = showCaption ? "visible" : "hidden";
      }
    }, [showCaption]);

    // This is needed for sites where the renderer can get removed from the DOM
    useEffect(() => {
      if (
        !isInExtension() ||
        !window.selectedProcessor.observer ||
        !window.selectedProcessor.observer.shouldObserveMenuPlaceability
      ) {
        return;
      }
      const detector = createElementRemovalObserver(
        `.${CANVAS_PARENT_CLASS_NAME}`,
        () => {
          if (octopusInstance.current) {
            octopusInstance.current.dispose();
            octopusInstance.current = null;
          }
        }
      );
      return () => {
        detector.disconnect();
      };
    }, [octopusInstance]);

    // Progress range = [0, 1]
    const handleFontsLoaded = useCallback((progress: number) => {
      if (onFontsLoaded) {
        onFontsLoaded(progress);
      }
    }, []);

    const handleVideoPlay = () => {
      if (octopusInstance.current) {
        octopusInstance.current.setIsPaused(
          false,
          iframeProps.getCurrentTime()
        );
      }
    };

    const handleVideoPause = () => {
      if (octopusInstance.current) {
        octopusInstance.current.setIsPaused(true, iframeProps.getCurrentTime());
      }
    };

    const handleVideoSeek = () => {
      // do nothing
    };

    useImperativeHandle<CaptionRendererHandle, CaptionRendererHandle>(
      ref,
      () => {
        return {
          onVideoPlay: handleVideoPlay,
          onVideoPause: handleVideoPause,
          onVideoSeeked: handleVideoSeek,
        };
      }
    );

    // Register video listener
    useEffect(() => {
      const onReady = () => {
        /**
         * This is a workaround to prevent the ASS from rendering at a low framerate when an ASS caption is loaded.
         * The renderer keeps track of the play/pause state and renders at different rates
         * Setting the time of the video also works as a workaround.
         * (Reason: https://github.com/libass/JavascriptSubtitlesOctopus/issues/72#issuecomment-1001432683)
         */
        if (videoElement && !videoElement.paused) {
          videoElement.pause();
          videoElement.play();
        }
        if (!videoElement) {
          // Mainly for renderers without an associated video element
          // Sometimes the play event can be called before the renderer is ready.
          // This will ensure the renderer is set to the correct state to prevent the lag from occurring.
          handleVideoPause();
          handleVideoPlay();
        }
      };

      const cleanup = () => {
        if (octopusInstance.current) {
          octopusInstance.current.dispose();
        }
        const canvasElement = document.querySelector(`.${CANVAS_CLASS_NAME}`);
        if (canvasElement) {
          canvasElement.remove();
        }
        const canvasParentElement = document.querySelector(
          `.${CANVAS_PARENT_CLASS_NAME}`
        );
        if (canvasParentElement) {
          canvasParentElement.remove();
        }
      };

      let canvas: HTMLCanvasElement;
      if (isIframe) {
        const width: number = window.screen.width * window.devicePixelRatio;
        const height: number = width * (iframeProps.height / iframeProps.width);
        const canvasElements = createCanvas(
          { width: width, height: height },
          captionContainerElement
        );
        canvas = canvasElements[0];
      }
      if (!videoElement && !canvas) {
        return cleanup;
      }
      const fallbackFontUrl = new URL(
        "/fonts/Open-Sans-Regular.woff2",
        process.env.NEXT_PUBLIC_FONTS_URL
      ).href;

      const options = {
        video: videoElement,
        canvas: isIframe ? canvas : undefined,
        subContent: rawCaption,
        availableFonts: fontList,
        workerUrl: getURL("js/subtitle-octopus/subtitles-octopus-worker.js"),
        legacyWorkerUrl: getURL(
          "js/subtitle-octopus/subtitles-octopus-worker-legacy.js"
        ),
        fallbackFont: fallbackFontUrl,
        lossyRender: true,
        debug: true,
        onReady,
      };
      // @ts-ignore
      octopusInstance.current = new SubtitlesOctopus(options);
      octopusInstance.current.onFontsLoaded = handleFontsLoaded;
      octopusInstance.current.setCurrentTime(
        isIframe && iframeProps && iframeProps.getCurrentTime
          ? iframeProps.getCurrentTime()
          : videoElement.currentTime
      );
      // Update the caption container's width and height to match the video to prevent subs from going into the black bars
      if (localCaptionContainer.current) {
        containerDimensions.current = {
          width: isIframe ? iframeProps.width : videoElement.offsetWidth,
          height: isIframe ? iframeProps.height : videoElement.offsetHeight,
        };
        localCaptionContainer.current.style.width = `${containerDimensions.current.width}px`;
        localCaptionContainer.current.style.height = `${containerDimensions.current.height}px`;
      }

      return cleanup;
    }, [
      videoElement,
      captionContainerElement,
      rawCaption,
      isIframe,
      iframeProps,
      onFontsLoaded,
    ]);

    const handleTimeUpdate = useCallback(() => {
      if (!isIframe || !octopusInstance || !octopusInstance.current) {
        return;
      }
      const currentTime = iframeProps.getCurrentTime();
      octopusInstance.current.setCurrentTime(currentTime);
    }, [isIframe, iframeProps, octopusInstance]);

    useAnimationFrame(4, handleTimeUpdate, [
      videoElement,
      rawCaption,
      isIframe,
      iframeProps,
    ]);
    const inExtension = isInExtension();

    return <>{!inExtension && <WebViewerStyle />}</>;
  }
);

export const OctopusRenderer = React.memo(
  OctopusRendererInternal,
  (prevProps, nextProps) => {
    return (
      prevProps.videoElement === nextProps.videoElement &&
      prevProps.captionContainerElement === nextProps.captionContainerElement &&
      prevProps.showCaption === nextProps.showCaption &&
      prevProps.isIframe === nextProps.isIframe &&
      isEqual(prevProps.fontList, nextProps.fontList) &&
      isEqual(prevProps.rawCaption, nextProps.rawCaption) &&
      isEqual(prevProps.iframeProps, nextProps.iframeProps)
    );
  }
);
