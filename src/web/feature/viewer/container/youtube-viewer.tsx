import { useYoutubeVideoData } from "@/common/hooks/use-youtube-video-data";
import { VideoPlayer } from "@/extension/content/feature/editor/video-player/video-player";
import { YoutubeEmbedVideoPlayer } from "@/extension/content/feature/editor/video-player/youtube-embed-video-player";
import { debounce } from "lodash-es";
import React, { ReactElement, useCallback, useEffect } from "react";
import YouTube, { YouTubePlayer } from "react-youtube";
import { ViewerProps } from "./viewer-props";

const YOUTUBE_IFRAME_ID = "youtube-iframe";

export type YoutubeViewerProps = ViewerProps & {
  youtubePlayerRef: React.MutableRefObject<YouTubePlayer | undefined>;
  onVideoPlayerReady?: (videoPlayer: VideoPlayer) => void;
};

export const YoutubeViewer = ({
  embedWidth,
  embedHeight,
  caption,
  defaultRendererRef,
  onVideoPlayerReady,
  youtubePlayerRef,
  currentTimeGetter,
  retrieveVideoData,
  autoplay,
}: YoutubeViewerProps): ReactElement => {
  const { data: youtubeData } = useYoutubeVideoData(
    retrieveVideoData ? caption?.videoId : undefined,
  );

  useEffect(
    function updateGlobalVideoData() {
      globalThis.videoName = youtubeData?.title || globalThis.videoName;
    },
    [youtubeData?.title],
  );

  const handleYoutubeReady = ({ target }: { target: YouTubePlayer }) => {
    youtubePlayerRef.current = target;
    currentTimeGetter.current = () => {
      return target.getCurrentTime();
    };
  };

  const onYoutubeRefChange = useCallback(
    debounce((reference: YouTube | null) => {
      const internalPlayer = reference?.getInternalPlayer();
      if (!internalPlayer) {
        return;
      }
      onVideoPlayerReady?.(new YoutubeEmbedVideoPlayer(internalPlayer));
    }, 500),
    [onVideoPlayerReady],
  );

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
        ref={onYoutubeRefChange}
        opts={{
          width: embedWidth.toString(),
          height: embedHeight.toString(),
          playerVars: {
            autoplay: autoplay ? 1 : 0,
            // @ts-ignore - mute is supported but not documented in types
            mute: autoplay ? 1 : undefined,
            fs: 0,
            rel: 0,
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
