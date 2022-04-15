import type { Processor } from "@/extension/content/processors/processor";
import { YoutubeProcessor } from "@/extension/content/processors/youtube-processor";
import { CaptionContainer, VideoSource } from "./types";
import type {
  NekoCaption,
  CaptionDataContainer,
} from "../../caption-parsers/types";
import { TVerProcessor } from "@/extension/content/processors/tver-processor";
import { NicoNicoProcessor } from "@/extension/content/processors/niconico-processor";
import { VimeoProcessor } from "@/extension/content/processors/vimeo-processor";
import { BilibiliProcessor } from "@/extension/content/processors/bilibili-processor";
import { BilibiliBangumiProcessor } from "@/extension/content/processors/bilibili-bangumi-processor";
import { NetflixProcessor } from "@/extension/content/processors/netflix-processor";
import { AmazonPrimeProcessor } from "@/extension/content/processors/amazon-prime-processor";
import { TwitterProcessor } from "@/extension/content/processors/twitter-processor";
import { WetvProcessor } from "@/extension/content/processors/wetv-processor";
import { TikTokProcessor } from "@/extension/content/processors/tiktok-processor";

/**
 * Binary search through the array to find the closest upcoming or current caption
 * @param captions the sorted array of captions
 * @param time current video time in milliseconds
 */
export const findClosestCaption = (
  captions: NekoCaption[],
  time: number
): number => {
  let left = 0,
    right = captions.length - 1;
  let foundIndex = -1;
  while (left < right) {
    const currentIndex = Math.floor(left + (right - left) / 2);
    const caption = captions[currentIndex];
    if (time >= caption.start && time <= caption.end) {
      // Found the currently playing caption
      foundIndex = currentIndex;
      break;
    }
    if (time < caption.start) {
      right = currentIndex - 1;
    } else if (time > caption.end) {
      left = currentIndex + 1;
    } else {
      break;
    }
  }
  if (foundIndex < 0) {
    // If no captions were found, we don't need to do anything further to the closest index
    return Math.min(left, captions.length - 1);
  }
  /**
   * We need to step backwards through the array to make sure that overlapping captions in the same layer are accounted for
   * since the binary search might find a caption that overlaps with another
   */
  let currentIndex = foundIndex;
  for (; currentIndex > 0; currentIndex--) {
    if (currentIndex - 1 >= 0 && time > captions[currentIndex - 1].end) {
      return currentIndex;
    }
  }

  // By the end of the loop, the left pointer will point to the closest upcoming caption
  return currentIndex;
};

export const convertToCaptionContainer = (
  captionData: CaptionDataContainer,
  videoId: string,
  videoSource: VideoSource
): CaptionContainer => {
  const caption: CaptionContainer = {
    videoId,
    videoSource,
    data: captionData,
    loadedByUser: true,
  };
  return caption;
};

export const videoSourceToProcessorMap: { [id: number]: Processor } = {
  [VideoSource.Youtube]: YoutubeProcessor,
  [VideoSource.TVer]: TVerProcessor,
  [VideoSource.Vimeo]: VimeoProcessor,
  [VideoSource.NicoNico]: NicoNicoProcessor,
  [VideoSource.Bilibili]: BilibiliProcessor,
  [VideoSource.BilibiliBangumi]: BilibiliBangumiProcessor,
  [VideoSource.Netflix]: NetflixProcessor,
  [VideoSource.AmazonPrime]: AmazonPrimeProcessor,
  [VideoSource.Twitter]: TwitterProcessor,
  [VideoSource.Wetv]: WetvProcessor,
  [VideoSource.TikTok]: TikTokProcessor,
};

export const processorOrder = [
  VideoSource.Youtube,
  VideoSource.TVer,
  VideoSource.Vimeo,
  VideoSource.NicoNico,
  VideoSource.BilibiliBangumi,
  VideoSource.Bilibili,
  VideoSource.Netflix,
  VideoSource.AmazonPrime,
  VideoSource.Twitter,
  VideoSource.Wetv,
  VideoSource.TikTok,
];
