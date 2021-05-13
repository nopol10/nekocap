import { CaptionDataContainer } from "@/common/caption-parsers/types";
import { EDITOR_OPEN_ATTRIBUTE, TIME } from "@/common/constants";
import { PageType, VideoSource } from "@/common/feature/video/types";
import { Processor, retrieveVideoDimensions } from "./processor";
import { unescape } from "lodash";
import type { Dimension } from "@/common/types";

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
  captionContainerSelector: ".editor-video-container",
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
    const cues = Array.from(captionXml.getElementsByTagName("text"))
      .map((cue) => {
        const start =
          parseFloat(cue.getAttribute("start")) * TIME.SECONDS_TO_MS;
        // Sometimes the dur attribute will not be present. Use a default value in that case
        const end =
          start +
          (parseFloat(cue.getAttribute("dur")) || 1000) * TIME.SECONDS_TO_MS;
        const text = unescape(cue.textContent);
        return {
          start,
          end,
          text,
        };
      })
      .sort((a, b) => {
        return a.start - b.start;
      });

    return {
      tracks: [
        {
          cues,
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
  retrieveVideoDimensions: async function (
    videoId: string
  ): Promise<Dimension> {
    return await retrieveVideoDimensions(
      videoId,
      this,
      "https://www.youtube.com/oembed?url="
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
