import { PageType, VideoSource } from "@/common/feature/video/types";
import type { Dimension } from "@/common/types";
import { sortBy, uniq } from "lodash-es";
import { Processor, retrieveVideoDimensions } from "./processor";

/**
 * Processor for Amazon Prime
 */
export const AmazonPrimeProcessor: Processor = {
  type: VideoSource.AmazonPrime,
  name: "Amazon Prime",
  urlRegex: /primevideo\.com/,
  videoSelector: ".webPlayerElement video",
  videoPageUISelector: ".atvwebplayersdk-timeindicator-text",
  updateTitleOnSubmission: true,
  titleSelector: async () => {
    const title = (
      document.querySelector(".atvwebplayersdk-title-text") as HTMLElement
    )?.innerText;
    const subtitle = (
      document.querySelector(".atvwebplayersdk-subtitle-text") as HTMLElement
    )?.innerText;
    return `${title} ${subtitle}`;
  },
  inlineMenu: { insertPosition: "after" },
  observer: {
    shouldObserveMenuPlaceability: true,
    shouldObserveVideoMetaUpdate: true,
    refreshTabDataAfterElementUpdate: true,
    menuElementSelector: `.dv-player-fullscreen`,
  },
  globalStyles: `
    #dv-web-player {
      z-index: 1999 !important;
    }
    .nekocap-cap-container:not(:fullscreen),
    .libassjs-canvas-parent:not(:fullscreen) .libassjs-canvas {
      max-height: 100vh;
    }
  `,
  editorVideoPlayerStyles: ``,
  supportAutoCaptions: () => false,
  getVideoId: () => {
    let titleId = "";
    const downloadButton = document.querySelector(
      `a[data-automation-id="download-button"]`,
    );
    if (downloadButton) {
      const downloadElement = downloadButton as HTMLAnchorElement;
      titleId = new URL(downloadElement.href).searchParams.get("gti") || "";
    }
    // For each series id, find the number of occurences of that id and sort them in descending order
    const seriesIds = uniq(
      // titleId is in CAPS on purpose
      Array.from(document.querySelectorAll(`input[name="titleID"]`)).map(
        (input) => {
          const inputElement = input as HTMLInputElement;
          return inputElement.value;
        },
      ),
    );
    // For each title ids, find the number of occurences of that id and sort them in descending order
    const seriesWithCount = seriesIds.map((seriesId) => {
      const matcher = new RegExp(seriesId, "g");
      const matches = document.body.innerHTML.match(matcher) || [];
      const count = matches.length;
      return {
        seriesId: seriesId,
        count,
      };
    });
    sortBy(seriesWithCount, "count");
    const seriesId =
      seriesWithCount.length > 0 ? seriesWithCount[0].seriesId : "";
    return `${seriesId}|${titleId}`;
  },
  generateVideoLink: (videoId: string) => {
    const seriesId = videoId.split("|")[0];
    return `https://www.primevideo.com/detail/${seriesId}`;
  },
  generateThumbnailLink: async (videoId: string) => {
    return ``;
  },
  retrieveVideoDimensions: async function (
    videoId: string,
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
    return PageType.Video;
  },
};
