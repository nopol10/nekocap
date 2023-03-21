import Script from "next/script";
import React, { ReactElement, useRef } from "react";
import { ViewerProps } from "./viewer-props";
import styled from "styled-components";

const VIMEO_IFRAME_ID = "dailymotion-iframe";

const IFrameWrapper = styled.div<{ $height: number }>`
  height: ${({ $height }) => $height}px;

  .fullscreen-enabled & {
    height: 100%;
  }

  .dailymotion-player-root {
    height: 100%;
    padding-bottom: 0 !important;
    position: unset !important;
  }

  .dailymotion-player-wrapper {
    position: unset !important;
  }
`;

export type DailymotionViewerProps = ViewerProps;

export const DailymotionViewer = ({
  embedHeight,
  caption,
  defaultRendererRef,
  currentTimeGetter,
}: DailymotionViewerProps): ReactElement => {
  const currentTime = useRef<number>();
  const dailymotionFrame = useRef<HTMLIFrameElement>(null);

  const handlePlay = () => {
    if (!defaultRendererRef.current) {
      return;
    }
    defaultRendererRef.current.onVideoPlay();
  };
  const handlePause = () => {
    if (!defaultRendererRef.current) {
      return;
    }
    defaultRendererRef.current.onVideoPause();
  };
  const handleTimeUpdate = (event: { videoTime: number }) => {
    currentTime.current = event.videoTime;
  };
  const handleSeekEnd = (event: { videoTime: number }) => {
    currentTime.current = event.videoTime;
  };
  const handleScriptLoaded = async () => {
    if (!caption) {
      return;
    }
    const player = await window.dailymotion.createPlayer(VIMEO_IFRAME_ID, {
      video: caption.videoId,
    });

    player.on("video_start", handlePlay);
    player.on("play", handlePlay);
    player.on("pause", handlePause);
    player.on("seeked", handleSeekEnd);
    player.on("timeupdate", handleTimeUpdate);

    currentTimeGetter.current = () => {
      return currentTime.current || 0;
    };
  };

  return (
    <>
      <Script
        src={`https://geo.dailymotion.com/libs/player.js`}
        onLoad={handleScriptLoaded}
      ></Script>
      <IFrameWrapper ref={dailymotionFrame} $height={embedHeight}>
        <div id={VIMEO_IFRAME_ID}></div>
      </IFrameWrapper>
    </>
  );
};
