import { PageType, VideoSource } from "@/common/feature/video/types";
import type { Dimension } from "@/common/types";
import { Processor, retrieveVideoDimensions } from "./processor";

type YoutubeCaptionDetails = {
  baseUrl: string;
  languageCode: string;
  name: { simpleText: string };
};

export const NekoCapVideoProcessor: Processor = {
  type: VideoSource.Youtube,
  name: "YouTube",
  canWatchInNekoCapSite: true,
  urlRegex: /youtube.com/,
  videoSelector: ".editor-video",
  videoPageUISelector: "",
  titleSelector: "",
  editorVideoPlayerStyles: `
  video {
    width: 100% !important;
  }
  `,
  /**
   * Hide comments and "up next" elements when the editor is open to prevent elements that are being loaded in the background
   * from degrading the performance of the editor and making the page longer and longer
   */
  globalStyles: ``,
  darkModeSelector: 'html[dark="true"]',
  supportAutoCaptions: () => true,
  getVideoId: () => {
    const matches = window.location.href.match(
      /(http:|https:|)\/\/(player.|www.)?(youtu(be\.com|\.be|be\.googleapis\.com))\/(video\/|embed\/|watch\?v=|v\/)?([A-Za-z0-9._%-]*)(&\S+)?/,
    );
    const videoId = matches?.[6];
    return videoId || "";
  },
  generateVideoLink: (videoId: string) => {
    return `https://www.youtube.com/watch?v=${videoId}`;
  },
  generateThumbnailLink: async (videoId: string) => {
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  },
  retrieveVideoDimensions: async function (
    videoId: string,
  ): Promise<Dimension> {
    return await retrieveVideoDimensions(
      videoId,
      this,
      "https://www.youtube.com/oembed?url=",
    );
  },
  onEditorOpen: () => {
    return;
  },
  onEditorClose: () => {
    return;
  },
  getPageType: (url: string) => {
    return PageType.Video;
  },
};
