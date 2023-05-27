import React, { useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled, { css } from "styled-components";
import ReactDOM from "react-dom";
import { ErrorBoundary } from "react-error-boundary";
import {
  isUserCaptionLoadedSelector,
  tabEditorDataSelector,
  tabEditorRawDataSelector,
} from "@/common/feature/caption-editor/selectors";
import {
  fontListSelector,
  tabVideoDataSelector,
} from "@/common/feature/video/selectors";
import { CaptionRendererType } from "@/common/feature/video/types";
import { colors } from "@/common/colors";
import { CaptionRenderer, CaptionRendererHandle } from "./caption-renderer";
import { VideoPageMenu } from "./video-page-menu";
import { OctopusRenderer } from "./octopus-renderer";
import { NekoLogo } from "@/common/components/neko-logo";
import {
  IN_PAGE_MENU_CONTAINER_ID,
  VIDEO_ELEMENT_CONTAINER_ID,
} from "@/common/constants";
import {
  getUIElement,
  getVideoTitle,
  isInaccurateTitle,
} from "../processors/processor";
import {
  useCaptionContainerUpdate,
  useMenuUIElementUpdate,
  useVideoElementUpdate,
} from "@/hooks";
import { EditorContainer } from "./editor-container";
import { shouldHideVideoPageMenuSelector } from "@/extension/background/feature/user-extension-preference/selectors";
import { darkModeSelector } from "@/common/processor-utils";
import { isAss } from "@/common/caption-utils";
import nekoFace from "@/assets/images/neko-face-dark.svg";
import { Popover } from "antd";
import { getImageLink } from "@/common/chrome-utils";
import { styledNoPass } from "@/common/style-utils";
import {
  requestFreshTabData,
  setIsLoadingRawCaption,
} from "@/common/feature/video/actions";
import { refreshVideoMeta } from "../utils";
import { useIframeVideoUpdate } from "../hooks/use-iframe-video-update";

type InlineMenuWrapperProps = {
  isInline: boolean;
};

const InlineMenuWrapper = styledNoPass<InlineMenuWrapperProps, "div">(
  "div",
  "InlineMenuWrapper"
)`
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  margin-top: ${({ isInline }: InlineMenuWrapperProps) =>
    isInline ? "0" : "5px"};
  padding: ${({ isInline }: InlineMenuWrapperProps) =>
    isInline ? "0" : "5px"};
  border: ${({ isInline }: InlineMenuWrapperProps) =>
    isInline ? "none" : `1px solid ${colors.divider}`};
  background-color: ${({ isInline }: InlineMenuWrapperProps) =>
    isInline ? "transparent" : colors.white + "59"};
  & > div:first-child {
    margin-right: auto;
  }
  ${darkModeSelector(
    css`
      background-color: transparent;
    `
  )}
`;

const InlineLogoWrapper = styled.div`
  width: 100px;
`;

const InlineNekoFace = styled.img`
  width: 38px;
  height: 38px;
  transition: transform 150ms ease-in-out;
  transform: scale(1);
  &:hover {
    transform: scale(1.3);
  }
`;

const RawLoadingIndicator = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.4);
  border-radius: 6px;
  backdrop-filter: blur(8px);
  font-size: 10px;
  color: black;
  font-weight: 700;
