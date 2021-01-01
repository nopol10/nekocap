import { CaptionDataContainer } from "@/common/caption-parsers/types";
import { EDITOR_OPEN_ATTRIBUTE, TIME } from "@/common/constants";
import { PageType, VideoSource } from "@/common/feature/video/types";
import { Processor } from "./processor";
import { unescape } from "lodash";

const disableYoutubeHotkeys = () => {
  const hotkeyManager = document.getElementsByTagName("yt-hotkey-manager")[0];

  if (hotkeyManager) {
    window.backupHotkeyParentElement = hotkeyManager.parentNode;
    window.backupHotkeyElement = hotkeyManager;
    const clone = hotkeyManager.cloneNode(false);
    hotkeyManager.parentNode.replaceChild(clone, hotkeyManager);
    clone.parentNode.removeChild(clone);
  }

  const player = document.getElementById("player");
  if (player) {
    player.blur();
  }
  const movie_player = document.getElementById("movie_player");
  if (movie_player) {
    movie_player.blur();
  }
};

const enableYoutubeHotkeys = () => {
  if (!window.backupHotkeyParentElement || !window.backupHotkeyElement) {
    return;
  }
  window.backupHotkeyParentElement.appendChild(window.backupHotkeyElement);
};

type YoutubeCaptionDetails = {
  baseUrl: string;
  languageCode: string;
  name: { simpleText: string };
};

export const YoutubeProcessor: Processor = {
  type: VideoSource.Youtube,
  name: "YouTube",
  urlRegex: /youtube.com/,
  videoSelector: "#ytd-player #container video",
  captionContainerSelector: "#ytd-player .html5-video-container",
  videoPageUISelector:
    "ytd-video-primary-info-renderer h1.ytd-video-primary-info-renderer",
  titleSelector: "#info-contents h1.title yt-formatted-string",
  editorVideoPlayerStyles: `
  .html5-video-container {
    height: 100%;
  }
  .ytp-chrome-bottom {
    width: calc(100% - 24px) !important;
  }
  .ytp-tooltip {
    top: 464px;
  }
  .ytp-chapter-hover-container {
    width: 100%;
  }
  .ytp-gradient-bottom, .ytp-gradient-top, .ytp-chrome-bottom, .ytp-chrome-top, .ytp-player-content, .ytp-ce-element {
    display: none;
  }

  video {
    width: 100% !important;
    height: auto !important;
    transform: translateY(-50%);
    top: 50% !important;
    left: 0 !important;
  }
  `,
  /**
   * Hide comments and "up next" elements when the editor is open to prevent elements that are being loaded in the background
   * from degrading the performance of the editor and making the page longer and longer
   */
  globalStyles: `
    body[${EDITOR_OPEN_ATTRIBUTE}="true"] {
      ytd-comments {
        display: none;
      }

      #secondary {
        display: none;
      }
    }
  `,
  darkModeSelector: 'html[dark="true"]',
  supportAutoCaptions: () => true,
  getAutoCaptionList: async (videoId: string) => {
    const response = await fetch(
      `https://youtube.com/get_video_info?video_id=${videoId}`
    );
    const videoInfoText = decodeURIComponent(await response.text());
    if (!videoInfoText.includes("captionTracks")) {
      throw new Error(`No captions found for ${videoId}`);
    }
    /**
     * The isTranslatable block at the end is used to recognize the end of the captionTracks property
     */
    const captionArrayRegex = /{"captionTracks":(.*"isTranslatable":(true|false)}])/;
    /**
     * The capture group will contain a string of the form
     * [{"baseUrl": "...", "languageCode": "...", "name": "..."}, ...]
     */
    const captionArray: YoutubeCaptionDetails[] = JSON.parse(
      captionArrayRegex.exec(videoInfoText)[1]
    );
    return captionArray.map((youtubeCaption) => {
      return {
        id: youtubeCaption.baseUrl,
        language: youtubeCaption.languageCode,
        name: (youtubeCaption.name.simpleText || "").replace(/\+/g, " "),
      };
    });
  },
  getAutoCaption: async (
    videoId: string,
    captionUrl: string
  ): Promise<CaptionDataContainer> => {
    const youtubeCaptionResponse = await fetch(captionUrl);
    const captionString = await youtubeCaptionResponse.text();
    const domParser = new DOMParser();
    const captionXml = domParser.parseFromString(captionString, "text/xml");
    const cues = Array.from(captionXml.getElementsByTagName("text"));

    return {
      tracks: [
        {
          cues: cues.map((cue) => {
            const start =
              parseFloat(cue.getAttribute("start")) * TIME.SECONDS_TO_MS;
            const end =
              start + parseFloat(cue.getAttribute("dur")) * TIME.SECONDS_TO_MS;
            const text = unescape(cue.textContent);
            return {
              start,
              end,
              text,
            };
          }),
        },
      ],
    };
  },
  getVideoId: () => {
    const matches = window.location.href.match(
      /(http:|https:|)\/\/(player.|www.)?(youtu(be\.com|\.be|be\.googleapis\.com))\/(video\/|embed\/|watch\?v=|v\/)?([A-Za-z0-9._%-]*)(&\S+)?/
    );
    const videoId = matches[6];
    return videoId;
  },
  generateVideoLink: (videoId: string) => {
    return `https://www.youtube.com/watch?v=${videoId}`;
  },
  generateThumbnailLink: async (videoId: string) => {
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  },
  onEditorOpen: () => {
    disableYoutubeHotkeys();
  },
  onEditorClose: () => {
    enableYoutubeHotkeys();
  },
  getPageType: (url: string) => {
    if (
      url.match(
        /(?:https?:\/\/)?(?:www\.)?youtu(?:\.be\/|be.com\/\S*(?:watch|embed)(?:(?:(?=\/[^&\s?]+(?!\S))\/)|(?:\S*v=|v\/)))([^&\s?]+)/
      )
    ) {
      return PageType.Video;
    }
    return PageType.SearchResults;
  },
};
