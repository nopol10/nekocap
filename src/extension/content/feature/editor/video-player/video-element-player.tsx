import { VideoPlayer, VolumeChangeListener } from "./video-player";

export class VideoElementPlayer implements VideoPlayer {
  private videoElement: HTMLVideoElement;

  private durationChangeListenerMap: { [tag: string]: () => void };
  private volumeChangeListenerMap: { [tag: string]: () => void };
  private playListenerMap: { [tag: string]: () => void };
  private pauseListenerMap: { [tag: string]: () => void };
  private timeUpdateListenerMap: { [tag: string]: () => void };
  private seekListenerMap: { [tag: string]: () => void };

  constructor(videoElement: HTMLVideoElement) {
    this.videoElement = videoElement;
    this.durationChangeListenerMap = {};
    this.volumeChangeListenerMap = {};
    this.playListenerMap = {};
    this.pauseListenerMap = {};
    this.timeUpdateListenerMap = {};
    this.seekListenerMap = {};
  }
  element(): HTMLElement {
    return this.videoElement;
  }

  volume(volume?: number): Promise<number> {
    if (volume !== undefined) {
      this.videoElement.volume = volume;
    }
    return Promise.resolve(this.videoElement.volume);
  }

  muted(isMuted: boolean): Promise<boolean> {
    if (isMuted !== undefined) {
      this.videoElement.muted = isMuted;
    }
    return Promise.resolve(this.videoElement.muted);
  }

  play() {
    this.videoElement.play();
  }

  pause() {
    this.videoElement.pause();
  }

  paused() {
    return this.videoElement.paused;
  }

  currentTime(time: number) {
    if (time !== undefined) {
      this.videoElement.currentTime = time;
    }
    return this.videoElement.currentTime;
  }

  duration() {
    return this.videoElement.duration;
  }

  addDurationChangeListener(tag = "", listener: (duration: number) => void) {
    const wrappedListener = () => {
      listener(this.videoElement.duration);
    };
    this.durationChangeListenerMap[tag] = wrappedListener;
    this.videoElement.addEventListener("durationchange", wrappedListener);
    this.videoElement.addEventListener("loadedmetadata", wrappedListener);
  }

  removeDurationChangeListener(tag = "") {
    const wrappedListener = this.durationChangeListenerMap[tag];
    if (wrappedListener) {
      this.videoElement.removeEventListener("durationchange", wrappedListener);
      this.videoElement.removeEventListener("loadedmetadata", wrappedListener);
    }
  }

  addTimeUpdateListener(tag = "", listener: () => void) {
    this.timeUpdateListenerMap[tag] = listener;
    this.videoElement.addEventListener("timeupdate", listener);
  }

  removeTimeUpdateListener(tag = "") {
    const listener = this.timeUpdateListenerMap[tag];
    if (listener) {
      this.videoElement.removeEventListener("timeupdate", listener);
    }
  }

  addVolumeChangeListener(tag: string, listener: VolumeChangeListener) {
    const wrappedListener = async () => {
      listener(await this.volume());
    };
    this.volumeChangeListenerMap[tag] = wrappedListener;
    this.videoElement.addEventListener("volumechange", wrappedListener);
  }
  removeVolumeChangeListener(tag: string) {
    const wrappedListener = this.volumeChangeListenerMap[tag];
    if (wrappedListener) {
      this.videoElement.removeEventListener("volumechange", wrappedListener);
    }
  }

  addPlayListener(tag: string, listener: () => void) {
    this.playListenerMap[tag] = listener;
    this.videoElement.addEventListener("play", listener);
  }

  removePlayListener(tag: string) {
    const listener = this.playListenerMap[tag];
    if (listener) {
      this.videoElement.removeEventListener("play", listener);
    }
  }

  addSeekListener(tag: string, listener: () => void) {
    this.seekListenerMap[tag] = listener;
    this.videoElement.addEventListener("seeked", listener);
  }

  removeSeekListener(tag: string) {
    const listener = this.seekListenerMap[tag];
    if (listener) {
      this.videoElement.removeEventListener("seeked", listener);
    }
  }

  addPauseListener(tag: string, listener: () => void) {
    this.pauseListenerMap[tag] = listener;
    this.videoElement.addEventListener("pause", listener);
  }

  removePauseListener(tag: string) {
    const listener = this.pauseListenerMap[tag];
    if (listener) {
      this.videoElement.removeEventListener("pause", listener);
    }
  }

  playbackRate() {
    return Promise.resolve(this.videoElement.playbackRate);
  }

  requestVideoFrameCallback(callback: (_: unknown, metadata: unknown) => void) {
    if (this.videoElement.requestVideoFrameCallback) {
      this.videoElement.requestVideoFrameCallback(callback);
    }
  }
}
