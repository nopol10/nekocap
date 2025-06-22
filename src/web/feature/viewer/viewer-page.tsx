import FullscreenOutlined from "@ant-design/icons/FullscreenOutlined";
import UserOutlined from "@ant-design/icons/UserOutlined";
import { faCode } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Card,
  Col,
  message,
  Row,
  Skeleton,
  Space,
  Tooltip,
  Typography,
} from "antd";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { FullScreen, useFullScreenHandle } from "react-full-screen";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import type { YouTubePlayer } from "youtube-player/dist/types";
// import "antd/lib/slider/style";
import chromeLogo from "@/assets/images/chrome-web-store-badge.png";
import firefoxLogo from "@/assets/images/firefox-get-the-addon-badge.png";
import { isAss } from "@/common/caption-utils";
import { isClient } from "@/common/client-utils";
import { colors } from "@/common/colors";
import { Badges } from "@/common/components/badges";
import { WSText } from "@/common/components/ws-text";
import { CHROME_DOWNLOAD_URL, FIREFOX_DOWNLOAD_URL } from "@/common/constants";
import {
  loadServerCaption,
  loadWebsiteViewerCaption,
  setIsLoadingRawCaption,
  setPlayerFontSizeMultiplier,
} from "@/common/feature/video/actions";
import { CaptionControl } from "@/common/feature/video/components/caption-control";
import {
  fontListSelector,
  tabVideoDataSelector,
} from "@/common/feature/video/selectors";
import {
  CaptionRendererType,
  RawCaptionData,
  VideoPlayerPreferences,
} from "@/common/feature/video/types";
import { videoSourceToProcessorMap } from "@/common/feature/video/utils";
import { DEVICE } from "@/common/style-constants";
import { CaptionRendererHandle } from "@/extension/content/containers/caption-renderer";
import { useRerenderOnResize, useSSRMediaQuery, useStateRef } from "@/hooks";
import { routeNames } from "@/web/feature/route-types";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { Viewer } from "./viewer";

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

const DetailsWrapper = styled.div<{ $width?: number }>`
  margin-block: 16px;
  ${({ $width: width }) => (width !== undefined ? `width: ${width}px` : "")};
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

const ViewerTitle = styled.div`
  margin-bottom: 8px;
`;

const TranslatedTitle = styled.span`
  white-space: break-spaces;
`;

const CaptionerMessage = styled(Text)`
  margin-top: 0.3em;
  font-size: 1em;
  @media ${DEVICE.mobileOnly} {
    font-size: 1em;
  }
`;

const ExtensionMessage = styled.div`
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
      globalThis.tabId = TAB_ID;
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
        ).then(() => {
          console.log("Raw caption loaded");
          setLoadComplete(true);
        });
      }
    },
    [dispatch, hasRawCaption, loadComplete, tabData?.caption?.id],
  );
  useEffect(() => {
    if (rawCaption || !globalThis.rawCaption || !loadComplete) {
      return;
    }
    const savedRawCaption = globalThis.rawCaption;
    setRawCaption(savedRawCaption);
    delete globalThis.rawCaption;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    rawCaption,
    globalThis.rawCaption,
    tabData?.isLoadingRawCaption,
    loadComplete,
  ]);
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
    const url = new URL(globalThis.location.href);
    url.searchParams.append("embed", "true");
    if (navigator && navigator.clipboard) {
      navigator.clipboard.writeText(
        `<iframe src="${url.toString()}" allowfullscreen="true" width="560" height="340" frameborder="0"></iframe>`,
      );
    }
    message.success(t("viewer.copyEmbedCodeSuccess"));
  };

  const embedWidth = Math.min(
    (isClient() ? globalThis.innerWidth : 0) - 60,
    1600,
  );
  const embedHeight = isEmbed
    ? isClient()
      ? globalThis.innerHeight
      : 0
    : Math.min((9 / 16) * embedWidth, MAX_HEIGHT);

  const isLandscape = isClient()
    ? globalThis.innerWidth > globalThis.innerHeight
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
      ? globalThis.innerWidth
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
    left: 0,
    top: 0,
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
            <Viewer
              videoDimensions={videoDimensions}
              renderer={renderer}
              caption={caption}
              fontList={fontList}
              rawCaption={rawCaption}
              videoPlayerPreferences={videoPlayerPreferences}
            />
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
            <Row gutter={[16, 16]}>
              <Col md={16}>
                <Card
                  title={
                    <TranslatedTitle>
                      <span dir="auto">{caption.translatedTitle}</span>{" "}
                      <Tooltip title={t("viewer.copyEmbedCode")}>
                        <Link onClick={handleClickCopyEmbedLink}>
                          <FontAwesomeIcon
                            icon={faCode}
                            style={{ maxWidth: "38px" }}
                          />
                        </Link>
                      </Tooltip>
                    </TranslatedTitle>
                  }
                  style={{ height: "100%" }}
                >
                  <ViewerTitle>
                    <span dir="auto">{caption.originalTitle}</span>
                  </ViewerTitle>
                  <CaptionerMessage>
                    <UserOutlined />{" "}
                    <Link
                      href={routeNames.profile.main.replace(
                        ":id",
                        caption.creator || "",
                      )}
                    >
                      {caption.creatorName}
                    </Link>
                  </CaptionerMessage>
                </Card>
              </Col>
              <Col md={8}>
                <Card>
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
                </Card>
              </Col>
            </Row>
          </DetailsWrapper>
        )}
      </Skeleton>
    </Wrapper>
  );
};
