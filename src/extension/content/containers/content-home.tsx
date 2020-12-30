import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { tabVideoDataSelector } from "@/common/feature/video/selectors";
import { PageType } from "@/common/feature/video/types";
import { VideoHome } from "./video-home";
import { createGlobalStyle } from "styled-components";

export const ContentHome = () => {
  const videoData = useSelector(tabVideoDataSelector(window.tabId));

  const hasGlobalStyles =
    window.selectedProcessor && window.selectedProcessor.globalStyles;
  const GlobalStyle = hasGlobalStyles
    ? createGlobalStyle`
    ${window.selectedProcessor && window.selectedProcessor.globalStyles}
  `
    : null;

  if (!videoData) {
    return null;
  }
  const { pageType } = videoData;

  return (
    <>
      {hasGlobalStyles && <GlobalStyle />}
      {pageType === PageType.Video && <VideoHome />}
    </>
  );
};
