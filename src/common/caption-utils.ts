import type {
  NekoCaption,
  CaptionDataContainer,
} from "./caption-parsers/types";
import { CaptionFileFormat } from "./types";

export const hasTag = (tags: string[], tag: string) => {
  return tags.includes(tag);
};

export const getCaptionCues = (
  captions: CaptionDataContainer
): NekoCaption[] => {
  if (!captions || !captions.tracks) {
    return [];
  }
  return captions.tracks.reduce((acc, track) => {
    return [...acc, ...track.cues];
  }, []);
};

/**
 * Is the type an ass?
 * @param type the given type as a string
 */
export const isAss = (type: string | undefined) => {
  if (!type) {
    return false;
  }
  return type === CaptionFileFormat.ass || type === CaptionFileFormat.ssa;
};
