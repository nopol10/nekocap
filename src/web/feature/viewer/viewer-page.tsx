import { Skeleton, Typography } from "antd";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { loadServerCaption } from "@/common/feature/video/actions";
import { tabVideoDataSelector } from "@/common/feature/video/selectors";
import { routeNames } from "@/web/feature/route-types";
import { VideoSource } from "@/common/feature/video/types";
import YouTube from "react-youtube";
import { YouTubePlayer } from "youtube-player";

const { Title, Text, Link } = Typography;

const TAB_ID = 0;

const Wrapper = styled.div`
  padding: 20px;
`;

const VideoWrapper = styled.div`
  text-align: center;
  max-height: 600px;
  iframe {
    max-height: 600px;
  }
`;

export const ViewerPage = () => {
  const dispatch = useDispatch();
  const { id: captionId } = useParams<{ id: string }>();
  const tabData = useSelector(tabVideoDataSelector(TAB_ID));
  const [loadComplete, setLoadComplete] = useState(false);
  const isLoading = useSelector(loadServerCaption.isLoading(window.tabId));

  useEffect(() => {
    // This is a website, no tabId is required
    window.tabId = TAB_ID;
    dispatch(loadServerCaption.request({ tabId: window.tabId, captionId }))
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

  const { caption, rawCaption } = tabData || {};

  const handleYoutubeReady = (event: { target: YouTubePlayer }) => {
    console.log("Ready", event);
  };

  const renderYoutubeVideo = () => {
    const width = Math.min(window.innerWidth, 1600);
    const height = (9 / 16) * width;
    return (
      <YouTube
        opts={{
          width: width.toString(),
          height: height.toString(),
        }}
        videoId={caption.videoId}
        onReady={handleYoutubeReady}
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

  return (
    <Wrapper>
      <Skeleton loading={isLoading}>
        {renderNoDataMessage()}
        <VideoWrapper>{renderVideo()}</VideoWrapper>
      </Skeleton>
    </Wrapper>
  );
};
