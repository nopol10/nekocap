import { PageType, VideoSource } from "@/common/feature/video/types";
import type { Dimension } from "@/common/types";
import { waitForElement } from "@/common/utils";
import { Processor, retrieveVideoDimensions } from "./processor";
import { DEVICE } from "@/common/style-constants";

/**
 * Waits for the .jw-video element inside the open shadow root of the play-av element.
 */
async function waitForJwVideo(): Promise<HTMLVideoElement> {
  const playAv = await waitForElement<HTMLElement>("play-av");
  return new Promise<HTMLVideoElement>((resolve) => {
    const checkForVideoElement = () => {
      const video =
        playAv.shadowRoot?.querySelector<HTMLVideoElement>(".jw-video");
      if (video) {
        resolve(video);
        return;
      }
      // Shadow root content may not be ready yet, poll until it is.
      requestAnimationFrame(checkForVideoElement);
    };
    checkForVideoElement();
  });
}

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
  videoSelector: async function () {
    return await waitForJwVideo();
  },
  videoPageUISelector: "body",
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
    .nekocap-menu-container--floating {
      bottom: 55px;
      right: 19px;

      & > div > div {
        box-shadow: rgba(101, 119, 134, 0.2) 0px 0px 15px, rgba(101, 119, 134, 0.15) 0px 0px 3px 1px;
        border: 1px solid rgb(159, 181, 195);
        padding: 8px;
        border-radius: 16px;
        background-color: white;
        transition: background-color 0.2s ease-in-out;
        
        &:hover {
          background-color: rgb(207 236 255);
        }
      }

      img {
        width: 20px;
        height: 20px;

        @media ${DEVICE.tablet} {
          width: 38px;
          height: 38px;
        }
      }

      img:hover {
        transform: unset;  
      }
    }
  `,
  inlineMenu: {
    insertPosition: "after",
    isFloating: true,
  },
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
    if (url.match(videoMatchingRegex)) {
      return PageType.Video;
    }
    return PageType.SearchResults;
  },
  waitUntilPageIsReady: async () => {
    await waitForJwVideo();
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
    playingVideo.parentElement?.parentElement?.children || [],
  );
  const videoPartNumber =
    playlistElements.indexOf(playingVideo.parentElement) + 1;
  return videoPartNumber;
}
