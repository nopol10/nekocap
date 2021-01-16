import { Coords } from "@/common/types";
import {
  CaptionAlignment,
  CaptionLayout,
  TrackSettings,
} from "@/common/caption-parsers/types";

export const TIMEBAR_HEIGHT = 30;

export const TRACK_INFO_WIDTH = 100;

export const TRACK_BASE_HEIGHT = 100;

export const CUE_HEIGHT = 50;

export const MAX_VOLUME = 10;

export const DEFAULT_LAYOUT_SETTINGS: CaptionLayout = {
  alignment: CaptionAlignment.BottomCenter,
  position: undefined,
};

export const DEFAULT_COORDS_SETTINGS: Coords = {
  x: 0,
  y: 0,
};

export const RECOMMENDED_CHAR_PER_SEC = 25;
export const AUTOSAVE_INTERVAL = 60000;
