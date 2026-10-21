/* eslint-disable react/display-name */
import {
  CanvasIframeToParentMessage,
  CanvasIframeToParentMessageType,
  ParentToCanvasIframeMessageType,
} from "@/common/types";
import { useAnimationFrame } from "@/hooks";
import {
  forwardRef,
  MutableRefObject,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { CaptionRendererHandle } from "./caption-renderer";
import { OctopusRendererProps } from "./octopus-renderer";
import {
  getVideoContentRect,
  observeVideoLayout,
  VideoContentRect,
} from "../video-layout";

/**
 * This is responsible for creating the content page iframe and posting video and caption related properties to the iframe.
 * It does not render the caption itself.
 * The actual octopus renderer in the iframe will render the caption.
 * This is to get round not being able to spawn a worker in the content script due to CSP.
 */
export const OctopusRendererIframeProxy = forwardRef(
  (
    {
      isIframe,
      iframeProps,
      videoPlayer,
      captionContainerElement,
      rawCaption,
      onFontsLoaded,
      showCaption,
    }: OctopusRendererProps,
    ref: MutableRefObject<CaptionRendererHandle>,
  ) => {
    const iframeRef = useRef<HTMLIFrameElement>();
    const handleTimeUpdate = useCallback(() => {
      if (!iframeRef.current) {
        return;
      }
      let currentTime = 0;
      if (!isIframe && videoPlayer) {
        currentTime = videoPlayer.currentTime();
      } else if (isIframe && iframeProps) {
        currentTime = iframeProps.getCurrentTime();
      }
      iframeRef.current.contentWindow?.postMessage(
        {
          type: ParentToCanvasIframeMessageType.UpdateVideoTime,
          timeSeconds: currentTime,
        },
        "*",
      );
    }, [isIframe, videoPlayer, iframeProps]);
    useEffect(() => {
      if (!videoPlayer || !ref.current) {
        return;
      }
      const renderer = ref.current;
      const TAG = "orip";
      videoPlayer.addPlayListener(TAG, renderer.onVideoPlay);
      videoPlayer.addPauseListener(TAG, renderer.onVideoPause);
      videoPlayer.addTimeUpdateListener(TAG, renderer.onVideoSeeked);
      return () => {
        videoPlayer.removePlayListener(TAG);
        videoPlayer.removePauseListener(TAG);
        videoPlayer.removeTimeUpdateListener(TAG);
      };
    }, [ref, videoPlayer]);

    useEffect(() => {
      if (!iframeRef.current) {
        return;
      }
      iframeRef.current.style.visibility = showCaption ? "visible" : "hidden";
    }, [showCaption]);

    useAnimationFrame(4, handleTimeUpdate, [
      videoPlayer,
      rawCaption,
      isIframe,
      iframeProps,
    ]);
    useEffect(
      function spawnIframeAndListen() {
        if (!captionContainerElement) {
          console.error("Caption container element is not provided");
          return;
        }
        const videoElement = videoPlayer?.element();
        const [iframe, iframeContainer] = createContentPageCanvasIframe();
        captionContainerElement.appendChild(iframeContainer);
        iframeRef.current = iframe;
        iframe.style.width = "100%";
        iframe.style.height = "100%";

        const getVideoRect = () => {
          if (!videoElement) {
            return undefined;
          }
          return getVideoContentRect(
            videoElement,
            iframeContainer.offsetParent || captionContainerElement,
          );
        };
        const getVideoAspect = (): number => {
          if (isIframe && iframeProps && iframeProps.width > 0) {
            return iframeProps.width / (iframeProps.height || 1);
          }
          const rect = getVideoRect();
          if (rect) {
            return rect.width / rect.height;
          }
          if (
            videoElement instanceof HTMLVideoElement &&
            videoElement.videoWidth > 0 &&
            videoElement.videoHeight > 0
          ) {
            return videoElement.videoWidth / videoElement.videoHeight;
          }
          return 16 / 9;
        };

        let isIframeReady = false;
        let sentAspect = 0;
        const sendVideoProperties = () => {
          sentAspect = getVideoAspect();
          // Render at the screen's resolution so that the caption stays sharp in fullscreen.
          // The canvas is scaled down to the size of the video by CSS.
          const width = globalThis.screen.width * globalThis.devicePixelRatio;
          iframe.contentWindow?.postMessage(
            {
              type: ParentToCanvasIframeMessageType.UpdateContentIframeVideoProperties,
              width,
              height: width / sentAspect,
              rawCaption,
            },
            "*",
          );
        };

        // Keep the iframe on top of the video as its size and position changes,
        // e.g. when entering fullscreen or switching to YouTube's cinema mode
        const updateLayout = () => {
          const rect = getVideoRect();
          if (!rect) {
            return;
          }
          setIframeContainerLayout(iframeContainer, rect);
          const aspect = rect.width / rect.height;
          if (
            isIframeReady &&
            !isIframe &&
            Math.abs(aspect - sentAspect) / sentAspect > 0.01
          ) {
            // The canvas has to be recreated with the new aspect ratio, otherwise the caption will be stretched
            sendVideoProperties();
          }
        };
        updateLayout();
        const stopObservingLayout = videoElement
          ? observeVideoLayout(videoElement, updateLayout)
          : undefined;

        function onIframeMessage(
          event: MessageEvent<CanvasIframeToParentMessage>,
        ) {
          if (event.source !== iframe.contentWindow) {
            return;
          }
          if (event.data.type === CanvasIframeToParentMessageType.Ready) {
            // This can be called again when the iframe reloads after being moved in the DOM
            console.log("Canvas iframe listener is ready");
            isIframeReady = true;
            sendVideoProperties();
            updateLayout();
          } else if (
            event.data.type === CanvasIframeToParentMessageType.FontLoadProgress
          ) {
            onFontsLoaded?.(event.data.progress);
          }
        }
        window.addEventListener("message", onIframeMessage);

        return () => {
          window.removeEventListener("message", onIframeMessage);
          stopObservingLayout?.();
          if (iframe) {
            iframe.remove();
          }
          if (iframeContainer) {
            iframeContainer.remove();
          }
        };
      },
      [
        captionContainerElement,
        iframeProps,
        isIframe,
        onFontsLoaded,
        rawCaption,
        videoPlayer,
      ],
    );

    useImperativeHandle<CaptionRendererHandle, CaptionRendererHandle>(
      ref,
      () => {
        return {
          onVideoPlay: () => {
            iframeRef.current?.contentWindow?.postMessage(
              { type: ParentToCanvasIframeMessageType.PlayVideo },
              "*",
            );
          },
          onVideoPause: () => {
            iframeRef.current?.contentWindow?.postMessage(
              { type: ParentToCanvasIframeMessageType.PauseVideo },
              "*",
            );
          },
          onVideoSeeked: () => {
            /**/
          },
        };
      },
    );
    return null;
  },
);

function createContentPageCanvasIframe() {
  const iframeContainer = document.createElement("div");
  iframeContainer.classList.add("nekocap-iframe-canvas-container");
  iframeContainer.style.position = "absolute";
  iframeContainer.style.pointerEvents = "none";
  // Use a lower z-index to avoid interfering with YouTube's fullscreen stacking context
  iframeContainer.style.zIndex = "10000";
  // Fill the caption container until the video's layout is known
  iframeContainer.style.top = "0";
  iframeContainer.style.left = "0";
  iframeContainer.style.width = "100%";
  iframeContainer.style.height = "100%";
  const root = iframeContainer.attachShadow({ mode: "closed" });

  const iframe = document.createElement("iframe");
  iframe.sandbox.add("allow-scripts");
  // Not setting this will crash Chrome
  iframe.sandbox.add("allow-same-origin");
  iframe.style.cssText = `
  position: relative;
  top: 0;
  left: 0;
  border: none;
  `;
  root.appendChild(iframe);
  const url = new URL(chrome.runtime.getURL("canvas-iframe.html"));
  iframe.src = url.toString();
  return [iframe, iframeContainer] as const;
}

function setIframeContainerLayout(
  iframeContainer: HTMLDivElement,
  rect: VideoContentRect,
) {
  iframeContainer.style.left = `${rect.left}px`;
  iframeContainer.style.top = `${rect.top}px`;
  iframeContainer.style.width = `${rect.width}px`;
  iframeContainer.style.height = `${rect.height}px`;
}
