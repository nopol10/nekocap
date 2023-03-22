import React, { ReactElement } from "react";
import YouTube, { YouTubePlayer } from "react-youtube";
import { ViewerProps } from "./viewer-props";

const YOUTUBE_IFRAME_ID = "youtube-iframe";

export type YoutubeViewerProps = ViewerProps & {
  youtubePlayerRef: React.MutableRefObject<YouTubePlayer | undefined>;
};

export const YoutubeViewer = ({
  embedWidth,
  embedHeight,
  caption,
  defaultRendererRef,
  youtubePlayerRef,
  currentTimeGetter,
}: YoutubeViewerProps): ReactElement => {
  const handleYoutubeReady = ({ target }: { target: YouTubePlayer }) => {
    youtubePlayerRef.current = target;
    currentTimeGetter.current = () => {
      return target.getCurrentTime();
    };
  };

  const handleYoutubePlay = () => {
    if (!defaultRendererRef.current) {
      return;
    }
    defaultRendererRef.current.onVideoPlay();
  };
  const handleYoutubePause = () => {
    if (!defaultRendererRef.current) {
      return;
    }
    defaultRendererRef.current.onVideoPause();
  };

  return (
    <>
      <YouTube
        opts={{
          width: embedWidth.toString(),
          height: embedHeight.toString(),
          playerVars: {
            fs: 0,
          },
        }}
        id={YOUTUBE_IFRAME_ID}
        videoId={caption?.videoId}
        onReady={handleYoutubeReady}
        onPlay={handleYoutubePlay}
        onPause={handleYoutubePause}
      ></YouTube>
    </>
  );
};
