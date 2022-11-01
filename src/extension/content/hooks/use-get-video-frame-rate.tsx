import { useCallback, useEffect, useRef, useState } from "react";

const FRAMES_TO_USE_FOR_FPS_ESTIMATION = 25;

function getAverageFps(frameTimeDifferences: number[]) {
  return (
    frameTimeDifferences.reduce((a, b) => a + b) / frameTimeDifferences.length
  );
}

/**
 * Hook that tries to detect the fps
 * Adapted from https://stackoverflow.com/a/73094937/12117100
 * TODO: Does not work for Firefox yet (frame seeking will be wrong) as it does not support requestVideoFrameCallback
 */
export const useGetVideoFrameRate = (
  videoElement: HTMLVideoElement
): number => {
  const [fps, setFps] = useState(25);
  const frameTimeDifferences = useRef<number[]>([]);
  const lastMediaTime = useRef<number>(0);
  const lastFrameNumber = useRef<number>(0);
  const frameNotSeeked = useRef<boolean>(true);

  const seekDetector = useCallback(() => {
    frameTimeDifferences.current.pop();
    frameNotSeeked.current = false;
  }, []);

  useEffect(() => {
    if (!videoElement) {
      return;
    }
    if (!("requestVideoFrameCallback" in HTMLVideoElement.prototype)) {
      return;
    }
    function ticker(_, metadata) {
      const mediaTimeDiff = Math.abs(
        metadata.mediaTime - lastMediaTime.current
      );
      const frameNumberDiff = Math.abs(
        metadata.presentedFrames - lastFrameNumber.current
      );
      const diff = mediaTimeDiff / frameNumberDiff;
      if (
        frameTimeDifferences.current.length >= FRAMES_TO_USE_FOR_FPS_ESTIMATION
      ) {
        setFps(Math.round(1 / getAverageFps(frameTimeDifferences.current)));
        // By this point, we are done
        return;
      }
      if (
        diff &&
        diff < 1 &&
        frameNotSeeked.current &&
        frameTimeDifferences.current.length <
          FRAMES_TO_USE_FOR_FPS_ESTIMATION &&
        videoElement.playbackRate === 1 &&
        document.hasFocus()
      ) {
        frameTimeDifferences.current.push(diff);
      }
      frameNotSeeked.current = true;
      lastMediaTime.current = metadata.mediaTime;
      lastFrameNumber.current = metadata.presentedFrames;
      videoElement.requestVideoFrameCallback(ticker);
    }
    videoElement.requestVideoFrameCallback(ticker);

    videoElement.addEventListener("seeked", seekDetector);
    return () => {
      videoElement.removeEventListener("seeked", seekDetector);
    };
  }, [videoElement, seekDetector]);
  return fps;
};
