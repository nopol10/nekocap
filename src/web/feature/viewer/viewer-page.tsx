import { message, Skeleton, Space, Tooltip, Typography } from "antd";
import FullscreenOutlined from "@ant-design/icons/FullscreenOutlined";
import React, {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import type { YouTubePlayer } from "youtube-player/dist/types";
import { FullScreen, useFullScreenHandle } from "react-full-screen";
import { faCode } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "antd/lib/slider/style";
import {
  loadServerCaption,
  loadWebsiteViewerCaption,
  setIsLoadingRawCaption,
  setPlayerFontSizeMultiplier,
} from "@/common/feature/video/actions";
import {
  fontListSelector,
  tabVideoDataSelector,
} from "@/common/feature/video/selectors";
import { routeNames } from "@/web/feature/route-types";
import {
  CaptionRendererType,
  RawCaptionData,
  VideoPlayerPreferences,
  VideoSource,
} from "@/common/feature/video/types";
import {
  CaptionRenderer,
  CaptionRendererHandle,
} from "@/extension/content/containers/caption-renderer";
import { OctopusRenderer } from "@/extension/content/containers/octopus-renderer";
import { useRerenderOnResize, useSSRMediaQuery, useStateRef } from "@/hooks";
import { isAss } from "@/common/caption-utils";
import { styledNoPass } from "@/common/style-utils";
import { videoSourceToProcessorMap } from "@/common/feature/video/utils";
import { CHROME_DOWNLOAD_URL, FIREFOX_DOWNLOAD_URL } from "@/common/constants";
import chromeLogo from "@/assets/images/chrome-web-store-badge.png";
import firefoxLogo from "@/assets/images/firefox-get-the-addon-badge.png";
import { Badges } from "@/common/components/badges";
import { DEVICE } from "@/common/style-constants";
import { isClient, isServer } from "@/common/client-utils";
import { WSText } from "@/common/components/ws-text";
import { CaptionControl } from "@/common/feature/video/components/caption-control";
import { colors } from "@/common/colors";
import { Trans, useTranslation } from "next-i18next";
import { YoutubeViewer } from "./container/youtube-viewer";
import { VimeoViewer } from "./container/vimeo-viewer";
import { DailymotionViewer } from "./container/dailymotion-viewer";
import { useRouter } from "next/router";

const { Title, Text, Link } = Typography;

const TAB_ID = 0;
const NEKOCAP_EMBED_CLASSNAME = "nekocap-embed";

const MAX_HEIGHT = 600;

const Wrapper = styled.div`
  padding: 0px;
  &.${NEKOCAP_EMBED_CLASSNAME} > .fullscreen {
    height: 100%;
  }
`;

const FullScreenWrapper = styled.div`
  display: flex;
  flex-direction: column;
  .fullscreen-enabled &,
  .${NEKOCAP_EMBED_CLASSNAME} & {
    height: 100%;
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
    :not(.fullscreen-enabled) & {
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

const DetailsWrapper = styledNoPass<{ width?: number }>(
  "div",
  "DetailsWrapper",
)`
    ${({ width }) => (width !== undefined ? `width: ${width}px` : "")};
    margin-left: auto;
    margin-right: auto;
    padding-left: 20px;
    padding-right: 20px;

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

const FullScreenButton = styled.div`
  padding: 0px 20px;
  color: ${colors.white};
`;

export type ViewerPageProps = {
  captionId: string;
  hasRawCaption?: boolean;
  isEmbed: boolean;
};

function videoPreferencesReducer(
  state: VideoPlayerPreferences,
  action: ReturnType<typeof setPlayerFontSizeMultiplier>,
): VideoPlayerPreferences {
  switch (action.type) {
    case setPlayerFontSizeMultiplier.type:
      return {
        ...state,
        fontSizeMultiplier: action.payload.multiplier,
      };
  }
  return state;
}

export const ViewerPage = ({
  hasRawCaption = undefined,
  captionId,
  isEmbed,
}: ViewerPageProps): JSX.Element => {
  const router = useRouter();
  const dispatch = useDispatch();
  const tabData = useSelector(tabVideoDataSelector(TAB_ID));
  const [loadComplete, setLoadComplete] = useState(false);
  const [rawCaption, setRawCaption] = useState<RawCaptionData | undefined>(
    undefined,
  );
  const [captionContainerElement, captionContainerElementRef] =
    useStateRef<HTMLDivElement>(undefined);
  const defaultRendererRef = useRef<CaptionRendererHandle>(null);
  const currentTimeGetter = useRef<() => number>();
  const isCaptionLoading = useSelector(
    loadWebsiteViewerCaption.isLoading(TAB_ID),
  );
  const isLoading = router.isFallback || isCaptionLoading;
  const fontList = useSelector(fontListSelector());
  const youtubePlayerRef = useRef<YouTubePlayer>();
  const fullScreenHandle = useFullScreenHandle();
  const isDesktop = useSSRMediaQuery({ query: DEVICE.desktop });
  const [videoPlayerPreferences, dispatchVideoPreference] = useReducer<
    typeof videoPreferencesReducer
  >(videoPreferencesReducer, {
    fontSizeMultiplier: 1,
  });
  useRerenderOnResize(captionContainerElement);
  useEffect(
    function downloadRawCaption() {
      // This is a website, no tabId is required
      window.tabId = TAB_ID;
      if (loadComplete || tabData?.caption?.id === undefined) {
        return;
      }
      if (hasRawCaption === false) {
        setLoadComplete(true);
        return;
      }
      // We'll download the raw caption here as some raws are too large to be transferred
      // thru redux by hydration
      if (tabData?.caption?.id !== undefined) {
        dispatch(
          loadServerCaption.request({
            tabId: TAB_ID,
            captionId: tabData.caption.id,
          }),
        );
        setLoadComplete(true);
      }
    },
    [dispatch, hasRawCaption, loadComplete, tabData?.caption?.id],
  );
  useEffect(() => {
    if (rawCaption || !globalThis.rawCaption) {
      return;
    }
    const savedRawCaption = globalThis.rawCaption;
    delete globalThis.rawCaption;
    setRawCaption(savedRawCaption);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawCaption, globalThis.rawCaption, tabData?.isLoadingRawCaption]);
  const handleFontsLoaded = useCallback(
    (progress: number) => {
      if (progress < 1) {
        dispatch(
          setIsLoadingRawCaption({
            loading: true,
            percentage: progress * 100,
            tabId: TAB_ID,
          }),
        );
      } else {
        dispatch(setIsLoadingRawCaption({ loading: false, tabId: TAB_ID }));
      }
    },
    [dispatch],
  );

  const { t } = useTranslation("common");

  const noData =
    loadComplete && (!tabData || (!tabData.caption && !rawCaption));

  const renderNoDataMessage = () => {
    if (!noData) {
      return;
    }
    return (
      <div>
        <Title>{t("viewer.failedToFindCaption")}</Title>
        <Title level={2}>
          <Link href={routeNames.caption.browse}>
            {t("viewer.browseOtherCaptions")}
          </Link>
        </Title>
      </div>
    );
  };

  const { caption, videoDimensions, renderer } = tabData || {};

  const getCurrentTime = useCallback((): number => {
    if (currentTimeGetter.current) {
      return currentTimeGetter.current();
    }
    return 0;
  }, []);

  const handleClickCopyEmbedLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.append("embed", "true");
    if (navigator && navigator.clipboard) {
      navigator.clipboard.writeText(
        `<iframe src="${url.toString()}" allowfullscreen="true" width="560" height="340" frameborder="0"></iframe>`,
      );
    }
    message.success(t("viewer.copyEmbedCodeSuccess"));
  };

  const embedWidth = Math.min((isClient() ? window.innerWidth : 0) - 60, 1600);
  const embedHeight = isEmbed
    ? isClient()
      ? window.innerHeight
      : 0
    : Math.min((9 / 16) * embedWidth, MAX_HEIGHT);

  const renderYoutubeVideo = () => {
    return (
      <YoutubeViewer
        embedHeight={embedHeight}
        embedWidth={embedWidth}
        caption={caption}
        defaultRendererRef={defaultRendererRef}
        youtubePlayerRef={youtubePlayerRef}
        currentTimeGetter={currentTimeGetter}
      />
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
    if (caption.videoSource === VideoSource.Youtube) {
      return renderYoutubeVideo();
    } else if (caption.videoSource === VideoSource.Vimeo) {
      return renderVimeoVideo();
    } else if (caption.videoSource === VideoSource.Dailymotion) {
      return renderDailymotionVideo();
    }
    return;
  };

  const isLandscape = isClient()
    ? window.innerWidth > window.innerHeight
    : true;
  let iframeWidth = 0;
  let iframeHeight = 0;
  if (isLandscape) {
    const currentEmbedHeight =
      (fullScreenHandle.active
        ? captionContainerElement?.offsetHeight
        : embedHeight) || 0;
    iframeWidth = Math.ceil(
      videoDimensions
        ? (videoDimensions.width * currentEmbedHeight) / videoDimensions.height
        : 0,
    );
    iframeHeight = currentEmbedHeight;
  } else {
    const currentEmbedWidth = fullScreenHandle.active
      ? window.innerWidth
      : embedWidth;
    iframeHeight = Math.ceil(
      videoDimensions
        ? (videoDimensions.height * currentEmbedWidth) / videoDimensions.width
        : 0,
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
  const processor = caption
    ? videoSourceToProcessorMap[caption.videoSource]
    : undefined;

  const handleSetFontSizeMultiplier = (multiplier: number) => {
    dispatchVideoPreference(
      setPlayerFontSizeMultiplier({ multiplier, tabId: globalThis.tabId }),
    );
  };

  const toggleFullScreen = () => {
    if (fullScreenHandle.active) {
      fullScreenHandle.exit();
    } else {
      fullScreenHandle.enter();
    }
  };

  const fullScreenButton = (
    <FullScreenButton onClick={toggleFullScreen}>
      <FullscreenOutlined />
    </FullScreenButton>
  );

  return (
    <Wrapper
      style={{
        height: isEmbed ? "100%" : undefined,
      }}
      className={isEmbed ? NEKOCAP_EMBED_CLASSNAME : ""}
    >
      <Skeleton active={true} loading={isLoading}>
        {renderNoDataMessage()}
        <FullScreen handle={fullScreenHandle}>
          <FullScreenWrapper>
            <VideoWrapper ref={captionContainerElementRef}>
              {renderVideo()}
            </VideoWrapper>
            <CaptionControl
              preferences={videoPlayerPreferences}
              setFontSizeMultiplier={handleSetFontSizeMultiplier}
              rightContainer={fullScreenButton}
              fullScreen={fullScreenHandle.active || isEmbed}
              isLoadingFont={!!tabData?.isLoadingRawCaption}
              fontLoadingProgess={tabData?.rawLoadPercentage || 0}
            />
          </FullScreenWrapper>
        </FullScreen>
        {caption && !isEmbed && (
          <DetailsWrapper>
            <ViewerTitle>
              <span dir="auto">{caption.originalTitle}</span>
            </ViewerTitle>
            <TranslatedTitle level={2}>
              <span dir="auto">{caption.translatedTitle}</span>{" "}
              <Tooltip title={t("viewer.copyEmbedCode")}>
                <Link onClick={handleClickCopyEmbedLink}>
                  <FontAwesomeIcon icon={faCode} style={{ maxWidth: "38px" }} />
                </Link>
              </Tooltip>
            </TranslatedTitle>
            <CaptionerMessage>
              <Trans
                i18nKey={"viewer.captionSubmittedBy"}
                components={{
                  captioner: (
                    <Link
                      href={routeNames.profile.main.replace(
                        ":id",
                        caption.creator || "",
                      )}
                    ></Link>
                  ),
                }}
                values={{ creatorName: caption.creatorName }}
              ></Trans>
            </CaptionerMessage>
            <ExtensionMessage>
              <WSText>
                {t("viewer.downloadNekocapMessage", {
                  site: processor ? processor.name : "YouTube",
                })}
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
            preferences={videoPlayerPreferences}
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
            onFontsLoaded={handleFontsLoaded}
          />
        )}
      </Skeleton>
    </Wrapper>
  );
};
