import { PageType, VideoSource } from "@/common/feature/video/types";
import type { Dimension } from "@/common/types";
import { last } from "lodash";
import { Processor, retrieveVideoDimensions } from "./processor";

const videoMatchingRegex = /(http:|https:)\/\/(?:www.)?(bilibili.tv)\/(?:.+)\/((video|play)\/([A-Za-z0-9._%-]*)\/?([A-Za-z0-9._%-]*)?)(&\S+)?/;

const trimSlash = (input: string) => {
  if (input.endsWith("/")) {
    return input.slice(0, -1);
  }
  return input;
};
/**
 * Processor for BilibiliTV
 */
export const BilibiliTVProcessor: Processor = {
  type: VideoSource.BilibiliTV,
  name: "bilibili.tv",
  urlRegex: /bilibili\.tv/,
  videoSelector: ".video-play video",
  videoPageUISelector: ".interactive",
  updateTitleOnSubmission: true,
  disableEditor: true, // TODO: Enable later
  titleSelector: async () => {
    const mainTitle = (document.querySelector(
      ".bstar-meta__title"
    ) as HTMLElement)?.innerText;
    if (!document.querySelector(".ep-list")) {
      return mainTitle;
    }
    const partTitleElement: HTMLElement | undefined = document.querySelector(
      `.breadcrumb__item-text`
    ) as HTMLElement;
    const partTitle = partTitleElement?.innerText || "";
    return [mainTitle, partTitle].join(" ");
  },
  editorVideoPlayerStyles: ``,
  globalStyles: ``,
  supportAutoCaptions: () => false,
  getVideoId: () => {
    const matches = window.location.href.match(videoMatchingRegex);
    let mainId = matches[3];
    if (!mainId.startsWith("play")) {
      // A single video
      return trimSlash(mainId);
    }
    let episodeId = matches[6];
    if (!episodeId) {
      // This is the first episode, we need to append the episode id
      const firstEpisodeHref =
        (document.querySelector(
          ".ep-list > .ep-item:first-child a"
        ) as HTMLAnchorElement)?.href || "";
      episodeId = last(firstEpisodeHref.split("/")).split("?")[0];
      mainId += `/${episodeId}`;
    }
    return trimSlash(mainId);
  },
  generateVideoLink: (videoId: string) => {
    return `https://www.bilibili.tv/en/${videoId}`;
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
};
