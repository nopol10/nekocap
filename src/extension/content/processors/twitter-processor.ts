import { PageType, VideoSource } from "@/common/feature/video/types";
import { DEVICE } from "@/common/style-constants";
import type { Dimension } from "@/common/types";
import { waitForElement } from "@/common/utils";
import { Processor, retrieveVideoDimensions } from "./processor";

const TWITTER_STATUS_REGEX =
  /(http:|https:)\/\/((?:twitter|x).com)\/.*\/status\/([A-Za-z0-9]*)[/#]*(?:\?.*)?$/;

const TWITTER_EMBED_REGEX =
  /(?:http:|https:)\/\/(?:platform\.(twitter|x).com)\/embed\/Tweet.html\?.*$/i;

/**
 * Processor for Twitter
 */
export const TwitterProcessor: Processor = {
  type: VideoSource.Twitter,
  name: "Twitter / X",
  urlRegex: /(twitter|x)\.com/,
  disableEditor: true,
  videoSelector: async function () {
    const onMainSite = !!globalThis.location.href.match(TWITTER_STATUS_REGEX);
    if (!onMainSite) {
      // The embed site only has one video element so it's safe to return the first one
      return await waitForElement("video");
    }
    const linkElement = await waitForElement(
      `a[href$="/status/${this.getVideoId()}"]`,
    );
    const videoParent = linkElement.closest("article");
    const video: HTMLVideoElement = await waitForElement("video", videoParent);
    return video;
  },
  videoPageUISelector: "body > *:first-child", // Just need this to be somewhere in the body
  inlineMenu: {
    insertPosition: "after",
    isFloating: true,
  },
  globalStyles: `
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

      @media ${DEVICE.tablet} {
        bottom: 66px;
        right: 42px;
      }

      /* This is twitter's breakpoint for showing the Grok floating button */
      @media (min-width: 1078px) {
        bottom: 66px;
        right: 97px;
      }

      img:hover {
        transform: unset;  
      }
    }    
  `,
  titleSelector: "title",
  observer: {
    shouldObserveMenuPlaceability: true,
    shouldObserveVideoMetaUpdate: false,
    refreshTabDataAfterElementUpdate: false,
    menuElementSelector: `div[aria-label="Timeline: Conversation"]`,
  },
  editorVideoPlayerStyles: `
  video {
    width: 100% !important;
    height: auto !important;
    transform: rotate(0deg) scale(1.005) translateY(-50%) !important;
    top: 50% !important;
    left: 0 !important;
  }
  `,
  supportAutoCaptions: () => false,
  getVideoId: () => {
    const mainSiteMatches =
      globalThis.location.href.match(TWITTER_STATUS_REGEX);
    if (mainSiteMatches && mainSiteMatches.length >= 4) {
      return mainSiteMatches[3];
    }
    const embedSiteMatch = globalThis.location.href.match(TWITTER_EMBED_REGEX);
    if (embedSiteMatch) {
      const urlParams = new URLSearchParams(globalThis.location.search);
      return urlParams.get("id") || "";
    }
    return "";
  },
  generateVideoLink: (videoId: string) => {
    return `https://twitter.com/i/web/status/${videoId}`;
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
    if (url.match(TWITTER_STATUS_REGEX) || url.match(TWITTER_EMBED_REGEX)) {
      return PageType.Video;
    }
    return PageType.SearchResults;
  },
};
