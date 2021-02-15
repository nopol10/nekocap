import { Skeleton, Space, Typography } from "antd";
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
import { CaptionRendererType, VideoSource } from "@/common/feature/video/types";
import YouTube from "react-youtube";
import { YouTubePlayer } from "youtube-player/dist/types";
import {
  CaptionRenderer,
  CaptionRendererHandle,
} from "@/extension/content/containers/caption-renderer";
import { OctopusRenderer } from "@/extension/content/containers/octopus-renderer";
import { useStateRef } from "@/hooks";
import { isAss } from "@/common/caption-utils";
import { styledNoPass } from "@/common/style-utils";
import { videoSourceToProcessorMap } from "@/common/feature/video/utils";
import { Processor } from "@/extension/content/processors/processor";
import { CHROME_DOWNLOAD_URL, FIREFOX_DOWNLOAD_URL } from "@/common/constants";
import chromeLogo from "@/assets/images/chrome-web-store-badge.png";
import firefoxLogo from "@/assets/images/firefox-get-the-addon-badge.png";
import { Badges } from "@/common/components/badges";

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

const DetailsWrapper = styledNoPass<{ width: number }>("div")`
    width: ${({ width }) => width}px;
    margin-left: auto;
    margin-right: auto;

    h1.ant-typography {
      margin-top: 0.3em;
      margin-bottom: 0;
    }

    h2.ant-typography {
      margin-top: 0.2em;
    }
`;

const CaptionerMessage = styled(Text)`
  font-size: 1.2em;
`;

const ExtensionMessage = styled.div`
  margin-top: 0.5em;
  font-size: 1.3em;

  ${Badges} {
    margin-top: 0.3em;
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
  const isLoading = useSelector(loadWebsiteViewerCaption.isLoading(TAB_ID));
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

  const { caption, rawCaption, videoDimensions, renderer } = tabData || {};

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
    if (!defaultRendererRef.current) {
      return;
    }
    defaultRendererRef.current.onVideoPlay();
  };

  const embedWidth = Math.min(window.innerWidth - 60, 1600);
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

  const videoWidth = Math.ceil(
    videoDimensions
      ? (videoDimensions.width * embedHeight) / videoDimensions.height
      : 0
  );
  const videoHeight = embedHeight;
  const isUsingAdvancedRenderer =
    renderer === CaptionRendererType.AdvancedOctopus &&
    rawCaption &&
    isAss(rawCaption.type);

  const iframeProps = {
    height: videoHeight,
    width: videoWidth,
    getCurrentTime,
  };

  const processor: Processor = caption
    ? videoSourceToProcessorMap[caption.videoSource]
    : undefined;

  return (
    <Wrapper>
      <Skeleton active={true} loading={isLoading}>
        {renderNoDataMessage()}
        <VideoWrapper ref={captionContainerElementRef}>
          {renderVideo()}
        </VideoWrapper>
        {caption && (
          <DetailsWrapper width={embedWidth}>
            <Title>{caption.originalTitle}</Title>
            <Title level={2}>{caption.translatedTitle}</Title>
            <CaptionerMessage>
              Caption submitted by{" "}
              <Link
                href={routeNames.profile.main.replace(":id", caption.creator)}
              >
                {caption.creatorName}
              </Link>
            </CaptionerMessage>
            <ExtensionMessage>
              <Text>
                For the best caption viewing &amp; creating experience, download
                the NekoCap extension and view captions directly in{" "}
                {processor ? processor.name : "YouTube"}.
              </Text>
              <Badges style={{ textAlign: "left" }}>
                <Space>
                  <a
                    target="_blank"
                    rel="noreferrer"
                    href={CHROME_DOWNLOAD_URL}
                  >
                    <img id="chrome-badge" src={chromeLogo} />
                  </a>
                  <a
                    target="_blank"
                    rel="noreferrer"
                    href={FIREFOX_DOWNLOAD_URL}
                  >
                    <img id="firefox-badge" src={firefoxLogo} />
                  </a>
                </Space>
              </Badges>
            </ExtensionMessage>
          </DetailsWrapper>
        )}
        {renderer === CaptionRendererType.Default && (
          <CaptionRenderer
            ref={defaultRendererRef}
            caption={caption}
            videoElement={undefined}
            captionContainerElement={captionContainerElement}
            showCaption={true}
            isIframe={true}
            iframeProps={iframeProps}
          />
        )}
        {isUsingAdvancedRenderer && (
          <OctopusRenderer
            rawCaption={rawCaption.data}
            videoElement={undefined}
            captionContainerElement={captionContainerElement}
            showCaption={true}
            isIframe={true}
            iframeProps={iframeProps}
          />
        )}
      </Skeleton>
    </Wrapper>
  );
};
