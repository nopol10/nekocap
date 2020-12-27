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
import { getUIElement } from "../processors/processor";
import { useCaptionContainerUpdate, useVideoElementUpdate } from "@/hooks";
import { EditorContainer } from "./editor-container";
import { shouldHideVideoPageMenuSelector } from "@/background/feature/user-extension-preference/selectors";
import { darkModeSelector } from "@/common/processor-utils";

const InlineMenuWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  margin-top: 5px;
  padding: 5px;
  border: 1px solid ${colors.divider};
  background-color: ${colors.white}59;
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

  /**
   * Effect for moving the video element to the editor and back
   */
  useEffect(() => {
    // Move the element to the correct spot
    new Promise(async () => {
      if (window.selectedProcessor.waitUntilPageIsReady) {
        await window.selectedProcessor.waitUntilPageIsReady();
      }
      let extensionUIElement: HTMLElement = await getUIElement(
        window.selectedProcessor
      );
      if (!extensionUIElement) {
        return;
      }
      let videoUIElement = document.getElementById(VIDEO_ELEMENT_CONTAINER_ID);
      if (!videoUIElement) {
        return;
      }
      videoUIElement.style.display = "";
      extensionUIElement.insertAdjacentElement("afterend", videoUIElement);
    });
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
  }, []);

  const isUsingAdvancedRenderer =
    renderer === CaptionRendererType.AdvancedOctopus && rawType === "ass";
  const shouldRenderEditor =
    !isUsingAdvancedRenderer ||
    (isUsingAdvancedRenderer && caption?.data?.tracks?.length > 0);

  return ReactDOM.createPortal(
    <>
      {!shouldHideVideoPageMenu && (
        <InlineMenuWrapper className="scoped-antd use-site-dark-mode">
          <VideoPageMenu />
          <InlineLogoWrapper>
            <NekoLogo />
          </InlineLogoWrapper>
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
