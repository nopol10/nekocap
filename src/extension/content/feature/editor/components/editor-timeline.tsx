import * as React from "react";
import styled from "styled-components";
import { CaptionDataContainer } from "@/common/caption-parsers/types";
import { colors } from "@/common/colors";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Range } from "react-range";
import { Collection, CollectionCellRendererParams } from "react-virtualized";
import * as dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import {
  useAnimationFrame,
  useResize,
  useStateAutoRef,
  useStateRef,
} from "@/hooks";
import MinusCircleOutlined from "@ant-design/icons/MinusCircleOutlined";
import PlusOutlined from "@ant-design/icons/PlusOutlined";
import { TimelinePointer } from "./timeline-pointer";
import { DraggableCue } from "./draggable-cue";
import {
  CUE_HEIGHT,
  TIMEBAR_HEIGHT,
  TRACK_BASE_HEIGHT,
  TRACK_INFO_WIDTH,
} from "../constants";
import { clearSelection, roundMs } from "@/common/utils";
import { styledNoPass } from "@/common/style-utils";
dayjs.extend(duration);

const TIMELINE_PADDING = 20;

const TIMEMARKER_WIDTH = 1;

const TimelineRoot = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 0;
  margin-top: 20px;
  padding: 0 ${TIMELINE_PADDING}px 10px;
  height: 100%;
`;

const Timebar = styled.div`
  display: flex;
  height: ${TIMEBAR_HEIGHT}px;
`;

const TimebarCanvas = styledNoPass<{ actualWidth: string | number }, "canvas">(
  "canvas"
)`
  width: ${(props) => props.actualWidth}px;
  height: 100%;
`;

const TrackContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: row;
  min-height: 0;
  overflow-y: scroll;
  background-color: ${colors.white};

  .ReactVirtualized__Collection {
    overflow: hidden !important;
    &::-webkit-scrollbar {
      display: none;
      width: 0;
    }
  }
`;

const TrackCollectionContainer = styled.div`
  overflow: hidden;

  &::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
  }
`;

const IndicatorContainer = styled.div`
  position: absolute;
  height: 100%;
  width: 100%;
  pointer-events: none;
  overflow: hidden;
`;

const TrackSidebar = styled.div`
  flex: 0 0 100px;
`;

const TimeIndicator = styled.div`
  position: absolute;
  opacity: 0;
  padding: 10px;
  background-color: #000000bb;
  color: white;
  pointer-events: none;
  z-index: 10;
`;

type CueItemProps = {
  selected?: boolean;
};

const CueItem = styled(DraggableCue)<CueItemProps>`
  background-color: ${({ selected }: CueItemProps) =>
    selected ? colors.cueItemSelected : colors.cueItem};
  padding: 8px 10px;
  color: ${colors.cueItemText};
  padding: 8px 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border: 1px dotted #dedede;
  user-select: none;
  div {
    user-select: none;
  }
`;

type TrackInfoProps = {
  selected: boolean;
};

const TrackInfo = styled.div<TrackInfoProps>`
  height: ${TRACK_BASE_HEIGHT}px;
  border: solid 1px ${colors.divider};
  background-color: ${({ selected }: TrackInfoProps) =>
    selected ? colors.trackSelected : colors.white};

  &:not(:last-child) {
    border-bottom: none;
  }
  padding: 10px 5px;

  span {
    user-select: none;
  }
`;

const RANGE_TRACK_HEIGHT = 20;

const RangeTrack = styled.div`
  z-index: 1;
  position: relative;
  height: 100%;
  background-color: ${colors.divider};

  &:hover {
    background-color: ${colors.trackHover};
  }
`;

const RangeThumb = styled.div`
  width: 15px;
  height: 25px;
  background-color: ${colors.darkText};
`;

const MIN_MARKER_DISTANCE = 8;

/**
 * How many pixels per 100ms
 */
const DEFAULT_100_MS_WIDTH = 10;

const TRACK_MIN = 0;
const TRACK_MAX = 1;

const TIMEBAR_INTERVALS = [
  { duration: 100, major: 10, minWidth: 10 },
  { duration: 200, major: 10, minWidth: 20 },
  { duration: 500, major: 20, minWidth: 50 },
  { duration: 1000, major: 50, minWidth: 100 },
];

