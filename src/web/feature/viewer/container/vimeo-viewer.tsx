import type * as VimeoType from "vimeo__player";
import Script from "next/script";
import React, { ReactElement, useRef } from "react";
import { ViewerProps } from "./viewer-props";

const VIMEO_IFRAME_ID = "vimeo-iframe";

export type VimeoViewerProps = ViewerProps;

export const VimeoViewer = ({
  embedWidth,
  embedHeight,
  caption,
  defaultRendererRef,
  currentTimeGetter,
}: VimeoViewerProps): ReactElement => {
  const currentTime = useRef<number>();
  const vimeoFrame = useRef<HTMLIFrameElement>(null);

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
  const handleTimeUpdate = (event: VimeoType.TimeEvent) => {
    currentTime.current = event.seconds;
  };
  const handleScriptLoaded = () => {
    const iframe = vimeoFrame.current;
    if (!iframe) {
      return;
    }
    const player = new window.Vimeo.Player(iframe);

    player.on("play", handlePlay);
    player.on("pause", handlePause);
    player.on("timeupdate", handleTimeUpdate);

    currentTimeGetter.current = () => currentTime.current || 0;
  };

  return (
    <>
      <Script
        src="https://player.vimeo.com/api/player.js"
        onLoad={handleScriptLoaded}
      ></Script>
      <iframe
        ref={vimeoFrame}
        id={VIMEO_IFRAME_ID}
        src={`https://player.vimeo.com/video/${caption?.videoId}?h=8272103f6e`}
        width={embedWidth.toString()}
        height={embedHeight.toString()}
        frameBorder="0"
        allow="encrypted-media"
      ></iframe>
    </>
  );
};
