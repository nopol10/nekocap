import type { Processor } from "@/extension/content/processors/processor";
import { YoutubeProcessor } from "@/extension/content/processors/youtube-processor";
import { CaptionContainer, CaptionTag, VideoSource } from "./types";
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
import { iQiyiProcessor } from "@/extension/content/processors/iqiyi-processor";
import { NogiDogaProcessor } from "@/extension/content/processors/nogidoga-processor";
import { AbemaProcessor } from "@/extension/content/processors/abema-processor";
import { DailymotionProcessor } from "@/extension/content/processors/dailymotion-processor";
import { BilibiliTVProcessor } from "@/extension/content/processors/bilibilitv-processor";
import { ArchiveOrgProcessor } from "@/extension/content/processors/archive-org-processor";
import { TBSFreeProcessor } from "@/extension/content/processors/tbs-free-processor";

/**
 * Binary search through the array to find the closest upcoming or current caption
 * @param captions the sorted array of captions
 * @param time current video time in milliseconds
 */
export const findClosestCaption = (
  captions: NekoCaption[],
  time: number,
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
  videoSource: VideoSource,
): CaptionContainer => {
  const caption: CaptionContainer = {
    videoId,
    videoSource,
    data: captionData,
    loadedByUser: true,
    userDislike: false,
    userLike: false,
  };
  return caption;
};

/**
 * Get the tag name of a user made caption tag
 * that exists in the form of g:<name>:<color>
 * @param tag
 * @returns
 */
export const getCaptionGroupTagName = (tag: string): string => {
  const nameStart = tag.indexOf(":", 0) + 1;
  const nameEnd = tag.lastIndexOf(":");
  if (nameStart < 0 || nameEnd < 0 || nameStart >= tag.length) {
    return "";
  }
  return tag.substring(nameStart, nameEnd);
};

export const getCaptionGroupTagColor = (tag: string): string => {
  const colorStart = tag.lastIndexOf(":") + 1;
  // The last colon has to be present at least
  if (colorStart <= 0) {
    return "";
  }
  return tag.substring(colorStart);
};

/**
 * Converts user made caption tags to the string format used to store in the database
 * @param tags
 * @returns
 */
export const getCaptionTagStrings = (tags: CaptionTag[]): string[] => {
  return tags.map((tag) => {
    return `g:${tag.name}:${tag.color}`;
  });
};

export const getCaptionTagFromTagString = (
  tag: string,
): CaptionTag | undefined => {
  if (!tag.startsWith("g:")) {
    return undefined;
  }
  return {
    name: getCaptionGroupTagName(tag),
    color: getCaptionGroupTagColor(tag),
  };
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
  [VideoSource.iQiyi]: iQiyiProcessor,
  [VideoSource.NogiDoga]: NogiDogaProcessor,
  [VideoSource.Abema]: AbemaProcessor,
  [VideoSource.Dailymotion]: DailymotionProcessor,
  [VideoSource.BilibiliTV]: BilibiliTVProcessor,
  [VideoSource.TBSFree]: TBSFreeProcessor,
  [VideoSource.ArchiveOrg]: ArchiveOrgProcessor,
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
  VideoSource.iQiyi,
  VideoSource.NogiDoga,
  VideoSource.Abema,
  VideoSource.Dailymotion,
  VideoSource.BilibiliTV,
  VideoSource.TBSFree,
  VideoSource.ArchiveOrg,
];