const getTimelineParameters = (scale: number, videoDurationMs: number) => {
  let markerSeparation = scale * DEFAULT_100_MS_WIDTH; // How many pixels per selected interval's duration
  let interval = TIMEBAR_INTERVALS[0];
  const minDistance = MIN_MARKER_DISTANCE;
  for (
    let i = 1;
    markerSeparation < minDistance && i < TIMEBAR_INTERVALS.length;
    i++
  ) {
    interval = TIMEBAR_INTERVALS[i];
    markerSeparation = (scale * DEFAULT_100_MS_WIDTH * interval.duration) / 100;
  }

  const markerCount = Math.ceil(videoDurationMs / interval.duration);
  const totalWidth = markerSeparation * markerCount;
  return {
    totalWidth,
    markerCount,
    markerSeparation,
    interval,
  };
};

export type SetTimelineScroll = (timeMs: number) => void;

type EditorTimelineProps = {
  show: boolean;
  caption?: CaptionDataContainer;
  /**
   * The scale of the timeline
   * 1 = width of track = width of editor. It cannot be less than 1
   */
  scale?: number;
  selectedTrack: number;
  selectedCaption: number;
  videoDurationMs: number;
  videoElement: HTMLVideoElement;
  onAddTrack?: () => void;
  onRemoveTrack?: (trackId: number) => void;
  onClickTimeline?: (
    trackId: number,
    captionId: number,
    timeMs: number
  ) => void;
  onClickCaption?: (trackId: number, captionId: number) => void;
  onNewCaption?: (trackId: number, time: number) => void;
  setTimelineScroll?: React.MutableRefObject<SetTimelineScroll>;
  onUpdateCaptionTime?: (
    trackId: number,
    captionId: number,
    startMs: number,
    endMs: number,
    finalTrackId: number
  ) => void;
};

