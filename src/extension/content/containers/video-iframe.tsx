import React, { ReactElement, useEffect } from "react";
import { PageType } from "@/common/feature/video/types";
import { ChromeMessageType } from "@/common/types";
import { VideoAction } from "../types";

export const VideoIframe = (): ReactElement => {
  useEffect(() => {
    if (
      globalThis.selectedProcessor?.getPageType(location.href) !==
      PageType.VideoIframe
    ) {
      return;
    }
    const sendTimeUpdateToParent = () => {
      chrome.runtime.sendMessage({
        type: ChromeMessageType.VideoIframeToBackground,
        payload: {
          type: VideoAction.TimeUpdate,
          time: globalThis.videoElement.currentTime,
          duration: globalThis.videoElement.duration,
        },
      });
    };
    const sendPlayToParent = () => {
      chrome.runtime.sendMessage({
        type: ChromeMessageType.VideoIframeToBackground,
        payload: {
          type: VideoAction.Play,
          time: globalThis.videoElement.currentTime,
          duration: globalThis.videoElement.duration,
        },
      });
    };
    const sendPauseToParent = () => {
      chrome.runtime.sendMessage({
        type: ChromeMessageType.VideoIframeToBackground,
        payload: {
          type: VideoAction.Pause,
          time: globalThis.videoElement.currentTime,
          duration: globalThis.videoElement.duration,
        },
      });
    };
    globalThis.videoElement.addEventListener(
      "timeupdate",
      sendTimeUpdateToParent
    );
    globalThis.videoElement.addEventListener("play", sendPlayToParent);
    globalThis.videoElement.addEventListener("pause", sendPauseToParent);
    globalThis.videoElement.addEventListener("seeked", sendTimeUpdateToParent);
    return () => {
      globalThis.videoElement.removeEventListener(
        "timeupdate",
        sendTimeUpdateToParent
      );
      globalThis.videoElement.removeEventListener("play", sendPlayToParent);
      globalThis.videoElement.removeEventListener("pause", sendPauseToParent);
      globalThis.videoElement.removeEventListener(
        "seeked",
        sendTimeUpdateToParent
      );
    };
  }, [globalThis.videoElement]);

  return <div style={{ display: "none" }}></div>;
};
