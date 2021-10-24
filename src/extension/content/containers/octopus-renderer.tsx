import * as React from "react";
import { useCallback, useEffect, useRef } from "react";
import { isEqual } from "lodash";
import * as SubtitlesOctopus from "../../../libs/subtitle-octopus/subtitles-octopus";
import { SUBSTATION_FONT_LIST } from "@/common/substation-fonts";
import type { Dimension } from "@/common/types";
import type { IFrameProps } from "@/common/feature/video/types";
import { useAnimationFrame } from "@/hooks";
import { createElementRemovalDetector } from "@/common/utils";

interface OctopusRendererProps {
  rawCaption?: string;
  videoElement?: HTMLVideoElement;
  captionContainerElement: HTMLElement;
  showCaption: boolean;
  isIframe?: boolean;
  iframeProps?: IFrameProps;
}

const localCaptionContainerStyle = `
position: absolute;
left: 50%;
transform: translate(-50%, 0);
pointer-events: none;
`;

const createCanvas = (
  dimension: Dimension,
  captionContainerElement: HTMLElement
): [HTMLCanvasElement, HTMLDivElement] => {
  if (!captionContainerElement) {
    return [undefined, undefined];
  }
  const canvas = document.createElement("canvas");
  canvas.className = "libassjs-canvas";
  canvas.style.display = "none";
  canvas.style.cssText = localCaptionContainerStyle;
  canvas.width = dimension.width;
  canvas.height = dimension.height;

  const canvasParent = document.createElement("div");
  canvasParent.className = "libassjs-canvas-parent";
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

const OctopusRendererInternal = ({
  rawCaption,
  videoElement,
  showCaption,
  captionContainerElement,
  isIframe = false,
  iframeProps,
}: OctopusRendererProps) => {
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
      ".libassjs-canvas-parent"
    ) as HTMLElement;
    if (canvas) {
      canvas.style.visibility = showCaption ? "visible" : "hidden";
    }
  }, [showCaption]);

  // This is needed for sites where the renderer can get removed from the DOM
  useEffect(() => {
    createElementRemovalDetector(".libassjs-canvas-parent", () => {
      if (octopusInstance.current) {
        octopusInstance.current.dispose();
        octopusInstance.current = null;
      }
    });
  }, [octopusInstance]);

  // Register video listener
  useEffect(() => {
    const onReady = () => {
      /**
       * This is a workaround to prevent the ASS from rendering at a low framerate when an ASS caption is loaded.
       * For some as yet unknown reason pausing and playing stops the lag from happening.
       * Setting the time of the video also works as a workaround.
       */
      if (videoElement && !videoElement.paused) {
        videoElement.pause();
        videoElement.play();
      }
    };

    let canvas: HTMLCanvasElement;
    let canvasParent: HTMLDivElement;
    if (isIframe) {
      [canvas, canvasParent] = createCanvas(
        { width: iframeProps.width, height: iframeProps.height },
        captionContainerElement
      );
    }
    if (!videoElement && !canvas) {
      return;
    }

    const options = {
      video: videoElement,
      canvas: isIframe ? canvas : undefined,
      subContent: rawCaption,
      availableFonts: SUBSTATION_FONT_LIST,
      workerUrl: getURL("js/subtitle-octopus/subtitles-octopus-worker.js"),
      legacyWorkerUrl: getURL(
        "js/subtitle-octopus/subtitles-octopus-worker-legacy.js"
      ),
      lossyRender: true,
      debug: true,
      onReady,
    };
    // @ts-ignore
    octopusInstance.current = new SubtitlesOctopus(options);
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

    return () => {
      if (canvasParent) {
        canvasParent.remove();
      }
      if (octopusInstance.current) {
        octopusInstance.current.dispose();
      }
    };
  }, [
    videoElement,
    captionContainerElement,
    rawCaption,
    isIframe,
    iframeProps,
  ]);

  const handleTimeUpdate = useCallback(() => {
    if (!isIframe || !octopusInstance || !octopusInstance.current) {
      return;
    }
    const currentTime = iframeProps.getCurrentTime();
    octopusInstance.current.setCurrentTime(currentTime);
  }, [isIframe, iframeProps, octopusInstance]);

  useAnimationFrame(handleTimeUpdate, [
    videoElement,
    rawCaption,
    isIframe,
    iframeProps,
  ]);

  return <></>;
};

export const OctopusRenderer = React.memo(
  OctopusRendererInternal,
  (prevProps, nextProps) => {
    return (
      prevProps.videoElement === nextProps.videoElement &&
      prevProps.captionContainerElement === nextProps.captionContainerElement &&
      prevProps.showCaption === nextProps.showCaption &&
      prevProps.isIframe === nextProps.isIframe &&
      isEqual(prevProps.rawCaption, nextProps.rawCaption) &&
      isEqual(prevProps.iframeProps, nextProps.iframeProps)
    );
  }
);
