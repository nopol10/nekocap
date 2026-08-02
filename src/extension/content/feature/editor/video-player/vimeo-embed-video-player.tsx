import { delay } from "@/common/utils";
import VimeoPlayer from "vimeo__player";
import PlayerStates from "youtube-player/dist/constants/PlayerStates";
import { VideoPlayer, VolumeChangeListener } from "./video-player";

const DURATION_POLL_INTERVAL_MS = 200;
const DURATION_POLL_TIMEOUT_MS = 30000;

export class VimeoEmbedVideoPlayer implements VideoPlayer {
  private player: VimeoPlayer;
  private iframeElement: HTMLIFrameElement | undefined;
  private currentState: PlayerStates;
  private videoDuration: number;
  private previousTime: number;
  private timeUpdater: number;
  private stopped = false;

  private durationChangeListenerMap: { [tag: string]: () => void };
  private volumeChangeListenerMap: { [tag: string]: () => void };
  private playListenerMap: { [tag: string]: () => void };
  private pauseListenerMap: { [tag: string]: () => void };
  private timeUpdateListenerMap: { [tag: string]: () => void };
  private seekListenerMap: { [tag: string]: () => void };

  constructor(vimeoPlayer: VimeoPlayer, iframe?: HTMLIFrameElement) {
    this.player = vimeoPlayer;
    this.durationChangeListenerMap = {};
    this.volumeChangeListenerMap = {};
    this.playListenerMap = {};
    this.pauseListenerMap = {};
    this.timeUpdateListenerMap = {};
    this.seekListenerMap = {};

    this.iframeElement = iframe;
    this.player.on("play", this.onPlay);
    this.player.on("pause", this.onPause);
    this.detectDuration();
    this.runTimeUpdater();
  }

  /**
   * Polls until Vimeo reports a duration, waiting between polls so the loop
   * cannot starve the event loop, and giving up for videos that never become
   * playable instead of polling forever
   */
  private async detectDuration() {
    for (
      let waited = 0;
      waited < DURATION_POLL_TIMEOUT_MS && !this.stopped;
      waited += DURATION_POLL_INTERVAL_MS
    ) {
      const duration = await this.player.getDuration();
      if (duration > 0) {
        this.videoDuration = duration;
        return;
      }
      await delay(DURATION_POLL_INTERVAL_MS);
    }
  }

  private runTimeUpdater() {
    this.timeUpdater = window.setInterval(async () => {
      const currentTime = await this.player.getCurrentTime();
      if (this.previousTime !== currentTime) {
        Object.values(this.timeUpdateListenerMap).forEach((listener) => {
          listener();
        });
      }
      this.previousTime = currentTime;
    }, 10);
  }

  destruct() {
    this.stopped = true;
    if (this.timeUpdater) {
      window.clearInterval(this.timeUpdater);
    }
  }

  onPlay = (): void => {
    Object.values(this.playListenerMap).forEach((listener) => {
      listener();
    });
  };

  onPause = (): void => {
    Object.values(this.pauseListenerMap).forEach((listener) => {
      listener();
    });
  };

  element(): HTMLElement | undefined {
    return this.iframeElement;
  }

  async volume(volume?: number): Promise<number> {
    if (volume !== undefined) {
      await this.player.setVolume(volume);
    }
    return await this.player.getVolume();
  }

  async muted(isMuted: boolean): Promise<boolean> {
    if (isMuted !== undefined) {
      this.player.setMuted(isMuted);
    }
    return await this.player.getMuted();
  }

  play() {
    this.player.play();
  }

  pause() {
    this.player.pause();
  }

  paused() {
    return this.currentState === PlayerStates.PAUSED;
  }

  currentTime(time: number) {
    if (time !== undefined) {
      this.player.setCurrentTime(time);
    }
    return this.previousTime;
  }

  duration() {
    const duration = this.videoDuration;
    return duration;
  }

  addDurationChangeListener(tag = "", listener: (duration: number) => void) {
    const wrappedListener = async () => {
      this.videoDuration = await this.player.getDuration();
      listener(this.videoDuration);
    };
    this.durationChangeListenerMap[tag] = wrappedListener;
    this.player.on("durationchange", wrappedListener);
  }

  removeDurationChangeListener(tag = "") {
    delete this.durationChangeListenerMap[tag];
  }

  addTimeUpdateListener(tag = "", listener: () => void) {
    this.timeUpdateListenerMap[tag] = listener;
  }

  removeTimeUpdateListener(tag = "") {
    delete this.timeUpdateListenerMap[tag];
  }

  addVolumeChangeListener(tag: string, listener: VolumeChangeListener) {
    const wrappedListener = async () => {
      listener(await this.volume());
    };
    this.volumeChangeListenerMap[tag] = wrappedListener;
    this.player.on("volumechange", wrappedListener);
    // this.player.addEventListener("volumechange", wrappedListener);
  }
  removeVolumeChangeListener(tag: string) {
    const wrappedListener = this.volumeChangeListenerMap[tag];
    if (wrappedListener) {
      this.player.off("volumechange", wrappedListener);
    }
  }

  addPlayListener(tag: string, listener: () => void) {
    this.playListenerMap[tag] = listener;
    // this.player.addEventListener("play", listener);
  }

  removePlayListener(tag: string) {
    delete this.playListenerMap[tag];
  }

  addSeekListener(tag: string, listener: () => void) {
    this.seekListenerMap[tag] = listener;
    this.player.on("seeked", listener);
  }

  removeSeekListener(tag: string) {
    const listener = this.seekListenerMap[tag];
    if (listener) {
      this.player.off("seeked", listener);
    }
  }

  addPauseListener(tag: string, listener: () => void) {
    this.pauseListenerMap[tag] = listener;
  }

  removePauseListener(tag: string) {
    delete this.pauseListenerMap[tag];
  }

  async playbackRate() {
    return this.player.getPlaybackRate();
  }

  requestVideoFrameCallback(_: (_: unknown, metadata: unknown) => void) {
    // Not supported in Vimeo player
  }

  async dimensions() {
    return {
      width: await this.player.getVideoWidth(),
      height: await this.player.getVideoHeight(),
    };
  }
}
