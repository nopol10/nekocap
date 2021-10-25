import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import {
  isUserCaptionLoadedSelector,
  tabEditorDataSelector,
  tabEditorRawDataSelector,
} from "@/common/feature/caption-editor/selectors";
import { tabVideoDataSelector } from "@/common/feature/video/selectors";
import { CaptionRendererType } from "@/common/feature/video/types";
import { colors } from "@/common/colors";
import { CaptionRenderer } from "./caption-renderer";
import { VideoPageMenu } from "./video-page-menu";
import { OctopusRenderer } from "./octopus-renderer";
import styled, { css } from "styled-components";
import { NekoLogo } from "@/common/components/neko-logo";
import ReactDOM from "react-dom";
import { VIDEO_ELEMENT_CONTAINER_ID } from "@/common/constants";
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

const InlineVideoPageMenu = () => {
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
        <InlineNekoFace src={getImageLink(nekoFace)} />
      </Popover>
    </>
  );
};

export const VideoHome = () => {
  const videoData = useSelector(tabVideoDataSelector(window.tabId));
  const editorData = useSelector(tabEditorDataSelector(window.tabId));
  const rawEditorData = useSelector(tabEditorRawDataSelector(window.tabId));
  const isUserCaptionLoaded = useSelector(
    isUserCaptionLoadedSelector(window.tabId)
  );
  const shouldHideVideoPageMenu = useSelector(
    shouldHideVideoPageMenuSelector(window.tabId)
  );
  const { renderer, showCaption = true } = videoData || {};
  const caption =
    isUserCaptionLoaded && editorData && editorData.caption
      ? editorData.caption
      : videoData?.caption;
  const rawCaption =
    isUserCaptionLoaded && rawEditorData && rawEditorData.rawCaption?.data
      ? rawEditorData.rawCaption.data
      : videoData?.rawCaption?.data;
  const rawType =
    isUserCaptionLoaded && rawEditorData && rawEditorData.rawCaption?.type
      ? rawEditorData.rawCaption.type
      : videoData?.rawCaption?.type;

  useCaptionContainerUpdate([caption]);
  useVideoElementUpdate([]);
  const menuUpdateToken = useMenuUIElementUpdate([]);

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
        window.selectedProcessor.observeChanges &&
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
      const videoUIElement = document.getElementById(
        VIDEO_ELEMENT_CONTAINER_ID
      );
      if (!videoUIElement) {
        return;
      }
      videoUIElement.style.display = "";
      let insertPosition: InsertPosition = "afterend";
      switch (window.selectedProcessor.inlineMenu?.insertPosition) {
        case "before":
          insertPosition = "beforebegin";
          break;
        default:
          insertPosition = "afterend";
      }
      extensionUIElement.insertAdjacentElement(insertPosition, videoUIElement);
    })();
    return () => {
      // Move the video ui container back to the body
      const videoUIElement = document.getElementById(
        VIDEO_ELEMENT_CONTAINER_ID
      );
      if (videoUIElement) {
        videoUIElement.style.display = "none";
        document.body.appendChild(videoUIElement);
      }
    };
  }, [menuUpdateToken]);

  const isUsingAdvancedRenderer =
    renderer === CaptionRendererType.AdvancedOctopus && isAss(rawType);
  const shouldRenderEditor =
    !isUsingAdvancedRenderer ||
    (isUsingAdvancedRenderer && caption?.data?.tracks?.length > 0);
  const isInlineMenu = !!window.selectedProcessor.inlineMenu;
  return ReactDOM.createPortal(
    <>
      {!shouldHideVideoPageMenu && (
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
        />
      )}
    </>,
    document.getElementById(VIDEO_ELEMENT_CONTAINER_ID)
  );
};