export const EditorTimeline = ({
  caption,
  videoElement,
  scale, // Scale changes the width between every 100 ms
  selectedTrack,
  selectedCaption,
  videoDurationMs,
  onAddTrack,
  onRemoveTrack,
  onClickTimeline,
  onClickCaption,
  onNewCaption,
  setTimelineScroll: setTimelinePosition,
  onUpdateCaptionTime,
}: EditorTimelineProps) => {
  // Let the view range be 2 separate variables so we know when to rescale the timeline
  const [
    viewRangeStart,
    setViewRangeStart,
    viewRangeStartRef,
  ] = useStateAutoRef<number>(0);
  const trackScrollRef = useRef<Collection>(null);
  const trackContainerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<boolean>(false);
  const startTimeIndicatorRef = useRef<HTMLDivElement>(null);
  const endTimeIndicatorRef = useRef<HTMLDivElement>(null);
  const isPlayingRef = useRef<boolean>(false);
  const [timelineYOffset, setTimelineYOffset] = useState<number>(0);
  const [track, trackRef] = useStateRef<HTMLDivElement>(null);
  const [root, rootRef] = useStateRef<HTMLDivElement>(null);
  const [timebarCanvas, timebarCanvasRef] = useStateRef<HTMLCanvasElement>(
    null
  );

  useResize(
    root,
    () => {
      if (!timebarCanvas) {
        return 0;
      }
      const scrollOffset = trackContainerRef.current
        ? trackContainerRef.current.scrollTop
        : 0;
      const trackY = timebarCanvas.getBoundingClientRect().bottom;
      setTimelineYOffset(trackY + scrollOffset);
    },
    500,
    []
  );

  // Effect to set the timeline
  useEffect(() => {
    if (!setTimelinePosition) {
      return;
    }
    setTimelinePosition.current = (timeMs: number) => {
      setViewRangeStart(timeMs / videoDurationMs);
    };
  }, [scale, videoDurationMs]);

  useLayoutEffect(() => {
    if (trackScrollRef.current) {
      trackScrollRef.current.recomputeCellSizesAndPositions();
    }
  }, [caption, scale, videoDurationMs]);

  const timelineVisibleWidth =
    window.innerWidth - 2 * TIMELINE_PADDING - TRACK_INFO_WIDTH;

  const scrollLeft = (() => {
    const { totalWidth } = getTimelineParameters(scale, videoDurationMs);
    return viewRangeStart * (totalWidth - timelineVisibleWidth);
  })();

  const getTrackVerticalScrollOffset = () => {
    return trackContainerRef.current ? trackContainerRef.current.scrollTop : 0;
  };

  const updateTimebarCanvas = (deltaTime: number) => {
    if (!timebarCanvas) {
      return;
    }
    const context = timebarCanvas.getContext("2d");
    context.clearRect(0, 0, timelineVisibleWidth, timebarCanvas.height);

    const {
      markerSeparation,
      totalWidth,
      markerCount,
      interval,
    } = getTimelineParameters(scale, videoDurationMs);

    const visibleStartX =
      viewRangeStartRef.current * (totalWidth - timelineVisibleWidth);

    for (let markerIndex = 0; markerIndex < markerCount; markerIndex++) {
      const markerX =
        markerIndex * markerSeparation - 0.5 * TIMEMARKER_WIDTH - visibleStartX;
      if (markerX < 0) {
        continue;
      } else if (markerX > timelineVisibleWidth) {
        break;
      }
      const currentTimeMs = Math.ceil(
        ((markerX + visibleStartX) / totalWidth) * videoDurationMs
      );

      let lineHeight = 10;
      if (markerIndex % interval.major === 0) {
        lineHeight = 15;
        const durationHelper = dayjs.duration(
          roundMs(currentTimeMs),
          "milliseconds"
        );
        const text = durationHelper.format("HH:mm:ss");
        context.font = "14px Segoe UI";
        const textMeasure = context.measureText(text);
        context.fillStyle = colors.darkText;
        context.fillText(text, markerX - 0.5 * textMeasure.width, 28);
      }
      context.beginPath();
      context.moveTo(markerX, 0);
      context.lineTo(markerX, lineHeight);
      context.stroke();
    }

    // Draw current time marker
    if (videoElement) {
      const normalizedTime = videoElement.currentTime / videoElement.duration;
      const currentTimeX = Math.floor(
        normalizedTime * totalWidth - visibleStartX
      );

      if (currentTimeX >= 0) {
        context.fillStyle = colors.base;
        context.beginPath();
        context.moveTo(currentTimeX - 8, 0);
        context.lineTo(currentTimeX + 8, 0);
        context.lineTo(currentTimeX, 14);
        context.fill();
      }
      if (isPlayingRef.current) {
        /**
         * Shift the timeline automatically when playing
         * If time exceeds half of visible timeline, move the view range by the amount needed to catch up
         */
        if (currentTimeX >= timelineVisibleWidth / 2) {
          const moveDistance =
            (deltaTime * markerSeparation) / interval.duration;
          const normalizedMoveDistance =
            moveDistance / (totalWidth - timelineVisibleWidth);
          setViewRangeStart(
            Math.min(1, viewRangeStartRef.current + normalizedMoveDistance)
          );
        }
      }
    }
  };

  useAnimationFrame(updateTimebarCanvas, [
    scale,
    timebarCanvas,
    videoElement,
    isPlayingRef,
    videoDurationMs,
  ]);

  useEffect(() => {
    const handleVideoPlay = () => {
      isPlayingRef.current = true;
    };
    const handleVideoPause = () => {
      isPlayingRef.current = false;
    };
    if (videoElement) {
      videoElement.addEventListener("play", handleVideoPlay);
      videoElement.addEventListener("pause", handleVideoPause);
    }
    return () => {
      if (videoElement) {
        videoElement.removeEventListener("play", handleVideoPlay);
        videoElement.removeEventListener("pause", handleVideoPause);
      }
    };
  }, [videoElement]);

  const getVideoTimeAtMouse = useCallback(
    (mouseX: number) => {
      const timelineOffset = timebarCanvas ? timebarCanvas.offsetLeft : 0;
      const timelineRelativeMouseX = mouseX - timelineOffset;
      const { totalWidth } = getTimelineParameters(scale, videoDurationMs);
      console.log(
        "Getvideo",
        videoElement,
        videoDurationMs,
        scrollLeft,
        totalWidth,
        timelineRelativeMouseX
      );
      const durationMs =
        ((scrollLeft + timelineRelativeMouseX) / totalWidth) * videoDurationMs;
      return durationMs;
    },
    [videoElement, videoDurationMs]
  );

  const handleClickTimeline = useCallback(
    (mouseX: number, mouseY: number) => {
      if (isDragging.current) {
        return;
      }
      // Set the video to the calculated time
      const newTimeMs = getVideoTimeAtMouse(mouseX);
      const { trackId, captionId } = getSelectedTrackAndCaption(mouseX, mouseY);
      if (onClickTimeline) {
        onClickTimeline(trackId, 0, newTimeMs);
      }
    },
    [
      videoElement,
      videoDurationMs,
      timebarCanvas ? timebarCanvas.scrollLeft : -1,
    ]
  );

  const handleDoubleClickTimeline = useCallback(
    (mouseX: number, mouseY: number) => {
      clearSelection();
      // Set the video to the calculated time
      const newTimeMs = getVideoTimeAtMouse(mouseX);
      const { trackId, captionId } = getSelectedTrackAndCaption(mouseX, mouseY);
      if (trackId < 0) {
        return;
      }
      if (onNewCaption) {
        onNewCaption(trackId, newTimeMs);
      }
    },
    [videoElement, videoDurationMs]
  );

  if (!caption || !videoElement) {
    return null;
  }

  const renderTimebar = () => {
    if (!caption.tracks) {
      return null;
    }

    const handleClickAddTrack = () => {
      if (onAddTrack) {
        onAddTrack();
      }
    };

    return (
      <Timebar>
        <div
          style={{
            width: `${TRACK_INFO_WIDTH}px`,
            flex: `0 0 ${TRACK_INFO_WIDTH}px`,
          }}
        >
          <PlusOutlined onClick={handleClickAddTrack} />
        </div>
        <TimebarCanvas
          ref={timebarCanvasRef}
          width={timelineVisibleWidth}
          actualWidth={timelineVisibleWidth}
          height="30"
        />
      </Timebar>
    );
  };

  const handleClickRemoveTrack = (trackId: number) => {
    if (onRemoveTrack) {
      onRemoveTrack(trackId);
    }
  };

  const handleClickCaption = (trackId: number, captionId: number) => {
    isDragging.current = false;
    if (onClickCaption) {
      onClickCaption(trackId, captionId);
    }
    hideTimeIndicators();
  };

  const INDICATOR_Y_OFFSET = 10;
  const INDICATOR_HEIGHT = 42;

  // #region Time indicators
  const updateTimeIndicatorPositions = (
    startX: number,
    endX: number,
    trackId: number
  ) => {
    trackId = Math.min(Math.max(0, trackId), caption.tracks.length - 1);
    const scrollOffset = trackContainerRef.current
      ? trackContainerRef.current.scrollTop
      : 0;
    const startY =
      trackId * TRACK_BASE_HEIGHT +
      (TRACK_BASE_HEIGHT - CUE_HEIGHT) / 2 +
      CUE_HEIGHT +
      INDICATOR_Y_OFFSET -
      scrollOffset;

    if (startTimeIndicatorRef.current) {
      startTimeIndicatorRef.current.style.opacity = "1";
      startTimeIndicatorRef.current.style.left = `${Math.max(
        0,
        startX - scrollLeft
      )}px`;
      startTimeIndicatorRef.current.style.top = `${startY}px`;
    }
    if (endTimeIndicatorRef.current) {
      endTimeIndicatorRef.current.style.opacity = "1";
      endTimeIndicatorRef.current.style.left = `${Math.max(
        0,
        endX - scrollLeft
      )}px`;
      if (endX - startX <= 100) {
        endTimeIndicatorRef.current.style.top = `${
          startY + INDICATOR_HEIGHT + INDICATOR_Y_OFFSET
        }px`;
      } else {
        endTimeIndicatorRef.current.style.top = `${startY}px`;
      }
    }
  };

  const setIndicatorText = (
    element: HTMLDivElement,
    x: number,
    timelineWidth: number
  ) => {
    const time = (x / timelineWidth) * videoDurationMs;
    const text = dayjs
      .duration(time, "milliseconds")
      .format("HH:mm:ss:SSS")
      .split(".")[0];
    element.innerText = text;
  };

  const setStartIndicatorText = (startX: number, timelineWidth: number) => {
    if (!startTimeIndicatorRef.current) {
      return;
    }
    setIndicatorText(startTimeIndicatorRef.current, startX, timelineWidth);
  };

  const setEndIndicatorText = (endX: number, timelineWidth: number) => {
    if (!endTimeIndicatorRef.current) {
      return;
    }
    setIndicatorText(endTimeIndicatorRef.current, endX, timelineWidth);
  };

  const hideTimeIndicators = () => {
    if (startTimeIndicatorRef.current) {
      startTimeIndicatorRef.current.style.opacity = "0";
    }
    if (endTimeIndicatorRef.current) {
      endTimeIndicatorRef.current.style.opacity = "0";
    }
  };
  // #endregion

  const handleCaptionDragStart = (
    trackId: number,
    captionId: number,
    totalWidth: number,
    cueId: number
  ) => (startX: number, endX: number, currentTrackId: number) => {
    isDragging.current = true;
    setStartIndicatorText(startX, totalWidth);
    setEndIndicatorText(endX, totalWidth);
    updateTimeIndicatorPositions(startX, endX, currentTrackId);
  };

  const handleCaptionDrag = (
    trackId: number,
    captionId: number,
    totalWidth: number,
    cueId: number
  ) => (startX: number, endX: number, currentTrackId: number) => {
    setStartIndicatorText(startX, totalWidth);
    setEndIndicatorText(endX, totalWidth);
    updateTimeIndicatorPositions(startX, endX, currentTrackId);
  };

  const handleCaptionDragEnd = (trackId: number, captionId: number) => (
    startX: number,
    endX: number,
    finalTrackId: number
  ) => {
    isDragging.current = false;
    const { totalWidth } = getTimelineParameters(scale, videoDurationMs);
    const startMs = (startX / totalWidth) * videoDurationMs;
    const endMs = (endX / totalWidth) * videoDurationMs;
    if (onUpdateCaptionTime) {
      onUpdateCaptionTime(trackId, captionId, startMs, endMs, finalTrackId);
    }
    hideTimeIndicators();
  };

  const captionCueCellSizeAndPositionGetter = ({ index }) => {
    if (!caption || !caption.tracks || caption.tracks.length <= 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    const timelineParams = getTimelineParameters(scale, videoDurationMs);
    const { totalWidth } = timelineParams;

    let trackId = 0;
    let captionId = 0;
    let i = 0,
      totalCuesAtTrack = 0;
    for (i = 0, totalCuesAtTrack = 0; i < caption.tracks.length; i++) {
      const totalCuesBeforeCurrentTrack = totalCuesAtTrack;
      totalCuesAtTrack += caption.tracks[i].cues.length || 0;
      trackId = i;
      if (index < totalCuesAtTrack) {
        captionId = index - totalCuesBeforeCurrentTrack;
        break;
      }
    }

    if (i === caption.tracks.length) {
      // this is a dummy cue for the track
      return {
        x: totalWidth,
        y: (index - totalCuesAtTrack) * TRACK_BASE_HEIGHT,
        width: 1,
        height: TRACK_BASE_HEIGHT,
        isDummy: true,
        trackId,
        captionId,
      };
    }

    const cue = caption.tracks[trackId].cues[captionId];

    const startX = (cue.start / (videoDurationMs || 1)) * totalWidth;
    const endX = (cue.end / (videoDurationMs || 1)) * totalWidth;
    const y =
      trackId * TRACK_BASE_HEIGHT + (TRACK_BASE_HEIGHT - CUE_HEIGHT) / 2;
    return {
      x: startX,
      y,
      width: endX - startX,
      height: CUE_HEIGHT,
      text: cue.text,
      isDummy: false,
      trackId,
      captionId,
    };
  };

  const renderTracks = () => {
    if (!caption.tracks) {
      return null;
    }
    const { totalWidth } = getTimelineParameters(scale, videoDurationMs);
    const captionCueRenderer = ({
      index,
      isScrolling,
      key,
      style,
    }: CollectionCellRendererParams) => {
      const cellData = captionCueCellSizeAndPositionGetter({ index });
      const { isDummy, trackId, captionId, text } = cellData;

      if (isDummy) {
        return <div key={key} style={{ ...style, pointerEvents: "none" }} />;
      }
      const currentTrack = caption.tracks[trackId];

      const previousCaptionKeyPart = currentTrack.cues[captionId - 1]
        ? currentTrack.cues[captionId - 1].end
        : "0";
      const rowKey = `${key}_${trackId}_${captionId}_${currentTrack.cues[captionId].start}_${previousCaptionKeyPart}`;
      return (
        <CueItem
          key={rowKey}
          style={{ ...style }}
          selected={selectedCaption === captionId && selectedTrack === trackId}
          timelineWidth={totalWidth}
          videoDurationMs={videoDurationMs}
          trackId={trackId}
          trackCount={caption.tracks.length}
          containerYOffset={timelineYOffset}
          onClick={() => handleClickCaption(trackId, captionId)}
          onCueDragStart={handleCaptionDragStart(
            trackId,
            captionId,
            totalWidth,
            index
          )}
          onCueDrag={handleCaptionDrag(trackId, captionId, totalWidth, index)}
          onCueDragEnd={handleCaptionDragEnd(trackId, captionId)}
          getTrackVerticalScrollOffset={getTrackVerticalScrollOffset}
        >
          {text}
        </CueItem>
      );
    };

    const trackContainerHeight = caption.tracks.length * TRACK_BASE_HEIGHT + 1;
    const cueCount =
      caption.tracks.reduce((acc, track) => {
        if (!track.cues) {
          return acc;
        }
        return acc + track.cues.length;
      }, 0) + caption.tracks.length; // +track count for dummy cues to allow scrolling
    return (
      <TrackContainer ref={trackContainerRef}>
        <TrackSidebar>
          {caption.tracks.map((track, trackIndex) => {
            return (
              <TrackInfo
                key={`track-info-${trackIndex}`}
                selected={trackIndex === selectedTrack}
              >
                <span>Track {trackIndex + 1}</span>
                <div>
                  <MinusCircleOutlined
                    onClick={() => handleClickRemoveTrack(trackIndex)}
                  />
                </div>
              </TrackInfo>
            );
          })}
        </TrackSidebar>
        <TrackCollectionContainer
          ref={trackRef}
          style={{ height: `${trackContainerHeight}px` }}
        >
          <IndicatorContainer>
            <TimeIndicator ref={startTimeIndicatorRef} />
            <TimeIndicator ref={endTimeIndicatorRef} />
          </IndicatorContainer>
          <Collection
            ref={trackScrollRef}
            cellCount={cueCount}
            scrollLeft={scrollLeft}
            cellRenderer={captionCueRenderer}
            cellSizeAndPositionGetter={captionCueCellSizeAndPositionGetter}
            height={trackContainerHeight}
            width={timelineVisibleWidth}
          />
        </TrackCollectionContainer>
      </TrackContainer>
    );
  };
  const handleChangeViewRange = (newRange: number[]) => {
    setViewRangeStart(newRange[0]);
  };

  const renderRangeSelector = () => {
    return (
      <div
        style={{
          marginLeft: `${TRACK_INFO_WIDTH}px`,
          flex: `0 0 ${RANGE_TRACK_HEIGHT}px`,
        }}
      >
        <Range
          allowOverlap={false}
          step={0.001}
          min={TRACK_MIN}
          max={TRACK_MAX}
          values={[viewRangeStart]}
          onChange={handleChangeViewRange}
          draggableTrack={false}
          renderTrack={({ props, children }) => {
            return (
              // eslint-disable-next-line react/prop-types
              <RangeTrack {...props} style={{ ...props.style }}>
                {children}
              </RangeTrack>
            );
          }}
          renderThumb={({ props }) => {
            return <RangeThumb {...props}></RangeThumb>;
          }}
        />
      </div>
    );
  };

  const getSelectedTrackAndCaption = (mouseX: number, mouseY: number) => {
    let clickedTrack = -1;
    // Get the selected track
    if (track) {
      const scrollOffset = trackContainerRef.current
        ? trackContainerRef.current.scrollTop
        : 0;
      const trackY = timebarCanvas.getBoundingClientRect().bottom;
      const relativeY = mouseY - trackY + scrollOffset;
      clickedTrack = Math.floor(relativeY / TRACK_BASE_HEIGHT);
    }

    return { trackId: clickedTrack, captionId: 0 };
  };

  return (
    <TimelineRoot ref={rootRef}>
      {renderTimebar()}
      {renderTracks()}
      {renderRangeSelector()}
      <TimelinePointer
        hoverElements={[timebarCanvas, track]}
        onMouseUp={handleClickTimeline}
        onDoubleClick={handleDoubleClickTimeline}
        dependencies={[
          caption ? caption.tracks : undefined,
          scale,
          viewRangeStart,
        ]}
      />
    </TimelineRoot>
  );
};
