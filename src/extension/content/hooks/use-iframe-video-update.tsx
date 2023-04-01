import { PageType } from "@/common/feature/video/types";
import { ChromeMessage, ChromeMessageType } from "@/common/types";
import { MutableRefObject, useCallback, useEffect, useRef } from "react";
import { CaptionRendererHandle } from "../containers/caption-renderer";
import { VideoAction } from "../types";

/**
 * Hook that should be placed in the content script that contains the caption data and renders it
 */
export const useIframeVideoUpdate = ({
  rendererRef,
}: {
  rendererRef: MutableRefObject<CaptionRendererHandle | null>;
}): { getIframeVideoTime: () => number } => {
  const iframeVideoData = useRef<{ time: number; duration: number }>({
    time: 0,
    duration: 0,
  });
  const onIframePlay = useCallback((duration: number) => {
    iframeVideoData.current.duration = duration;
    rendererRef.current?.onVideoPlay();
  }, []);
  const onIframePause = useCallback((duration: number) => {
    iframeVideoData.current.duration = duration;
    rendererRef.current?.onVideoPause();
  }, []);
  const onIframeTimeUpdate = useCallback((time: number, duration: number) => {
    iframeVideoData.current.time = time;
    iframeVideoData.current.duration = duration;
    rendererRef.current?.onVideoSeeked();
  }, []);

  const getIframeVideoTime = useCallback(() => {
    return iframeVideoData.current.time;
  }, []);
  useEffect(() => {
    if (
      globalThis.selectedProcessor?.getPageType(location.href) !==
      PageType.Video
    ) {
      return;
    }
    const messageListener = (message: ChromeMessage) => {
      if (message.type !== ChromeMessageType.VideoIframeToContent) {
        return;
      }
      if (message.payload.type === VideoAction.Play) {
        onIframePlay(message.payload.duration);
      } else if (message.payload.type === VideoAction.Pause) {
        onIframePause(message.payload.duration);
      } else if (message.payload.type === VideoAction.TimeUpdate) {
        onIframeTimeUpdate(message.payload.time, message.payload.duration);
      }
    };
    chrome.runtime.onMessage.addListener(messageListener);
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, [rendererRef]);
  return { getIframeVideoTime };
};
