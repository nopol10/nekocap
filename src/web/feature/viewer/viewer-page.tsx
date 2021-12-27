import { Button, Skeleton, Space, Typography } from "antd";
import FullscreenOutlined from "@ant-design/icons/FullscreenOutlined";
import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import YouTube from "react-youtube";
import { YouTubePlayer } from "youtube-player/dist/types";
import { FullScreen, useFullScreenHandle } from "react-full-screen";
import { loadWebsiteViewerCaption } from "@/common/feature/video/actions";
import {
  fontListSelector,
  tabVideoDataSelector,
} from "@/common/feature/video/selectors";
import { routeNames } from "@/web/feature/route-types";
import {
  CaptionRendererType,
  RawCaptionData,
  VideoSource,
} from "@/common/feature/video/types";
import {
  CaptionRenderer,
  CaptionRendererHandle,
} from "@/extension/content/containers/caption-renderer";
import { OctopusRenderer } from "@/extension/content/containers/octopus-renderer";
import { useSSRMediaQuery, useStateRef } from "@/hooks";
import { isAss } from "@/common/caption-utils";
import { styledNoPass } from "@/common/style-utils";
import { videoSourceToProcessorMap } from "@/common/feature/video/utils";
import { Processor } from "@/extension/content/processors/processor";
import { CHROME_DOWNLOAD_URL, FIREFOX_DOWNLOAD_URL } from "@/common/constants";
import chromeLogo from "@/assets/images/chrome-web-store-badge.png";
import firefoxLogo from "@/assets/images/firefox-get-the-addon-badge.png";
import { Badges } from "@/common/components/badges";
import { DEVICE } from "@/common/style-constants";
import { isClient, isServer } from "@/common/client-utils";
import { SUBSTATION_FONT_LIST } from "@/common/substation-fonts";
import { WSText } from "@/common/components/ws-text";

const { Title, Text, Link } = Typography;

const TAB_ID = 0;
const YOUTUBE_IFRAME_ID = "youtube-iframe";

const MAX_HEIGHT = 600;

const Wrapper = styled.div`
  padding: 20px;
`;

const VideoWrapper = styled.div`
  position: relative;
  text-align: center;
  .fullscreen-enabled & {
    height: 100%;
  }
  & > div:not([class]),
  & > div[class=""] {
    .fullscreen-enabled & {
      height: 100%;
    }
  }
  iframe {
    width: 100%;
    :not(.fullscreen-enabled) & {
      max-height: ${MAX_HEIGHT}px;
    }
    .fullscreen-enabled & {
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

const DetailsWrapper = styledNoPass<{ width?: number }>("div")`
    ${({ width }) => (width !== undefined ? `width: ${width}px` : "")};
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

const ViewerTitle = styled(Title)`
  &.ant-typography {
    font-weight: 700;
    font-style: normal;
    @media ${DEVICE.mobileOnly} {
      font-size: 1.2em;
    }
  }
`;

const TranslatedTitle = styled(Title)`
  &.ant-typography {
    font-weight: 600;
    font-style: normal;
    @media ${DEVICE.mobileOnly} {
      font-size: 1.1em;
    }
  }
`;

const CaptionerMessage = styled(Text)`
  font-size: 1.2em;
  @media ${DEVICE.mobileOnly} {
    font-size: 1em;
  }
`;

const ExtensionMessage = styled.div`
  margin-top: 0.5em;
  font-size: 1.3em;

  ${Badges} {
    margin-top: 0.3em;
  }
`;

const FullScreenButton = styled(Button)`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 10;
`;

export type ViewerPageProps = {
  captionId: string;
  rawCaption?: RawCaptionData;
};

