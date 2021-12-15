import React, { useCallback, useEffect } from "react";
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
import { CaptionRenderer } from "./caption-renderer";
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

type InlineMenuWrapperProps = {
  isInline: boolean;
};

const InlineMenuWrapper = styledNoPass<InlineMenuWrapperProps, "div">("div")`
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
  const isInlineMenu = !!window.selectedProcessor.inlineMenu;
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
    document.getElementById(IN_PAGE_MENU_CONTAINER_ID)
  );
};

const InlineVideoPageMenu = () => {
  const videoData = useSelector(tabVideoDataSelector(window.tabId));
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
  const videoData = useSelector(tabVideoDataSelector(window.tabId));
  const editorData = useSelector(tabEditorDataSelector(window.tabId));
  const rawEditorData = useSelector(tabEditorRawDataSelector(window.tabId));
  const isUserCaptionLoaded = useSelector(
    isUserCaptionLoadedSelector(window.tabId)
  );
  const shouldHideVideoPageMenu = useSelector(
    shouldHideVideoPageMenuSelector(window.tabId)
  );
  const fontList = useSelector(fontListSelector());
  const handleFontsLoaded = useCallback(
    (progress: number) => {
      if (progress < 1) {
        dispatch(
          setIsLoadingRawCaption({
            loading: true,
            percentage: progress * 100,
            tabId: window.tabId,
          })
        );
      } else {
        dispatch(
          setIsLoadingRawCaption({ loading: false, tabId: window.tabId })
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
      : window.rawCaption?.data;
  const rawType =
    isUserCaptionLoaded && rawEditorData
      ? rawEditorData.type
      : window.rawCaption?.type;

  useCaptionContainerUpdate([caption]);
  useVideoElementUpdate([]);
  const requestFreshTabDataCallback = useCallback(async () => {
    if (
      !window.selectedProcessor.observer ||
      !window.selectedProcessor.observer.shouldObserveMenuPlaceability ||
      !window.selectedProcessor.observer.refreshTabDataAfterElementUpdate
    ) {
      return;
    }
    await refreshVideoMeta();
    dispatch(
      requestFreshTabData({
        tabId: window.tabId,
        newVideoId: window.videoId,
        newVideoSource: window.videoSource,
        newPageType: window.pageType,
      })
    );
  }, []);
  const { menuUpdateToken, videoMetaUpdateToken } = useMenuUIElementUpdate([]);

  useEffect(() => {
    requestFreshTabDataCallback();
  }, [videoMetaUpdateToken, requestFreshTabDataCallback]);

  /**
   * Effect for moving the video element to the editor and back
   */

  useEffect(() => {
    // Move the element to the correct spot
    (async () => {
      if (window.selectedProcessor.waitUntilPageIsReady) {
        await window.selectedProcessor.waitUntilPageIsReady();
      }
      if (
        window.selectedProcessor.observer &&
        window.selectedProcessor.observer.shouldObserveMenuPlaceability &&
        window.videoName &&
        isInaccurateTitle(window.videoName, window.selectedProcessor)
      ) {
        window.videoName = await getVideoTitle(window.selectedProcessor);
      }
      const extensionUIElement: HTMLElement = await getUIElement(
        window.selectedProcessor
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
      switch (window.selectedProcessor.inlineMenu?.insertPosition) {
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
  const shouldRenderEditor =
    !isUsingAdvancedRenderer ||
    (isUsingAdvancedRenderer && caption?.data?.tracks?.length > 0);
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
          caption={caption}
          videoElement={window.videoElement}
          captionContainerElement={window.captionContainerElement}
          showCaption={showCaption}
        />
      )}
      {isUsingAdvancedRenderer && (
        <OctopusRenderer
          rawCaption={rawCaption}
          videoElement={window.videoElement}
          captionContainerElement={window.captionContainerElement}
          showCaption={showCaption}
          fontList={fontList}
          onFontsLoaded={handleFontsLoaded}
        />
      )}
    </>,
    document.getElementById(VIDEO_ELEMENT_CONTAINER_ID)
  );
};
