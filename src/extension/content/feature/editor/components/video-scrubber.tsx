import { colors } from "@/common/colors";
import { Coords } from "@/common/types";
import { useDrag, useResize, useStateRef } from "@/hooks";
import * as dayjs from "dayjs";
import React, { useCallback, useEffect, useRef } from "react";
import styled from "styled-components";
import { VideoPlayer } from "../video-player/video-player";

const VideoScrubberHoverArea = styled.div`
  padding: 10px 0;
`;

const VideoScrubberRoot = styled.div`
  position: relative;
  height: 8px;
  margin: 5px 10px;
  background-color: #dadada;
  user-select: none;
`;

const ScrubberProgressBar = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background-color: #ff4c4c;
  user-select: none;
`;

const Playhead = styled.div`
  position: absolute;
  width: 15px;
  height: 15px;
  background-color: #9e0404;
  border-radius: 50%;
  left: 0;
  top: 50%;
  transform: translate(-50%, -50%);
  user-select: none;
`;

const TimeIndicator = styled.div`
  padding: 5px 10px;
  top: -30px;
  left: 0;
  opacity: 0;
  position: absolute;
  background-color: #000000;
  color: ${colors.white};
  transform: translate(-50%, -50%);
  pointer-events: none;
  user-select: none;
  white-space: nowrap;
  z-index: 100;
`;

const INDICATOR_WIDTH = 100;

const TAG = "scrubber";

type VideoScrubberProps = {
  // videoElement: HTMLVideoElement;
  videoPlayer: VideoPlayer;
  onSeek?: (timeSeconds: number) => void;
};

export const VideoScrubber = ({ videoPlayer, onSeek }: VideoScrubberProps) => {
  const [scrubber, scrubberRef] = useStateRef<HTMLDivElement>();
  const [scrubberProgressBar, scrubberProgressBarRef] =
    useStateRef<HTMLDivElement>();
  const [scrubberPlayhead, scrubberPlayheadRef] = useStateRef<HTMLDivElement>();
  const [timeIndicator, timeIndicatorRef] = useStateRef<HTMLDivElement>();

  const scrubberWidth = useRef<number>(0);

  const duration = useRef<number>(0);
  const wasPaused = useRef<boolean>(false);

  const handleTimeUpdate = useCallback(() => {
    if (!videoPlayer) {
      return;
    }
    const playheadX =
      (videoPlayer.currentTime() / duration.current) * scrubberWidth.current;
    if (scrubberPlayhead) scrubberPlayhead.style.left = `${playheadX}px`;
    if (scrubberProgressBar) scrubberProgressBar.style.width = `${playheadX}px`;
  }, [scrubberPlayhead, scrubberProgressBar, videoPlayer]);

  useResize(
    scrubber,
    () => {
      scrubberWidth.current = scrubber?.offsetWidth || 0;
      handleTimeUpdate();
    },
    100,
    [
      scrubberWidth,
      scrubberPlayhead,
      scrubberProgressBar,
      videoPlayer,
      duration,
    ],
  );

  const handlePlayheadDragStart = useCallback(
    (x: number, y: number) => {
      const actualX = parseInt(scrubberPlayhead?.style.left || "0");
      wasPaused.current = videoPlayer.paused();
      videoPlayer.pause();
      return { x: actualX, y };
    },
    [scrubberPlayhead, videoPlayer, wasPaused],
  );

  const setTimeIndicator = useCallback(
    (x: number, time: number) => {
      if (!timeIndicator) {
        return;
      }
      const indicatorX = Math.min(
        Math.max(INDICATOR_WIDTH / 2, x),
        scrubberWidth.current - INDICATOR_WIDTH / 2,
      );
      timeIndicator.style.opacity = "1";
      timeIndicator.style.left = `${indicatorX}px`;
      timeIndicator.innerText = dayjs
        .duration(time, "seconds")
        .format("HH:mm:ss:SSS")
        .split(".")[0];
    },
    [timeIndicator],
  );

  const hideTimeIndicator = useCallback(() => {
    if (timeIndicator) timeIndicator.style.opacity = "0";
  }, [timeIndicator]);

  const handlePlayheadDragMove = useCallback(
    (start: Coords, corrected: Coords, delta: Coords) => {
      const x = Math.min(
        Math.max(0, corrected.x + delta.x),
        scrubberWidth.current,
      );
      if (scrubberPlayhead) scrubberPlayhead.style.left = `${x}px`;
      if (!videoPlayer) {
        return;
      }
      const newTime = (x / scrubberWidth.current) * videoPlayer.duration() || 0;
      videoPlayer.currentTime(newTime);

      onSeek?.(newTime);

      setTimeIndicator(x, newTime);
    },
    [scrubberPlayhead, videoPlayer, onSeek, setTimeIndicator],
  );

  const handlePlayheadDragStop = useCallback(
    (start: Coords, corrected: Coords, delta: Coords) => {
      hideTimeIndicator();
      if (!wasPaused.current) {
        videoPlayer.play();
      }
    },
    [hideTimeIndicator, videoPlayer],
  );

  useDrag(
    scrubberPlayhead,
    handlePlayheadDragStart,
    handlePlayheadDragMove,
    handlePlayheadDragStop,
    true,
    [scrubberWidth, scrubberPlayhead, timeIndicator, videoPlayer],
  );

  useEffect(() => {
    if (scrubber) {
      scrubberWidth.current = scrubber.offsetWidth;
    }

    const handleDurationChange = () => {
      duration.current = videoPlayer.duration();
    };

    if (videoPlayer) {
      if (videoPlayer.duration()) {
        // For cases where the video's duration is loaded before this hook runs
        handleDurationChange();
      }
      videoPlayer.addDurationChangeListener(TAG, handleDurationChange);
      videoPlayer.addTimeUpdateListener(TAG, handleTimeUpdate);
    }
    return () => {
      if (videoPlayer) {
        videoPlayer.removeDurationChangeListener(TAG);
        videoPlayer.removeTimeUpdateListener(TAG);
      }
    };
  }, [
    videoPlayer,
    scrubber,
    scrubberProgressBar,
    scrubberPlayhead,
    duration,
    handleTimeUpdate,
  ]);

  const handleClickScrubber = (event: React.MouseEvent) => {
    if (!scrubber || !videoPlayer) {
      return;
    }
    const { x, width } = scrubber.getBoundingClientRect();
    const newTime = ((event.clientX - x) / width) * videoPlayer.duration();
    videoPlayer.currentTime(newTime);
    onSeek?.(newTime);
  };

  const handleMouseOverScrubber = (event: React.MouseEvent) => {
    if (!scrubber || !videoPlayer) {
      return;
    }
    const { x: scrubberLeft } = scrubber.getBoundingClientRect();
    const x = Math.min(
      Math.max(0, event.clientX - scrubberLeft),
      scrubberWidth.current,
    );
    setTimeIndicator(x, (x / scrubberWidth.current) * videoPlayer.duration());
  };

  return (
    <VideoScrubberHoverArea
      onMouseOver={handleMouseOverScrubber}
      onMouseMove={handleMouseOverScrubber}
      onMouseOut={hideTimeIndicator}
      onMouseDown={handleClickScrubber}
    >
      <VideoScrubberRoot ref={scrubberRef}>
        <ScrubberProgressBar ref={scrubberProgressBarRef} />
        <Playhead ref={scrubberPlayheadRef} />
        <TimeIndicator ref={timeIndicatorRef} />
      </VideoScrubberRoot>
    </VideoScrubberHoverArea>
  );
};
