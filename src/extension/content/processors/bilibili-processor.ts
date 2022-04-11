import { PageType, VideoSource } from "@/common/feature/video/types";
import type { Dimension } from "@/common/types";
import { waitForElement } from "@/common/utils";
import { Processor, retrieveVideoDimensions } from "./processor";

const PART_SEPARATOR = "|";
const videoMatchingRegex = /(http:|https:|)\/\/(?:www.)?(bilibili.com)\/video\/([A-Za-z0-9._%-]*)(&\S+)?/;
/**
 * Processor for Bilibili
 */
export const BilibiliProcessor: Processor = {
  type: VideoSource.Bilibili,
  name: "bilibili",
  urlRegex: /bilibili\.com/,
  videoSelector: ".bilibili-player-video video, .bpx-player-video-wrap video",
  captionContainerSelector: ".bpx-player-video-wrap, .bilibili-player-video",
  videoPageUISelector: ".player-wrap",
  updateTitleOnSubmission: true,
  titleSelector: async () => {
    const mainTitle = (document.querySelector(
      ".video-title span"
    ) as HTMLElement)?.innerText;
    if (!document.querySelector("#multi_page")) {
      return mainTitle;
    }
    const matches = window.location.href.match(videoMatchingRegex);
    const mainId = matches[3];
    const url = new URL(window.location.href);
    const partId = url.searchParams.get("p") || "1";
    const partTitleElement: HTMLElement | undefined = document.querySelector(
      `a[href="/video/${mainId}?p=${partId}"] .part`
    ) as HTMLElement;
    const partTitle = partTitleElement?.innerText || "";
    return [mainTitle, partTitle].join(" ");
  },
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
    .libassjs-canvas-parent {
      position: static !important;
      canvas {
        top: 0 !important;
      }
    }
  `,
  supportAutoCaptions: () => false,
  getVideoId: () => {
    const matches = window.location.href.match(videoMatchingRegex);
    const url = new URL(window.location.href);
    const partId = url.searchParams.get("p");
    let suffix = "";
    if (!!partId && partId != "1") {
      suffix = `${PART_SEPARATOR}${partId}`;
    }
    return matches[3] + suffix;
  },
  generateVideoLink: (videoId: string) => {
    const finalId = videoId.split(PART_SEPARATOR).join("?p=");
    return `https://www.bilibili.com/video/${finalId}`;
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
      ".bilibili-player-video-inputbar-wrap, .bpx-player-dm-wrap"
    );
    // Some framework called Jinkela might be used. We need to wait for it to complete loading before we can add NekoCap to the page.
    // Otherwise it will remove the entire video container
    if (document.querySelectorAll(`script[src*="jinkela"]`).length > 0) {
      await waitForElement(`iframe[src*="jinkela"]`);
    }
    return;
  },
};