export const ViewerPage = ({ rawCaption }: ViewerPageProps): JSX.Element => {
  const tabData = useSelector(tabVideoDataSelector(TAB_ID));
  const [loadComplete, setLoadComplete] = useState(false);
  const [captionContainerElement, captionContainerElementRef] = useStateRef<
    HTMLDivElement
  >(null);
  const defaultRendererRef = useRef<CaptionRendererHandle>();
  const isLoading = useSelector(loadWebsiteViewerCaption.isLoading(TAB_ID));
  const fontList = useSelector(fontListSelector());
  const [youtubePlayer, setYouTubePlayer] = useState<YouTubePlayer>(null);
  const fullScreenHandle = useFullScreenHandle();
  const isDesktop = useSSRMediaQuery({ query: DEVICE.desktop });

  useEffect(() => {
    // This is a website, no tabId is required
    window.tabId = TAB_ID;
    setLoadComplete(true);
  }, []);

  const noData =
    loadComplete && (!tabData || (!tabData.caption && !rawCaption));

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

  const { caption, videoDimensions, renderer } = tabData || {};

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
  const handleYoutubePause = ({ target }: { target: YouTubePlayer }) => {
    if (!defaultRendererRef.current) {
      return;
    }
    defaultRendererRef.current.onVideoPause();
  };

  const embedWidth = Math.min((isClient() ? window.innerWidth : 0) - 60, 1600);
  const embedHeight = Math.min((9 / 16) * embedWidth, MAX_HEIGHT);

  const renderYoutubeVideo = () => {
    if (isServer()) {
      return null;
    }

    return (
      <YouTube
        opts={{
          width: embedWidth.toString(),
          height: embedHeight.toString(),
          playerVars: {
            fs: 0,
          },
        }}
        id={YOUTUBE_IFRAME_ID}
        videoId={caption.videoId}
        onReady={handleYoutubeReady}
        onPlay={handleYoutubePlay}
        onPause={handleYoutubePause}
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

  const isLandscape = isClient()
    ? window.innerWidth > window.innerHeight
    : true;
  let iframeWidth = 0;
  let iframeHeight = 0;
  if (isLandscape) {
    const currentEmbedHeight = fullScreenHandle.active
      ? window.innerHeight
      : embedHeight;
    iframeWidth = Math.ceil(
      videoDimensions
        ? (videoDimensions.width * currentEmbedHeight) / videoDimensions.height
        : 0
    );
    iframeHeight = currentEmbedHeight;
  } else {
    const currentEmbedWidth = fullScreenHandle.active
      ? window.innerWidth
      : embedWidth;
    iframeHeight = Math.ceil(
      videoDimensions
        ? (videoDimensions.height * currentEmbedWidth) / videoDimensions.width
        : 0
    );
    iframeWidth = currentEmbedWidth;
  }

  const isUsingAdvancedRenderer =
    renderer === CaptionRendererType.AdvancedOctopus &&
    rawCaption &&
    isAss(rawCaption.type);

  const iframeProps = {
    height: iframeHeight,
    width: iframeWidth,
    getCurrentTime,
  };

  const processor: Processor = caption
    ? videoSourceToProcessorMap[caption.videoSource]
    : undefined;

  return (
    <Wrapper>
      <Skeleton active={true} loading={isLoading}>
        {renderNoDataMessage()}
        <FullScreenButton onClick={fullScreenHandle.enter}>
          <FullscreenOutlined />
        </FullScreenButton>
        <FullScreen handle={fullScreenHandle}>
          <VideoWrapper ref={captionContainerElementRef}>
            {renderVideo()}
          </VideoWrapper>
        </FullScreen>
        {caption && (
          <DetailsWrapper>
            <ViewerTitle>
              <span dir="auto">{caption.originalTitle}</span>
            </ViewerTitle>
            <TranslatedTitle level={2}>
              <span dir="auto">{caption.translatedTitle}</span>
            </TranslatedTitle>
            <CaptionerMessage>
              Caption submitted by{" "}
              <Link
                href={routeNames.profile.main.replace(":id", caption.creator)}
              >
                {caption.creatorName}
              </Link>
            </CaptionerMessage>
            <ExtensionMessage>
              <WSText>
                For the best caption viewing &amp; creating experience, download
                the NekoCap extension and view captions directly in{" "}
                {processor ? processor.name : "YouTube"}.
              </WSText>
              <Badges style={{ justifyContent: "left" }}>
                <Space direction={isDesktop ? "horizontal" : "vertical"}>
                  <a
                    target="_blank"
                    rel="noreferrer"
                    href={CHROME_DOWNLOAD_URL}
                  >
                    <img id="chrome-badge" src={chromeLogo.src} />
                  </a>
                  <a
                    target="_blank"
                    rel="noreferrer"
                    href={FIREFOX_DOWNLOAD_URL}
                  >
                    <img id="firefox-badge" src={firefoxLogo.src} />
                  </a>
                </Space>
              </Badges>
            </ExtensionMessage>
          </DetailsWrapper>
        )}
        {loadComplete && renderer === CaptionRendererType.Default && (
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
        {loadComplete && isUsingAdvancedRenderer && (
          <OctopusRenderer
            ref={defaultRendererRef}
            rawCaption={rawCaption.data}
            videoElement={undefined}
            captionContainerElement={captionContainerElement}
            showCaption={true}
            isIframe={true}
            iframeProps={iframeProps}
            fontList={fontList}
          />
        )}
      </Skeleton>
    </Wrapper>
  );
};
