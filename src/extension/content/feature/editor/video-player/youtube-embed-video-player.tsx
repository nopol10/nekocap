import { Dimension } from "@/common/types";
import { delay } from "@/common/utils";
import PlayerStates from "youtube-player/dist/constants/PlayerStates";
import { YouTubePlayer } from "youtube-player/dist/types";
import { VideoPlayer, VolumeChangeListener } from "./video-player";

const DURATION_POLL_INTERVAL_MS = 200;
const DURATION_POLL_TIMEOUT_MS = 30000;

export class YoutubeEmbedVideoPlayer implements VideoPlayer {
  private player: YouTubePlayer;
  private iframeElement: HTMLIFrameElement | undefined;
  private currentState: PlayerStates;
  private videoDuration: number;
  private previousTime: number;
  private previousVolume: number;
  private timeUpdater: number;
  private stopped = false;

  private durationChangeListenerMap: { [tag: string]: () => void };
  private volumeChangeListenerMap: { [tag: string]: () => void };
  private playListenerMap: { [tag: string]: () => void };
  private pauseListenerMap: { [tag: string]: () => void };
  private timeUpdateListenerMap: { [tag: string]: () => void };
  private seekListenerMap: { [tag: string]: () => void };

  constructor(
    videoElement: YouTubePlayer,
    private videoDimensions: Dimension,
  ) {
    this.player = videoElement;
    this.durationChangeListenerMap = {};
    this.volumeChangeListenerMap = {};
    this.playListenerMap = {};
    this.pauseListenerMap = {};
    this.timeUpdateListenerMap = {};
    this.seekListenerMap = {};
    // @ts-ignore
    (this.player.getIframe() as Promise<HTMLIFrameElement>).then((iframe) => {
      this.iframeElement = iframe;
    });
    this.player.addEventListener("onStateChange", this.onStateChange);
    this.player.addEventListener("onError", this.onError);
    this.detectDuration();
    this.runPropertyUpdater();
  }

  /**
   * Polls until Youtube reports a duration.
   *
   * The wait between polls is essential: getDuration resolves on the microtask
   * queue once the player is ready, so polling it without yielding starves the
   * event loop and locks up the whole page. Youtube fires "ready" even for
   * videos the uploader has blocked from being embedded, and those never report
   * a duration, so this also has to give up eventually.
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
        this.triggerDurationChangeListeners();
        return;
      }
      await delay(DURATION_POLL_INTERVAL_MS);
    }
  }

  private runPropertyUpdater() {
    this.timeUpdater = window.setInterval(async () => {
      const currentTime = await this.player.getCurrentTime();
      if (this.previousTime !== currentTime) {
        this.previousTime = currentTime;
        Object.values(this.timeUpdateListenerMap).forEach((listener) => {
          listener();
        });
      }
    }, 10);
  }

  destruct() {
    this.stopped = true;
    if (this.timeUpdater) {
      window.clearInterval(this.timeUpdater);
    }
  }

  /**
   * Unplayable videos (embedding disabled, removed, private) will never report
   * a duration, so stop polling for one instead of waiting out the timeout
   */
  onError = (): void => {
    this.stopped = true;
  };

  onStateChange = (state): void => {
    this.currentState = state.data;
    if (this.currentState === PlayerStates.PAUSED) {
      Object.values(this.pauseListenerMap).forEach((listener) => {
        listener();
      });
    } else if (this.currentState === PlayerStates.PLAYING) {
      Object.values(this.playListenerMap).forEach((listener) => {
        listener();
      });
    }
  };

  element(): HTMLElement | undefined {
    return this.iframeElement;
  }

  async volume(volume?: number): Promise<number> {
    if (volume !== undefined) {
      this.player.setVolume(volume * 100);
    }
    return Promise.resolve((await this.player.getVolume()) / 100.0);
  }

  muted(isMuted: boolean): Promise<boolean> {
    if (isMuted !== undefined) {
      if (isMuted) {
        this.player.mute();
      } else {
        this.player.unMute();
      }
    }
    return Promise.resolve(this.player.isMuted());
  }

  play() {
    this.player.playVideo();
  }

  pause() {
    this.player.pauseVideo();
  }

  paused() {
    return this.currentState === PlayerStates.PAUSED;
  }

  currentTime(time: number) {
    if (time !== undefined) {
      this.player.seekTo(time, true);
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
    if (this.videoDuration > 0) {
      this.triggerDurationChangeListeners();
    }
  }

  removeDurationChangeListener(tag = "") {
    delete this.durationChangeListenerMap[tag];
  }

  private triggerDurationChangeListeners() {
    Object.values(this.durationChangeListenerMap).forEach((listener) => {
      listener();
    });
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
    this.player.addEventListener("onVolumeChange", wrappedListener);
  }
  removeVolumeChangeListener(tag: string) {
    const wrappedListener = this.volumeChangeListenerMap[tag];
    if (wrappedListener) {
      this.player.removeEventListener("onVolumeChange", wrappedListener);
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
    this.player.addEventListener("seeked", listener);
  }

  removeSeekListener(tag: string) {
    const listener = this.seekListenerMap[tag];
    if (listener) {
      this.player.removeEventListener("seeked", listener);
    }
  }

  addPauseListener(tag: string, listener: () => void) {
    this.pauseListenerMap[tag] = listener;
  }

  removePauseListener(tag: string) {
    delete this.pauseListenerMap[tag];
  }

  async playbackRate() {
    return Promise.resolve(this.player.getPlaybackRate());
  }

  requestVideoFrameCallback(_: (_: unknown, metadata: unknown) => void) {
    // Not supported in Youtube player
  }

  async dimensions() {
    return {
      width: this.videoDimensions.width,
      height: this.videoDimensions.height,
    };
  }
}
