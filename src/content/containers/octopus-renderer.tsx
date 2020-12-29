import * as React from "react";
import { useEffect, useRef } from "react";
import { isEqual } from "lodash";
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
    const onReady = () => {
      /**
       * This is a workaround to prevent the ASS from rendering at a low framerate when an ASS caption is loaded.
       * For some as yet unknown reason pausing and playing stops the lag from happening.
       * Setting the time of the video also works as a workaround.
       */
      if (!videoElement.paused) {
        videoElement.pause();
        videoElement.play();
      }
    };
    const options = {
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
      onReady,
    };
    octopusInstance.current = new SubtitlesOctopus(options);
    octopusInstance.current.setCurrentTime(videoElement.currentTime);
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