`;

const InPageMenuContainer = () => {
  const isInlineMenu = !!globalThis.selectedProcessor?.inlineMenu;
  const inPageMenuContainer = document.getElementById(
    IN_PAGE_MENU_CONTAINER_ID
  );
  if (!inPageMenuContainer) {
    return <></>;
  }
  return ReactDOM.createPortal(
    <>
      {
        <InlineMenuWrapper
          className="scoped-antd use-site-dark-mode"
          isInline={isInlineMenu}
        >
          {isInlineMenu && <InlineVideoPageMenu />}
          {!isInlineMenu && (
            <>
              <VideoPageMenu />
              <InlineLogoWrapper>
                <NekoLogo />
              </InlineLogoWrapper>
            </>
          )}
        </InlineMenuWrapper>
      }
    </>,
    inPageMenuContainer
  );
};

const InlineVideoPageMenu = () => {
  const videoData = useSelector(tabVideoDataSelector(globalThis.tabId));
  if (!videoData) {
    return <></>;
  }
  const isLoading = videoData.isLoadingRawCaption;
  const loadingPercentage = `${(videoData.rawLoadPercentage || 0).toFixed(0)}%`;
  return (
    <>
      <Popover
        placement={"top"}
        content={
          <div>
            <VideoPageMenu />
          </div>
        }
      >
        <div style={{ position: "relative" }}>
          <InlineNekoFace
            style={{ opacity: isLoading ? 0.7 : 1 }}
            src={getImageLink(nekoFace)}
          />
          {isLoading && (
            <RawLoadingIndicator>{loadingPercentage}</RawLoadingIndicator>
          )}
        </div>
      </Popover>
    </>
  );
};

export const VideoHome = () => {
  const dispatch = useDispatch();
  const videoData = useSelector(tabVideoDataSelector(globalThis.tabId));
  const editorData = useSelector(tabEditorDataSelector(globalThis.tabId));
  const rawEditorData = useSelector(tabEditorRawDataSelector(globalThis.tabId));
  const isUserCaptionLoaded = useSelector(
    isUserCaptionLoadedSelector(globalThis.tabId)
  );
  const shouldHideVideoPageMenu = useSelector(
    shouldHideVideoPageMenuSelector(globalThis.tabId)
  );
  const fontList = useSelector(fontListSelector());
  const handleFontsLoaded = useCallback(
    (progress: number) => {
      if (progress < 1) {
        dispatch(
          setIsLoadingRawCaption({
            loading: true,
            percentage: progress * 100,
            tabId: globalThis.tabId,
          })
        );
      } else {
        dispatch(
          setIsLoadingRawCaption({ loading: false, tabId: globalThis.tabId })
        );
      }
    },
    [dispatch]
  );

  const { renderer, showCaption = true } = videoData || {};
  const caption =
    isUserCaptionLoaded && editorData && editorData.caption
      ? editorData.caption
      : videoData?.caption;
  const rawCaption =
    isUserCaptionLoaded && rawEditorData
      ? rawEditorData.data
      : globalThis.rawCaption?.data;
  const rawType =
    isUserCaptionLoaded && rawEditorData
      ? rawEditorData.type
      : globalThis.rawCaption?.type;

  useCaptionContainerUpdate([caption]);
  useVideoElementUpdate([]);
  const requestFreshTabDataCallback = useCallback(async () => {
    if (
      globalThis.selectedProcessor?.observer &&
      (!globalThis.selectedProcessor.observer.shouldObserveMenuPlaceability ||
        !globalThis.selectedProcessor.observer.refreshTabDataAfterElementUpdate)
    ) {
      return;
    }
    await refreshVideoMeta();
    dispatch(
      requestFreshTabData({
        tabId: globalThis.tabId,
        newVideoId: globalThis.videoId,
        newVideoSource: globalThis.videoSource,
        newPageType: globalThis.pageType,
        currentUrl: location.href,
      })
    );
  }, [dispatch]);
  const { menuUpdateToken, videoMetaUpdateToken } = useMenuUIElementUpdate([]);

  useEffect(() => {
    requestFreshTabDataCallback();
  }, [videoMetaUpdateToken, requestFreshTabDataCallback]);
  const rendererRef = useRef<CaptionRendererHandle>(null);

  const { getIframeVideoTime } = useIframeVideoUpdate({
    rendererRef,
  });

  /**
   * Effect for moving the video element to the editor and back
   */

  useEffect(() => {
    // Move the element to the correct spot
    (async () => {
      if (!globalThis.selectedProcessor) {
        return;
      }
      if (globalThis.selectedProcessor.waitUntilPageIsReady) {
        await globalThis.selectedProcessor.waitUntilPageIsReady();
      }
      if (
        globalThis.selectedProcessor.observer &&
        globalThis.selectedProcessor.observer.shouldObserveMenuPlaceability &&
        globalThis.videoName &&
        isInaccurateTitle(globalThis.videoName, globalThis.selectedProcessor)
      ) {
        globalThis.videoName = await getVideoTitle(
          globalThis.selectedProcessor
        );
      }
      const extensionUIElement: HTMLElement | undefined = await getUIElement(
        globalThis.selectedProcessor
      );
      if (!extensionUIElement) {
        return;
      }
      const menuUIElement = document.getElementById(IN_PAGE_MENU_CONTAINER_ID);
      if (!menuUIElement) {
        return;
      }
      menuUIElement.style.display = "";
      let insertPosition: InsertPosition = "afterend";
      switch (globalThis.selectedProcessor.inlineMenu?.insertPosition) {
        case "before":
          insertPosition = "beforebegin";
          break;
        default:
          insertPosition = "afterend";
      }
      extensionUIElement.insertAdjacentElement(insertPosition, menuUIElement);
    })();
    return () => {
      // Move the video ui container back to the body
      const menuUIElement = document.getElementById(IN_PAGE_MENU_CONTAINER_ID);
      if (menuUIElement) {
        menuUIElement.style.display = "none";
        document.body.appendChild(menuUIElement);
      }
    };
  }, [menuUpdateToken]);

  const isUsingAdvancedRenderer =
    renderer === CaptionRendererType.AdvancedOctopus && isAss(rawType);
  const captionTrackCount = caption?.data?.tracks?.length || 0;
  const shouldRenderEditor =
    !globalThis.selectedProcessor?.disableEditor &&
    (!isUsingAdvancedRenderer ||
      (isUsingAdvancedRenderer && captionTrackCount > 0));

  // Special handling for sites with videos inside iframes
  const iframeProps = globalThis.selectedProcessor?.videoIsInIframe
    ? {
        height: globalThis.videoElement
          ? globalThis.videoElement.offsetHeight
          : 0,
        width: globalThis.videoElement
          ? globalThis.videoElement.offsetWidth
          : 0,
        getCurrentTime: getIframeVideoTime,
      }
    : undefined;
  const videoElement = globalThis.selectedProcessor?.videoIsInIframe
    ? undefined
    : globalThis.videoElement;
  const videoContainerElement = document.getElementById(
    VIDEO_ELEMENT_CONTAINER_ID
  );
  if (!videoContainerElement) {
    return <></>;
  }
  return ReactDOM.createPortal(
    <>
      {!shouldHideVideoPageMenu && (
        <ErrorBoundary FallbackComponent={() => <></>}>
          <InPageMenuContainer />
        </ErrorBoundary>
      )}
      {shouldRenderEditor && <EditorContainer />}
      {renderer === CaptionRendererType.Default && (
        <CaptionRenderer
          ref={rendererRef}
          caption={caption}
          videoElement={videoElement}
          captionContainerElement={globalThis.captionContainerElement}
          showCaption={showCaption}
          isIframe={globalThis.selectedProcessor?.videoIsInIframe}
          iframeProps={iframeProps}
        />
      )}
      {isUsingAdvancedRenderer && (
        <OctopusRenderer
          ref={rendererRef}
          rawCaption={rawCaption}
          videoElement={videoElement}
          captionContainerElement={globalThis.captionContainerElement}
          showCaption={showCaption}
          fontList={fontList}
          onFontsLoaded={handleFontsLoaded}
          isIframe={globalThis.selectedProcessor?.videoIsInIframe}
          iframeProps={iframeProps}
        />
      )}
    </>,
    videoContainerElement
  );
};
