import { afterEach, describe, expect, it, vi } from "vitest";
import { YoutubeEmbedVideoPlayer } from "./youtube-embed-video-player";

const DIMENSIONS = { width: 640, height: 360 };

/**
 * Stands in for the youtube-player proxy. getDuration resolving on the
 * microtask queue is what makes an unyielding poll loop able to starve the
 * event loop, so it is deliberately modelled as a resolved promise here.
 */
const createFakePlayer = (durations: number[]) => {
  const listeners: { [event: string]: (event: unknown) => void } = {};
  let call = 0;
  return {
    listeners,
    player: {
      getDuration: () =>
        Promise.resolve(durations[Math.min(call++, durations.length - 1)]),
      getIframe: () => Promise.resolve(undefined),
      getCurrentTime: () => Promise.resolve(0),
      addEventListener: (event: string, listener: (event: unknown) => void) => {
        listeners[event] = listener;
      },
      removeEventListener: () => undefined,
    },
  };
};

/** Resolves on a macrotask, so it can only run if the event loop is not starved. */
const nextMacrotask = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

describe("YoutubeEmbedVideoPlayer", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not starve the event loop when the duration never arrives", async () => {
    const { player } = createFakePlayer([0]);
    // @ts-ignore only the methods used by the player are stubbed
    const videoPlayer = new YoutubeEmbedVideoPlayer(player, DIMENSIONS);

    // Would never resolve if the duration poll spun without yielding, which is
    // what froze the page for videos the uploader has blocked from embedding
    await nextMacrotask();

    expect(videoPlayer.duration()).toBeUndefined();
    videoPlayer.destruct();
  });

  it("picks up the duration once the video reports one", async () => {
    const { player } = createFakePlayer([0, 0, 120]);
    // @ts-ignore only the methods used by the player are stubbed
    const videoPlayer = new YoutubeEmbedVideoPlayer(player, DIMENSIONS);

    await vi.waitFor(() => {
      expect(videoPlayer.duration()).toEqual(120);
    });
    videoPlayer.destruct();
  });

  it("notifies duration change listeners", async () => {
    const { player } = createFakePlayer([300]);
    // @ts-ignore only the methods used by the player are stubbed
    const videoPlayer = new YoutubeEmbedVideoPlayer(player, DIMENSIONS);
    const listener = vi.fn();
    videoPlayer.addDurationChangeListener("test", listener);

    await vi.waitFor(() => {
      expect(listener).toHaveBeenCalledWith(300);
    });
    videoPlayer.destruct();
  });

  it("stops polling once the video reports an error", async () => {
    const { player, listeners } = createFakePlayer([0]);
    const getDuration = vi.spyOn(player, "getDuration");
    // @ts-ignore only the methods used by the player are stubbed
    const videoPlayer = new YoutubeEmbedVideoPlayer(player, DIMENSIONS);

    await nextMacrotask();
    listeners["onError"]({});
    await nextMacrotask();
    const callsAfterError = getDuration.mock.calls.length;
    await nextMacrotask();

    expect(getDuration.mock.calls.length).toEqual(callsAfterError);
    videoPlayer.destruct();
  });
});
