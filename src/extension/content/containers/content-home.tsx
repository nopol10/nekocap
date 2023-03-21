import React, { ReactElement } from "react";
import { useSelector } from "react-redux";
import { tabVideoDataSelector } from "@/common/feature/video/selectors";
import { PageType } from "@/common/feature/video/types";
import { VideoHome } from "./video-home";
import { createGlobalStyle } from "styled-components";
import { VideoIframe } from "./video-iframe";

export const ContentHome = (): ReactElement => {
  const videoData = useSelector(tabVideoDataSelector(window.tabId));

  const hasGlobalStyles =
    window.selectedProcessor && window.selectedProcessor.globalStyles;
  const GlobalStyle = hasGlobalStyles
    ? createGlobalStyle`
    ${window.selectedProcessor && window.selectedProcessor.globalStyles}
  `
    : () => <></>;

  if (!videoData) {
    return <></>;
  }
  const pageType = window.selectedProcessor?.getPageType(location.href);
  return (
    <>
      {hasGlobalStyles && <GlobalStyle />}
      {pageType === PageType.Video && <VideoHome />}
      {pageType === PageType.VideoIframe && <VideoIframe />}
    </>
  );
};
