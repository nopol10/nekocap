import { Dimension } from "@/common/types";

export type DurationChangeListener = (duration: number) => void;
export type VolumeChangeListener = (duration: number) => void;

export interface VideoPlayer {
  play: () => void;
  pause: () => void;
  paused: () => boolean;
  currentTime: (time?: number) => number;
  duration: () => number;
  /**
   * @param volume A volume value from 0 to 1
   */
  volume: (volume?: number) => Promise<number>;
  muted: (isMuted?: boolean) => Promise<boolean>;
  addDurationChangeListener: (
    tag: string,
    listener: DurationChangeListener,
  ) => void;
  removeDurationChangeListener: (tag: string) => void;
  addTimeUpdateListener: (tag: string, listener: () => void) => void;
  removeTimeUpdateListener: (tag: string) => void;
  addVolumeChangeListener: (
    tag: string,
    listener: VolumeChangeListener,
  ) => void;
  removeVolumeChangeListener: (tag: string) => void;
  addPlayListener: (tag: string, listener: () => void) => void;
  removePlayListener: (tag: string) => void;
  addSeekListener: (tag: string, listener: () => void) => void;
  removeSeekListener: (tag: string) => void;
  addPauseListener: (tag: string, listener: () => void) => void;
  removePauseListener: (tag: string) => void;
  playbackRate: () => Promise<number>;
  requestVideoFrameCallback: (
    callback: (_: unknown, metadata: unknown) => void,
  ) => void;
  element: () => HTMLElement | undefined;
  dimensions: () => Promise<Dimension>;
}
