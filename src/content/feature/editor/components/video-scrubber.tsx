import React, { useCallback, useEffect, useRef } from "react";
import { useDrag, useResize, useStateRef } from "@/hooks";
import styled from "styled-components";
import { Coords } from "@/common/types";
import * as dayjs from "dayjs";
import { colors } from "@/common/colors";

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
  z-index: 100;
`;

const INDICATOR_WIDTH = 100;

type VideoScrubberProps = {
  videoElement: HTMLVideoElement;
  onSeek?: (timeSeconds: number) => void;
};

export const VideoScrubber = ({ videoElement, onSeek }: VideoScrubberProps) => {
  const [scrubber, scrubberRef] = useStateRef<HTMLDivElement>(null);
  const [
    scrubberProgressBar,
    scrubberProgressBarRef,
  ] = useStateRef<HTMLDivElement>(null);
  const [scrubberPlayhead, scrubberPlayheadRef] = useStateRef<HTMLDivElement>(
    null
  );
  const [timeIndicator, timeIndicatorRef] = useStateRef<HTMLDivElement>(null);

  const scrubberWidth = useRef<number>(0);

  const duration = useRef<number>(0);
  const wasPaused = useRef<boolean>(false);

  const handleTimeUpdate = () => {
    const playheadX =
      (videoElement.currentTime / duration.current) * scrubberWidth.current;
    scrubberPlayhead.style.left = `${playheadX}px`;
    scrubberProgressBar.style.width = `${playheadX}px`;
  };

  useResize(
    scrubber,
    () => {
      scrubberWidth.current = scrubber.offsetWidth;
      handleTimeUpdate();
    },
    100,
    [
      scrubberWidth,
      scrubberPlayhead,
      scrubberProgressBar,
      videoElement,
      duration,
    ]
  );

  const handlePlayheadDragStart = useCallback(
    (x: number, y: number) => {
      let actualX = parseInt(scrubberPlayhead.style.left) || 0;
      wasPaused.current = videoElement.paused;
      videoElement.pause();
      return { x: actualX, y };
    },
    [scrubberPlayhead, videoElement, wasPaused]
  );

  const setTimeIndicator = (x: number, time: number) => {
    let indicatorX = Math.min(
      Math.max(INDICATOR_WIDTH / 2, x),
      scrubberWidth.current - INDICATOR_WIDTH / 2
    );
    timeIndicator.style.opacity = "1";
    timeIndicator.style.left = `${indicatorX}px`;
    timeIndicator.innerText = dayjs
      .duration(time, "seconds")
      .format("HH:mm:ss:SSS")
      .split(".")[0];
  };

  const hideTimeIndicator = () => {
    timeIndicator.style.opacity = "0";
  };

  const handlePlayheadDragMove = useCallback(
    (start: Coords, corrected: Coords, delta: Coords) => {
      const x = Math.min(
        Math.max(0, corrected.x + delta.x),
        scrubberWidth.current
      );
      scrubberPlayhead.style.left = `${x}px`;
      if (!videoElement) {
        return;
      }
      videoElement.currentTime =
        (x / scrubberWidth.current) * videoElement.duration || 0;

      onSeek(videoElement.currentTime);

      setTimeIndicator(x, videoElement.currentTime);
    },
    [scrubberWidth, scrubberPlayhead, timeIndicator, videoElement]
  );

  const handlePlayheadDragStop = useCallback(
    (start: Coords, corrected: Coords, delta: Coords) => {
      hideTimeIndicator();
      if (!wasPaused.current) {
        videoElement.play();
      }
    },
    [timeIndicator, wasPaused, videoElement]
  );

  useDrag(
    scrubberPlayhead,
    handlePlayheadDragStart,
    handlePlayheadDragMove,
    handlePlayheadDragStop,
    true,
    [scrubberWidth, scrubberPlayhead, timeIndicator, videoElement]
  );

  useEffect(() => {
    if (scrubber) {
      scrubberWidth.current = scrubber.offsetWidth;
    }

    const handleDurationChange = () => {
      duration.current = videoElement.duration;
    };

    if (videoElement) {
      if (videoElement.duration) {
        // For cases where the video's duration is loaded before this hook runs
        handleDurationChange();
      }
      videoElement.addEventListener("durationchange", handleDurationChange);
      videoElement.addEventListener("loadedmetadata", handleDurationChange);
      videoElement.addEventListener("timeupdate", handleTimeUpdate);
    }
    return () => {
      if (videoElement) {
        videoElement.removeEventListener(
          "durationchange",
          handleDurationChange
        );
        videoElement.removeEventListener(
          "loadedmetadata",
          handleDurationChange
        );
        videoElement.removeEventListener("timeupdate", handleTimeUpdate);
      }
    };
  }, [videoElement, scrubber, scrubberProgressBar, scrubberPlayhead, duration]);

  const handleClickScrubber = (event: React.MouseEvent) => {
    if (!scrubber || !videoElement) {
      return;
    }
    const { x, width } = scrubber.getBoundingClientRect();
    videoElement.currentTime =
      ((event.clientX - x) / width) * videoElement.duration;
    onSeek(videoElement.currentTime);
  };

  const handleMouseOverScrubber = (event: React.MouseEvent) => {
    if (!scrubber || !videoElement) {
      return;
    }
    const { x: scrubberLeft } = scrubber.getBoundingClientRect();
    const x = Math.min(
      Math.max(0, event.clientX - scrubberLeft),
      scrubberWidth.current
    );
    setTimeIndicator(x, (x / scrubberWidth.current) * videoElement.duration);
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
