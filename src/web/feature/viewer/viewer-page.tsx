import { Skeleton, Typography } from "antd";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import {
  loadServerCaption,
  loadWebsiteViewerCaption,
} from "@/common/feature/video/actions";
import { tabVideoDataSelector } from "@/common/feature/video/selectors";
import { routeNames } from "@/web/feature/route-types";
import { VideoSource } from "@/common/feature/video/types";
import YouTube from "react-youtube";
import { YouTubePlayer } from "youtube-player/dist/types";
import {
  CaptionRenderer,
  CaptionRendererHandle,
} from "@/extension/content/containers/caption-renderer";
import { useStateRef } from "@/hooks";

const { Title, Text, Link } = Typography;

const TAB_ID = 0;

const MAX_HEIGHT = 600;

const Wrapper = styled.div`
  padding: 20px;
`;

const VideoWrapper = styled.div`
  text-align: center;
  max-height: ${MAX_HEIGHT}px;
  iframe {
    max-height: ${MAX_HEIGHT}px;
  }
`;

export const ViewerPage = () => {
  const dispatch = useDispatch();
  const { id: captionId } = useParams<{ id: string }>();
  const tabData = useSelector(tabVideoDataSelector(TAB_ID));
  const [loadComplete, setLoadComplete] = useState(false);
  const [captionContainerElement, captionContainerElementRef] = useStateRef<
    HTMLDivElement
  >(null);
  const defaultRendererRef = useRef<CaptionRendererHandle>();
  const isLoading = useSelector(loadServerCaption.isLoading(window.tabId));
  const [youtubePlayer, setYouTubePlayer] = useState<YouTubePlayer>(null);

  useEffect(() => {
    // This is a website, no tabId is required
    window.tabId = TAB_ID;
    dispatch(
      loadWebsiteViewerCaption.request({ tabId: window.tabId, captionId })
    )
      .then(() => {
        setLoadComplete(true);
      })
      .catch(() => {
        setLoadComplete(true);
      });
  }, [captionId]);

  const noData =
    loadComplete && (!tabData || (!tabData.caption && !tabData.rawCaption));

  const renderNoDataMessage = () => {
    if (!noData) {
      return;
    }
    return (
      <div>
        <Title>Sorry, we could not find this caption!</Title>
        <Title level={2}>
          <Link href={routeNames.caption.browse}>Browse other captions</Link>
        </Title>
      </div>
    );
  };

  const { caption, rawCaption, videoDimensions } = tabData || {};

  const getCurrentTime = (): number => {
    if (youtubePlayer) {
      return youtubePlayer.getCurrentTime();
    }
    return 0;
  };

  const handleYoutubeReady = ({ target }: { target: YouTubePlayer }) => {
    setYouTubePlayer(target);
  };

  const handleYoutubePlay = ({ target }: { target: YouTubePlayer }) => {
    defaultRendererRef.current.onVideoPlay();
  };

  const embedWidth = Math.min(window.innerWidth, 1600);
  const embedHeight = Math.min((9 / 16) * embedWidth, MAX_HEIGHT);

  const renderYoutubeVideo = () => {
    return (
      <YouTube
        opts={{
          width: embedWidth.toString(),
          height: embedHeight.toString(),
        }}
        videoId={caption.videoId}
        onReady={handleYoutubeReady}
        onPlay={handleYoutubePlay}
      ></YouTube>
    );
  };

  const renderVideo = () => {
    if (!loadComplete || noData) {
      return;
    }
    if (caption.videoSource === VideoSource.Youtube) {
      return renderYoutubeVideo();
    }
    return;
  };

  const videoWidth = videoDimensions
    ? (videoDimensions.width * embedHeight) / videoDimensions.height
    : 0;
  const videoHeight = embedHeight;
  console.log(videoWidth, videoHeight);

  return (
    <Wrapper>
      <Skeleton loading={isLoading}>
        {renderNoDataMessage()}
        <VideoWrapper ref={captionContainerElementRef}>
          {renderVideo()}
        </VideoWrapper>
        <CaptionRenderer
          ref={defaultRendererRef}
          caption={caption}
          videoElement={window.videoElement}
          captionContainerElement={captionContainerElement}
          showCaption={true}
          isIframe={true}
          iframeProps={{
            height: videoHeight,
            width: videoWidth,
            getCurrentTime,
          }}
        />
      </Skeleton>
    </Wrapper>
  );
};
