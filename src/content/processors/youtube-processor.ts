import { EDITOR_OPEN_ATTRIBUTE } from "@/common/constants";
import { PageType, VideoSource } from "@/common/feature/video/types";
import { Processor } from "./processor";

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
  getVideoId: () => {
    const matches = window.location.href.match(
      /(http:|https:|)\/\/(player.|www.)?(youtu(be\.com|\.be|be\.googleapis\.com))\/(video\/|embed\/|watch\?v=|v\/)?([A-Za-z0-9._%-]*)(\&\S+)?/
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
        /(?:https?:\/\/)?(?:www\.)?youtu(?:\.be\/|be.com\/\S*(?:watch|embed)(?:(?:(?=\/[^&\s\?]+(?!\S))\/)|(?:\S*v=|v\/)))([^&\s\?]+)/
      )
    ) {
      return PageType.Video;
    }
    return PageType.SearchResults;
  },
};
