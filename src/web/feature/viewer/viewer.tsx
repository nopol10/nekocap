import { isAss } from "@/common/caption-utils";
import { isClient, isServer } from "@/common/client-utils";
import { tabVideoDataSelector } from "@/common/feature/video/selectors";
import {
  CaptionContainer,
  CaptionRendererType,
  IFrameProps,
  RawCaptionData,
  VideoPlayerPreferences,
  VideoSource,
} from "@/common/feature/video/types";
import { Dimension } from "@/common/types";
import {
  CaptionRenderer,
  CaptionRendererHandle,
} from "@/extension/content/containers/caption-renderer";
import { OctopusRenderer } from "@/extension/content/containers/octopus-renderer";
import { VideoPlayer } from "@/extension/content/feature/editor/video-player/video-player";
import { useStateRef } from "@/hooks";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import styled, { createGlobalStyle } from "styled-components";
import { YouTubePlayer } from "youtube-player/dist/types";
import { DailymotionViewer } from "./container/dailymotion-viewer";
import { VimeoViewer } from "./container/vimeo-viewer";
import { YoutubeViewer } from "./container/youtube-viewer";

const MAX_HEIGHT = 600;

const NEKOCAP_EMBED_CLASSNAME = "nekocap-embed";
const YOUTUBE_VIEWER_CLASS_NAME = "youtube-viewer";
const YoutubeGlobalStyles = createGlobalStyle`
  .${YOUTUBE_VIEWER_CLASS_NAME} {
    height: 100%;

    & iframe {
      width: 100%;
      height: 100%;
    }
  }
`;

const VideoWrapper = styled.div`
  position: relative;
  text-align: center;
  .fullscreen-enabled &,
  .${NEKOCAP_EMBED_CLASSNAME} & {
    height: 100%;
  }
  & > div:not([class]),
  & > div[class=""] {
    .fullscreen-enabled &,
    .${NEKOCAP_EMBED_CLASSNAME} & {
      height: 100%;
    }
  }
  iframe {
    display: block;
    width: 100%;
    .fullscreen:not(.fullscreen-enabled) & {
      max-height: ${MAX_HEIGHT}px;
    }
    .fullscreen-enabled &,
    .${NEKOCAP_EMBED_CLASSNAME} & {
      height: 100%;
    }
  }

  @media (orientation: portrait) {
    canvas,
    .nekocap-cap-container {
      transform: translate(-50%, -50%) !important;
      top: 50% !important;
    }
  }
`;

const TAB_ID = 0;

export type ViewerProps = {
  caption?: CaptionContainer;
  rawCaption?: RawCaptionData;
  videoDimensions?: Dimension;
  renderer?: CaptionRendererType;
  fontList: { [name: string]: string };
  onSetVideoPlayer?: (player: VideoPlayer) => void;
  videoPlayerPreferences: VideoPlayerPreferences;
  retrieveVideoData?: boolean;
  onFontsLoaded?: (progress: number) => void;
  autoplay?: boolean;
};

