import React, { ReactElement } from "react";
import { useSelector } from "react-redux";
import { tabVideoDataSelector } from "@/common/feature/video/selectors";
import { PageType } from "@/common/feature/video/types";
import { VideoHome } from "./video-home";
import { createGlobalStyle } from "styled-components";
import { VideoIframe } from "./video-iframe";

export const ContentHome = (): ReactElement => {
  const videoData = useSelector(tabVideoDataSelector(globalThis.tabId));

  const hasGlobalStyles =
    globalThis.selectedProcessor && globalThis.selectedProcessor.globalStyles;
  const GlobalStyle = hasGlobalStyles
    ? createGlobalStyle`
    ${globalThis.selectedProcessor && globalThis.selectedProcessor.globalStyles}
  `
    : () => <></>;

  if (!videoData) {
    return <></>;
  }
  const pageType = globalThis.selectedProcessor?.getPageType(location.href);
  return (
    <>
      {hasGlobalStyles && <GlobalStyle />}
      {pageType === PageType.Video && <VideoHome />}
      {pageType === PageType.VideoIframe && <VideoIframe />}
    </>
  );
};
