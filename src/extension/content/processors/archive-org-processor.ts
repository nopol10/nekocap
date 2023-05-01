import { PageType, VideoSource } from "@/common/feature/video/types";
import type { Dimension } from "@/common/types";
import { waitForElement } from "@/common/utils";
import { Processor, retrieveVideoDimensions } from "./processor";

const videoMatchingRegex =
  /(http:|https:|)\/\/(?:www.)?(archive.org)\/details\/([A-Za-z0-9._%-/!]*)(&\S+)?/;
/**
 * Processor for Archive.org
 * Works for single/multi videos.
 * Does not work for TV style pages with multiple selectable timestamps
 */
export const ArchiveOrgProcessor: Processor = {
  type: VideoSource.ArchiveOrg,
  name: "archive.org",
  urlRegex: /archive\.org/,
  videoSelector: ".jw-video",
  videoPageUISelector: ".item-details-metadata",
  updateTitleOnSubmission: true,
  titleSelector: async () => {
    const mainTitle = (document.querySelector(".item-title") as HTMLElement)
      ?.innerText;
    if (!document.querySelector(".jwlist")) {
      return mainTitle;
    }
    const videoPartNumber = getPlayingVideoNumber();
    return [mainTitle, videoPartNumber].join(" ");
  },
  editorVideoPlayerStyles: ``,
  globalStyles: `
    #nekocap-menu-container {
      margin-bottom: 16px;
    }
    .nekocap-caption {
      line-height: 1.3;
    }
  `,
  supportAutoCaptions: () => false,
  getVideoId: () => {
    const matches = globalThis.location.href.match(videoMatchingRegex);
    if (!matches) {
      return "";
    }
    // Could be ["blabla"] or ["blabla", "01-bla"] for example.
    // 1st one is for single videos
    const idParts = matches[3].split("/");
    const videoPartNumber = getPlayingVideoNumber();
    if (videoPartNumber === 1) {
      return idParts[0];
    }
    return matches[3];
  },
  generateVideoLink: (videoId: string) => {
    return `https://archive.org/details/${videoId}`;
  },
  generateThumbnailLink: async function () {
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
    await waitForElement(".jw-video");
    return;
  },
  disableEditor: true,
};

function getPlayingVideoNumber() {
  if (!document.querySelector(".jwlist")) {
    return 1;
  }
  const playingVideo = document.querySelector(".jwrow.playing") as HTMLElement;
  if (!playingVideo.parentElement) {
    return 1;
  }
  const playlistElements = Array.from(
    playingVideo.parentElement?.parentElement?.children || []
  );
  const videoPartNumber =
    playlistElements.indexOf(playingVideo.parentElement) + 1;
  return videoPartNumber;
}
