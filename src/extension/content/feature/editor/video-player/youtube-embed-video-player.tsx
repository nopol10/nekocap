import PlayerStates from "youtube-player/dist/constants/PlayerStates";
import { YouTubePlayer } from "youtube-player/dist/types";
import { VideoPlayer, VolumeChangeListener } from "./video-player";

export class YoutubeEmbedVideoPlayer implements VideoPlayer {
  private player: YouTubePlayer;
  private iframeElement: HTMLIFrameElement | undefined;
  private currentState: PlayerStates;
  private videoDuration: number;
  private previousTime: number;
  private previousVolume: number;
  private timeUpdater: number;

  private durationChangeListenerMap: { [tag: string]: () => void };
  private volumeChangeListenerMap: { [tag: string]: () => void };
  private playListenerMap: { [tag: string]: () => void };
  private pauseListenerMap: { [tag: string]: () => void };
  private timeUpdateListenerMap: { [tag: string]: () => void };
  private seekListenerMap: { [tag: string]: () => void };

  constructor(videoElement: YouTubePlayer) {
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
    this.detectDuration();
    this.runPropertyUpdater();
  }

  private async detectDuration() {
    let duration = 0;
    while (duration <= 0) {
      duration = await this.player.getDuration();
    }
    this.videoDuration = duration;
    this.triggerDurationChangeListeners();
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
    if (this.timeUpdater) {
      window.clearInterval(this.timeUpdater);
    }
  }

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
}
