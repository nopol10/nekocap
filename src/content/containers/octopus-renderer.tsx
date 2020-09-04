import * as React from "react";
import { useCallback, useEffect, useRef } from "react";
import { isEqual } from "lodash";
import { useResize } from "@/hooks";
import * as SubtitlesOctopus from "../../libs/subtitle-octopus/subtitles-octopus";
import { SUBSTATION_FONT_LIST } from "@/common/substation-fonts";

interface OctopusRendererProps {
  rawCaption?: string;
  videoElement: HTMLVideoElement;
  captionContainerElement: HTMLElement;
  showCaption: boolean;
}

const OctopusRendererInternal = ({
  rawCaption,
  videoElement,
  captionContainerElement,
  showCaption,
}: OctopusRendererProps) => {
  /**
   * We'll create our own container element to prevent modifying the original page too much
   */
  const localCaptionContainer = useRef<HTMLElement>();
  const octopusInstance = useRef<any>(undefined);
  const containerDimensions = useRef<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const previousTime = useRef<number>(-1);

  const updateCaptionContainer = (width: number, height: number) => {
    if (!localCaptionContainer.current) {
      return;
    }
    containerDimensions.current = {
      width: videoElement.offsetWidth,
      height: videoElement.offsetHeight,
    };
    localCaptionContainer.current.style.width = `${width}px`;
    localCaptionContainer.current.style.height = `${height}px`;
  };

  // Create the caption element to render into
  useEffect(() => {
    if (!captionContainerElement) {
      return;
    }

    return () => {};
  }, [captionContainerElement]);

  useEffect(() => {
    const canvas = document.querySelector(
      ".libassjs-canvas-parent"
    ) as HTMLElement;
    if (canvas) {
      canvas.style.visibility = showCaption ? "visible" : "hidden";
    }
  }, [showCaption]);

  // Register video listener
  useEffect(() => {
    if (!videoElement) {
      return;
    }
    var options = {
      video: videoElement,
      subContent: rawCaption,
      availableFonts: SUBSTATION_FONT_LIST,
      workerUrl: chrome.runtime.getURL(
        "js/subtitle-octopus/subtitles-octopus-worker.js"
      ),
      legacyWorkerUrl: chrome.runtime.getURL(
        "js/subtitle-octopus/subtitles-octopus-worker-legacy.js"
      ),
      lossyRender: true,
      debug: true,
    };
    octopusInstance.current = new SubtitlesOctopus(options);
    octopusInstance.current.setCurrentTime(videoElement.duration);
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
      if (octopusInstance.current) {
        octopusInstance.current.dispose();
      }
    };
  }, [videoElement, rawCaption]);

  const handleTimeUpdate = useCallback(
    (deltaTime?: number, forceUpdate?: boolean) => {},
    [videoElement, rawCaption]
  );

  useResize(videoElement, updateCaptionContainer, 0, [
    videoElement,
    handleTimeUpdate,
  ]);

  // Effect to force rerendering of the caption when the caption data is changed
  useEffect(() => {
    handleTimeUpdate(0, true);
  }, [rawCaption]);

  return <></>;
};

export const OctopusRenderer = React.memo(
  OctopusRendererInternal,
  (prevProps, nextProps) => {
    return (
      prevProps.videoElement === nextProps.videoElement &&
      prevProps.captionContainerElement === nextProps.captionContainerElement &&
      prevProps.showCaption === nextProps.showCaption &&
      isEqual(prevProps.rawCaption, nextProps.rawCaption)
    );
  }
);
