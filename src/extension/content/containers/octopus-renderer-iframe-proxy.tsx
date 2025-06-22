/* eslint-disable react/display-name */
import {
  CanvasIframeToParentMessage,
  CanvasIframeToParentMessageType,
  ParentToCanvasIframeMessageType,
} from "@/common/types";
import { waitUntil } from "@/common/utils";
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
    const videoElementWidth = videoPlayer?.element()?.offsetWidth || 0;
    const videoElementHeight = videoPlayer?.element()?.offsetHeight || 0;
    useEffect(
      function spawnIframeAndListen() {
        if (!captionContainerElement) {
          console.error("Caption container element is not provided");
          return;
        }
        const [iframe, iframeContainer] = createContentPageCanvasIframe();
        captionContainerElement.appendChild(iframeContainer);
        iframeRef.current = iframe;
        let width = 0,
          height = 0;
        if (isIframe && iframeProps && captionContainerElement) {
          width = globalThis.screen.width * globalThis.devicePixelRatio;
          height = width * (iframeProps.height / iframeProps.width);
        } else {
          width = videoElementWidth;
          height = videoElementHeight;
        }
        iframe.style.width = "100%";
        iframe.style.height = "100%";
        let canvasIframeListenerReady = false;
        function onIframeMessage(
          event: MessageEvent<CanvasIframeToParentMessage>,
        ) {
          if (event.source !== iframe.contentWindow) {
            return;
          }
          if (event.data.type === CanvasIframeToParentMessageType.Ready) {
            canvasIframeListenerReady = true;
            console.log("Canvas iframe listener is ready");
          } else if (
            event.data.type === CanvasIframeToParentMessageType.FontLoadProgress
          ) {
            onFontsLoaded?.(event.data.progress);
          }
        }
        window.addEventListener("message", onIframeMessage);
        waitUntil(() => canvasIframeListenerReady).then(() => {
          iframe.contentWindow?.postMessage(
            {
              type: ParentToCanvasIframeMessageType.UpdateContentIframeVideoProperties,
              width,
              height,
              rawCaption,
            },
            "*",
          );
        });

        return () => {
          window.removeEventListener("message", onIframeMessage);
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
        videoElementWidth,
        videoElementHeight,
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
    return <>IFrame octopus</>;
  },
);

function createContentPageCanvasIframe() {
  const iframeContainer = document.createElement("div");
  iframeContainer.style.position = "absolute";
  iframeContainer.style.pointerEvents = "none";
  iframeContainer.style.zIndex = "10000";
  iframeContainer.style.width = "100%";
  iframeContainer.style.height = "100%";
  iframeContainer.style.top = "0";
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
