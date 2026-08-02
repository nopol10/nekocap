import { VimeoEmbedVideoPlayer } from "@/extension/content/feature/editor/video-player/vimeo-embed-video-player";
import Script from "next/script";
import { ReactElement, useEffect, useRef } from "react";
import type * as VimeoType from "vimeo__player";
import { ViewerProps } from "./viewer-props";

const VIMEO_IFRAME_ID = "vimeo-iframe";

export type VimeoViewerProps = ViewerProps;

export const VimeoViewer = ({
  embedWidth,
  embedHeight,
  caption,
  defaultRendererRef,
  currentTimeGetter,
  onVideoPlayerReady,
}: VimeoViewerProps): ReactElement => {
  const currentTime = useRef<number>();
  const vimeoFrame = useRef<HTMLIFrameElement>(null);
  const videoPlayer = useRef<VimeoEmbedVideoPlayer>();

  // The player polls the video for its properties on a timer, which has to be
  // stopped or it keeps running after the page is gone
  useEffect(() => {
    return () => {
      videoPlayer.current?.destruct();
    };
  }, []);

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
    videoPlayer.current = new VimeoEmbedVideoPlayer(player, iframe);
    onVideoPlayerReady?.(videoPlayer.current);

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
