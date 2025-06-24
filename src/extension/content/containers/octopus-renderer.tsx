/* eslint-disable react/display-name */
import { isInExtension } from "@/common/client-utils";
import type { IFrameProps } from "@/common/feature/video/types";
import { useCanUseWorker } from "@/common/hooks/use-can-use-worker";
import { type Dimension } from "@/common/types";
import { createElementRemovalObserver, getURL } from "@/common/utils";
import { useAnimationFrame } from "@/hooks";
import { isEqual } from "lodash-es";
import * as React from "react";
import {
  forwardRef,
  MutableRefObject,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { createGlobalStyle } from "styled-components";
import * as SubtitlesOctopus from "../../../libs/subtitle-octopus/subtitles-octopus";
import { VideoPlayer } from "../feature/editor/video-player/video-player";
import { CaptionRendererHandle } from "./caption-renderer";
import { OctopusRendererIframeProxy } from "./octopus-renderer-iframe-proxy";

export interface OctopusRendererProps {
  rawCaption?: string;
  captionContainerElement?: HTMLElement;
  videoPlayer?: VideoPlayer;
  showCaption: boolean;
  isIframe?: boolean;
  iframeProps?: IFrameProps;
  useExactCanvasDimensions?: boolean;
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

export const createCanvas = (
  dimension: Dimension,
  captionContainerElement: HTMLElement,
): [HTMLCanvasElement | undefined, HTMLDivElement | undefined] => {
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

const OctopusRendererInternal = React.forwardRef(
  (
    props: OctopusRendererProps,
    ref: MutableRefObject<CaptionRendererHandle>,
  ) => {
    const canUseWorker = useCanUseWorker();
    const inExtension = isInExtension();

    return (
      <>
        {!inExtension && <WebViewerStyle />}
        {canUseWorker && (
          <OctopusRendererDirect ref={ref} {...props}></OctopusRendererDirect>
        )}
        {canUseWorker === false && (
          <OctopusRendererIframeProxy ref={ref} {...props} />
        )}
      </>
    );
  },
);

const OctopusRendererDirect = forwardRef(
  (
    {
      rawCaption,
      videoPlayer,
      showCaption,
      captionContainerElement,
      isIframe = false,
      useExactCanvasDimensions = false,
      iframeProps,
      fontList,
      onFontsLoaded,
    }: OctopusRendererProps,
    ref: MutableRefObject<CaptionRendererHandle>,
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
        `.${CANVAS_PARENT_CLASS_NAME}`,
      ) as HTMLElement;
      if (canvas) {
        canvas.style.visibility = showCaption ? "visible" : "hidden";
      }
    }, [showCaption]);

    // This is needed for sites where the renderer can get removed from the DOM
    useEffect(() => {
      if (
        !isInExtension() ||
        !globalThis.selectedProcessor?.observer ||
        !globalThis.selectedProcessor.observer.shouldObserveMenuPlaceability
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
        },
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

    const handleVideoPlay = useCallback(() => {
      if (octopusInstance.current) {
        octopusInstance.current.setIsPaused(
          false,
          iframeProps?.getCurrentTime(),
        );
      }
    }, [iframeProps]);

    const handleVideoPause = useCallback(() => {
      if (octopusInstance.current) {
        octopusInstance.current.setIsPaused(
          true,
          iframeProps?.getCurrentTime(),
        );
      }
    }, [iframeProps]);

    const handleVideoSeek = useCallback(() => {
      // do nothing
    }, []);

    useImperativeHandle<CaptionRendererHandle, CaptionRendererHandle>(
      ref,
      () => {
        return {
          onVideoPlay: handleVideoPlay,
          onVideoPause: handleVideoPause,
          onVideoSeeked: handleVideoSeek,
        };
      },
    );

    const fontListNames = Object.keys(fontList).join(",");

    // Register video listener
    useEffect(() => {
      const onReady = () => {
        /**
         * This is a workaround to prevent the ASS from rendering at a low framerate when an ASS caption is loaded.
         * The renderer keeps track of the play/pause state and renders at different rates
         * Setting the time of the video also works as a workaround.
         * (Reason: https://github.com/libass/JavascriptSubtitlesOctopus/issues/72#issuecomment-1001432683)
         */
        if (videoPlayer && !videoPlayer.paused()) {
          videoPlayer.pause();
          videoPlayer.play();
        }
        if (!videoPlayer?.element()) {
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
          `.${CANVAS_PARENT_CLASS_NAME}`,
        );
        if (canvasParentElement) {
          canvasParentElement.remove();
        }
      };

      let canvas: HTMLCanvasElement | undefined;
      if (isIframe && iframeProps && captionContainerElement) {
        const width: number = useExactCanvasDimensions
          ? iframeProps.width
          : globalThis.screen.width * globalThis.devicePixelRatio;
        const height: number = useExactCanvasDimensions
          ? iframeProps.height
          : width * (iframeProps.height / iframeProps.width);
        const canvasElements = createCanvas(
          { width: width, height: height },
          captionContainerElement,
        );
        canvas = canvasElements[0];
      }
      if (!videoPlayer?.element() && !canvas) {
        return cleanup;
      }
      const fallbackFontUrl = new URL(
        "/fonts/Open-Sans-Regular.woff2",
        process.env.NEXT_PUBLIC_FONTS_URL,
      ).href;

      const options = {
        video: isIframe ? undefined : videoPlayer?.element(),
        canvas: isIframe ? canvas : undefined,
        subContent: rawCaption,
        availableFonts: fontList,
        workerUrl: getURL("js/subtitle-octopus/subtitles-octopus-worker.js"),
        legacyWorkerUrl: getURL(
          "js/subtitle-octopus/subtitles-octopus-worker-legacy.js",
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
          : videoPlayer?.currentTime(),
      );
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

      return cleanup;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      videoPlayer,
      captionContainerElement,
      rawCaption,
      isIframe,
      iframeProps,
      onFontsLoaded,
      // Font list names will be used to track font list changes instead as fontList will trigger rerenders
      fontListNames,
      handleFontsLoaded,
      handleVideoPause,
      handleVideoPlay,
    ]);

    const handleTimeUpdate = useCallback(() => {
      if (!isIframe || !octopusInstance || !octopusInstance.current) {
        return;
      }
      const currentTime = iframeProps?.getCurrentTime();
      octopusInstance.current.setCurrentTime(currentTime);
    }, [isIframe, iframeProps]);

    useAnimationFrame(4, handleTimeUpdate, [
      videoPlayer,
      rawCaption,
      isIframe,
      iframeProps,
    ]);
    const inExtension = isInExtension();

    return <>{!inExtension && <WebViewerStyle />}</>;
  },
);

export const OctopusRenderer = React.memo(
  OctopusRendererInternal,
  (prevProps, nextProps) => {
    return (
      prevProps.videoPlayer === nextProps.videoPlayer &&
      prevProps.captionContainerElement === nextProps.captionContainerElement &&
      prevProps.showCaption === nextProps.showCaption &&
      prevProps.isIframe === nextProps.isIframe &&
      prevProps.useExactCanvasDimensions ===
        nextProps.useExactCanvasDimensions &&
      isEqual(prevProps.fontList, nextProps.fontList) &&
      isEqual(prevProps.rawCaption, nextProps.rawCaption) &&
      isEqual(prevProps.iframeProps, nextProps.iframeProps)
    );
  },
);
