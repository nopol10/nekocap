import { CaptionRendererType } from "./types";

export const MAX_TRACKS = 10;
/**
 * Number of concurrent captions per track
 */
export const MAX_CONCURRENT_CAPTIONS = 10;

export const MAX_SEARCH_TAG_LIMIT = 5;

export const MAX_CAPTION_GROUP_TAG_LIMIT = 5;

export const CAPTION_RENDERER_DATA = {
  [CaptionRendererType.Default]: { name: "Default" },
  [CaptionRendererType.AdvancedOctopus]: {
    name: "Advanced Renderer (Experimental!)",
  },
};
