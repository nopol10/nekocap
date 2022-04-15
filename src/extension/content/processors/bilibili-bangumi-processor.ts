import { PageType, VideoSource } from "@/common/feature/video/types";
import type { Dimension } from "@/common/types";
import { waitForElement } from "@/common/utils";
import { Processor, retrieveVideoDimensions } from "./processor";

const videoMatchingRegex = /(http:|https:|)\/\/(?:www.)?(bilibili.com)\/bangumi\/([A-Za-z0-9._%-/]*)(&\S+)?/;
/**
 * Processor for Bilibili Bangumi
 */
export const BilibiliBangumiProcessor: Processor = {
  type: VideoSource.BilibiliBangumi,
  name: "bilibili (bangumi)",
  urlRegex: /bilibili\.com\/bangumi/,
  videoSelector: ".bpx-player-video-wrap video, .bilibili-player-video video",
  videoPageUISelector: ".player-module",
  titleSelector: ".bpx-player-top-title div, .bilibili-player-video-top-title",
  editorVideoPlayerStyles: `
  .bilibili-player-video, .bpx-player-video-wrap {
    position: relative;
    width: 100%;
    height: 100%;

    video {
      position: relative;
      width: 100% !important;
      height: auto !important;
      transform: translateY(-50%);
      top: 50% !important;
      left: 0 !important;
    }
  }
  `,
  globalStyles: `
    .bilibili-player-video .libassjs-canvas-parent {
      position: static !important;
    }
  `,
  supportAutoCaptions: () => false,
  getVideoId: () => {
    const matches = window.location.href.match(videoMatchingRegex);
    return matches[3];
  },
  generateVideoLink: (videoId: string) => {
    return `https://www.bilibili.com/bangumi/${videoId}`;
  },
  generateThumbnailLink: async function (videoId: string) {
    return "";
  },
  retrieveVideoDimensions: async function (
    videoId: string
  ): Promise<Dimension> {
    return await retrieveVideoDimensions(videoId, this);
  },
  onEditorOpen: () => {
    /* no content */
  },
  onEditorClose: () => {
    /* no content */
  },
  getPageType: (url: string) => {
    if (url.match(videoMatchingRegex)) {
      return PageType.Video;
    }
    return PageType.SearchResults;
  },
  waitUntilPageIsReady: async () => {
    // Bilibili refreshes the page content shortly after the initial load so any
    // ui elements added to the body will be removed. We have to wait for the load
    // to finish before adding stuff in
    await waitForElement(
      ".bpx-player-dm-wrap, .bilibili-player-video-inputbar-wrap"
    );
    // Some framework called Jinkela might be used. We need to wait for it to complete loading before we can add NekoCap to the page.
    // Otherwise it will remove the entire video container
    if (document.querySelectorAll(`script[src*="jinkela"]`).length > 0) {
      await waitForElement(`iframe[src*="jinkela"]`);
    }
    return;
  },
};
