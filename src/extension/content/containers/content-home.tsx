import { tabVideoDataSelector } from "@/common/feature/video/selectors";
import { PageType } from "@/common/feature/video/types";
import { ReactElement } from "react";
import { useSelector } from "react-redux";
import { createGlobalStyle } from "styled-components";
import { VideoHome } from "./video-home";
import { VideoIframe } from "./video-iframe";

export const ContentHome = (): ReactElement => {
  const videoData = useSelector(tabVideoDataSelector(globalThis.tabId));

  const hasGlobalStyles =
    globalThis.selectedProcessor && globalThis.selectedProcessor.globalStyles;
  const GlobalStyle = createGlobalStyle`
    .nekocap-menu-container--floating {
      position: fixed;
      bottom: 64px;
      right: 84px;
      z-index: 500;
      img {
        filter: contrast(0);
      }
    }
    ${hasGlobalStyles ? globalThis.selectedProcessor?.globalStyles : ""}
  `;

  if (!videoData) {
    return <></>;
  }
  const pageType = globalThis.selectedProcessor?.getPageType(location.href);
  return (
    <>
      <GlobalStyle />
      {pageType === PageType.Video && <VideoHome />}
      {pageType === PageType.VideoIframe && <VideoIframe />}
    </>
  );
};
