import React, { ReactElement, useEffect } from "react";
import { PageType } from "@/common/feature/video/types";
import { ChromeMessageType } from "@/common/types";
import { VideoAction } from "../types";

export const VideoIframe = (): ReactElement => {
  useEffect(() => {
    if (
      window.selectedProcessor.getPageType(location.href) !==
      PageType.VideoIframe
    ) {
      return;
    }
    const sendTimeUpdateToParent = () => {
      chrome.runtime.sendMessage({
        type: ChromeMessageType.VideoIframeToBackground,
        payload: {
          type: VideoAction.TimeUpdate,
          time: window.videoElement.currentTime,
          duration: window.videoElement.duration,
        },
      });
    };
    const sendPlayToParent = () => {
      chrome.runtime.sendMessage({
        type: ChromeMessageType.VideoIframeToBackground,
        payload: {
          type: VideoAction.Play,
          time: window.videoElement.currentTime,
          duration: window.videoElement.duration,
        },
      });
    };
    const sendPauseToParent = () => {
      chrome.runtime.sendMessage({
        type: ChromeMessageType.VideoIframeToBackground,
        payload: {
          type: VideoAction.Pause,
          time: window.videoElement.currentTime,
          duration: window.videoElement.duration,
        },
      });
    };
    window.videoElement.addEventListener("timeupdate", sendTimeUpdateToParent);
    window.videoElement.addEventListener("play", sendPlayToParent);
    window.videoElement.addEventListener("pause", sendPauseToParent);
    window.videoElement.addEventListener("seeked", sendTimeUpdateToParent);
    return () => {
      window.videoElement.removeEventListener(
        "timeupdate",
        sendTimeUpdateToParent
      );
      window.videoElement.removeEventListener("play", sendPlayToParent);
      window.videoElement.removeEventListener("pause", sendPauseToParent);
      window.videoElement.removeEventListener("seeked", sendTimeUpdateToParent);
    };
  }, [window.videoElement]);

  return <div style={{ display: "none" }}></div>;
};