export const Viewer = ({
  caption,
  rawCaption,
  videoDimensions,
  renderer,
  fontList,
  onSetVideoPlayer,
  videoPlayerPreferences,
  retrieveVideoData,
  onFontsLoaded,
  autoplay,
}: ViewerProps): JSX.Element => {
  const [loadComplete, setLoadComplete] = useState(false);
  const [videoPlayer, setVideoPlayer] = useState<VideoPlayer>();
  const [captionContainerElement, captionContainerElementRef] =
    useStateRef<HTMLDivElement>();
  const defaultRendererRef = useRef<CaptionRendererHandle | null>(null);
  const youtubePlayerRef = useRef<YouTubePlayer>();
  const currentTimeGetter = useRef<() => number>();
  const videoData = useSelector(tabVideoDataSelector(globalThis.tabId));

  useEffect(() => {
    // This is a website, no tabId is required
    window.tabId = TAB_ID;
    setLoadComplete(true);
  }, []);

  const noData = loadComplete && !caption && !rawCaption;
  const embedWidth = Math.min((isClient() ? window.innerWidth : 0) - 60, 1600);
  const embedHeight = Math.min((9 / 16) * embedWidth, MAX_HEIGHT);

  const videoWidth = Math.ceil(
    videoDimensions
      ? (videoDimensions.width * embedHeight) / videoDimensions.height
      : 0,
  );
  const videoHeight = embedHeight;
  const isUsingAdvancedRenderer =
    renderer === CaptionRendererType.AdvancedOctopus &&
    rawCaption &&
    isAss(rawCaption.type);

  const getCurrentTime = (): number => {
    return currentTimeGetter.current?.() || 0;
  };

  const iframeProps: IFrameProps = {
    height: videoHeight,
    width: videoWidth,
    left: 0,
    top: 0,
    getCurrentTime,
  };

  const onVideoPlayerReady = useCallback(
    (videoPlayer: VideoPlayer) => {
      onSetVideoPlayer?.(videoPlayer);
      setVideoPlayer(videoPlayer);
    },
    [onSetVideoPlayer],
  );

  const renderYoutubeVideo = () => {
    return (
      <>
        <YoutubeGlobalStyles />
        <YoutubeViewer
          embedHeight={embedHeight}
          embedWidth={embedWidth}
          caption={caption}
          defaultRendererRef={defaultRendererRef}
          youtubePlayerRef={youtubePlayerRef}
          currentTimeGetter={currentTimeGetter}
          onVideoPlayerReady={onVideoPlayerReady}
          retrieveVideoData={retrieveVideoData || false}
          autoplay={autoplay || false}
        />
      </>
    );
  };

  const renderVimeoVideo = () => {
    return (
      <VimeoViewer
        embedHeight={embedHeight}
        embedWidth={embedWidth}
        caption={caption}
        defaultRendererRef={defaultRendererRef}
        currentTimeGetter={currentTimeGetter}
        onVideoPlayerReady={onVideoPlayerReady}
        retrieveVideoData={retrieveVideoData || false}
        autoplay={autoplay || false}
      />
    );
  };

  const renderDailymotionVideo = () => {
    return (
      <DailymotionViewer
        embedHeight={embedHeight}
        embedWidth={embedWidth}
        caption={caption}
        defaultRendererRef={defaultRendererRef}
        currentTimeGetter={currentTimeGetter}
        retrieveVideoData={retrieveVideoData || false}
        autoplay={autoplay || false}
      />
    );
  };

  const renderVideo = () => {
    if (isServer()) {
      return null;
    }
    if (!loadComplete || noData || !caption) {
      return;
    }
    if (
      caption.videoSource === VideoSource.Youtube ||
      caption.videoSource === VideoSource.NekoCapYoutube
    ) {
      return renderYoutubeVideo();
    } else if (caption.videoSource === VideoSource.Vimeo) {
      return renderVimeoVideo();
    } else if (caption.videoSource === VideoSource.Dailymotion) {
      return renderDailymotionVideo();
    }
    return;
  };

  const showCaption = videoData?.showCaption ?? true;

  return (
    <>
      <VideoWrapper ref={captionContainerElementRef}>
        {renderVideo()}
      </VideoWrapper>
      {loadComplete && renderer === CaptionRendererType.Default && (
        <CaptionRenderer
          ref={defaultRendererRef}
          caption={caption}
          videoPlayer={videoPlayer}
          captionContainerElement={captionContainerElement}
          showCaption={showCaption}
          isIframe={true}
          iframeProps={iframeProps}
          preferences={videoPlayerPreferences}
        />
      )}
      {loadComplete && isUsingAdvancedRenderer && (
        <OctopusRenderer
          ref={defaultRendererRef}
          rawCaption={rawCaption.data}
          videoPlayer={videoPlayer}
          captionContainerElement={captionContainerElement}
          showCaption={showCaption}
          fontList={fontList}
          isIframe={true}
          iframeProps={iframeProps}
          onFontsLoaded={onFontsLoaded}
        />
      )}
    </>
  );
};
