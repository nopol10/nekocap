import { Coords } from "../types";

/**
 * Alignment values follow Substation Alpha (ASS/SSA) values.
 * Corresponds to numpad keys
 */
export enum CaptionAlignment {
  BottomLeft = 1,
  BottomCenter = 2,
  BottomRight = 3,
  MiddleLeft = 4,
  MiddleCenter = 5,
  MiddleRight = 6,
  TopLeft = 7,
  TopCenter = 8,
  TopRight = 9,
}

export type CaptionLayout = {
  alignment: CaptionAlignment;

  /**
   * Position relative to the alignment
   * If undefined, will follow default positioning as defined by the renderer
   */
  position?: Coords;
};

export type NekoCaption = {
  start: number; // Start time in ms
  end: number; // End time in ms
  text: string;
  layout?: CaptionLayout;
};

export type CaptionSettings = {
  /**
   * Global layout settings. Will be used if specified and there are no track or caption level layout settings
   */
  layout?: CaptionLayout;
};

export type TrackSettings = {
  /**
   * Track layout settings. Will be used if specified and there are no caption level layout settings
   */
  layout?: CaptionLayout;
};

export interface Track {
  cues: NekoCaption[];
  settings?: TrackSettings;
}

/**
 * Type for on data relevant to the caption, nothing about users
 */
export type CaptionDataContainer = {
  tracks: Track[];
  settings?: CaptionSettings; // undecided
};
